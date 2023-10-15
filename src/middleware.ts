import { type Request, type Response, type NextFunction } from 'express'
import { type filter } from './types'
import { renderToString } from 'react-dom/server'
import { readFileSync, writeFileSync } from 'fs'
import path from 'path'

export function processResponse (req: Request, res: Response, next: NextFunction): void {
  const originalSend: (body?: any) => Response = res.send.bind(res)
  res.send = function (data: any): Response {
    if (typeof data === 'string') {
      return originalSend(data)
    }
    return originalSend(renderToString(data))
  }
  next()
}

export function cacheControl (req: Request, res: Response, next: NextFunction): void {
  res.setHeader('Content-Type', 'text/html')
  res.setHeader('Cache-Control', 's-max-age=1, stale-while-revalidate')
  next()
}

// replaceable with database model
export const todos = path.join('/tmp', 'todos.json')
export const filters = path.join('/tmp', 'urls.json')

type Data = Record<string, any>
// simulate async storage
const store = async (file: string, data?: any, selector?: string, selectorValue?: string, remove?: boolean): Promise<any> => {
  if (data) {
    const dataStore: Data[] = JSON.parse(readFileSync(file, 'utf-8'))
    if (!selector && !(data instanceof Array)) {
      writeFileSync(file, JSON.stringify([...dataStore, data]))
    } else if (selector) {
      if (!remove) {
        writeFileSync(file, JSON.stringify(dataStore.map((d: Data) => d[selector] === selectorValue ? { ...d, ...data } : d)))
      } else {
        writeFileSync(file, JSON.stringify(dataStore.filter((d: Data) => d[selector] !== selectorValue)))
      }
    } else {
      writeFileSync(file, JSON.stringify(data))
    }
    return dataStore
  }
  return JSON.parse(readFileSync(file, 'utf-8'))
}

const urls: filter[] = [
  { url: '#/', name: 'all', selected: true },
  { url: '#/active', name: 'active', selected: false },
  { url: '#/completed', name: 'completed', selected: false }
]

const catcher = (err: any): void => { console.error(err) }

export function storeMiddleware (req: Request, res: Response, next: NextFunction): void {
  req.body = req.body || {}
  Promise.all([
    store(todos).then(todos => {
      if (req.query.id) {
        req.body.todo = todos.find((d: Data) => d.id === req.query.id)
      } else {
        req.body.todos = todos || []
      }
    }).catch(catcher),
    store(filters).then(filters => {
      req.body.filters = filters || urls
    }).catch(catcher)
  ]).then(() => {
    next()
  }).catch(catcher)
}

export function updateStoreMiddleware (target: string, data: any, next: NextFunction, selector?: string, selectorValue?: string, remove?: boolean): void {
  store(target, data, selector, selectorValue, remove).then(() => { next() }).catch(catcher)
}
