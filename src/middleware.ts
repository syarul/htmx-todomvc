import { type Request, type Response, type NextFunction } from 'express'
// import { type filter } from './types'
import { renderToString } from 'react-dom/server'
// import { readFileSync, writeFileSync } from 'fs'
// import path from 'path'
import Redis from 'ioredis'
import * as dotenv from 'dotenv'

dotenv.config()
// eslint-disable-next-line @typescript-eslint/no-var-requires
const rq = require('requrse')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const rqRedis = require('rq-redis')

const redis = new Redis(`rediss://default:${process.env.REDIS_KEY}@us1-capital-badger-41133.upstash.io:41133`)

const redisKey = `${process.env.REDIS_MKEY}_todos`
const memberKey = `${process.env.REDIS_MKEY}_todo_ids`

const redisKeyFilter = `${process.env.REDIS_MKEY}_filters`
const memberKeyFilter = `${process.env.REDIS_MKEY}_filter_ids`

const modelTodo = {
  rq,
  redis,
  redisKey,
  memberKey,
  options: {
    methods: {
      create: 'create,data|id',
      update: 'update,id|data|id',
      remove: 'remove,id|id',
      async all () {
        return await Promise.all((await redis.smembers(memberKey)).sort().map(async id => {
          const res = await redis.hgetall(`${redisKey}:${id}`)
          return res
        }))
      }
    }
  }
}

const modelFilter = {
  rq,
  redis,
  redisKey: redisKeyFilter,
  memberKey: memberKeyFilter,
  options: {
    methods: {
      create: 'create,data|name',
      update: 'update,id|data|name',
      remove: 'remove,id|name',
      async all () {
        return await Promise.all((await redis.smembers(memberKeyFilter)).sort().map(async id => {
          const res = await redis.hgetall(`${redisKeyFilter}:${id}`)
          return res
        }))
      }
    }
  }
}

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
export const todos = 'todos' // path.join('/tmp', 'todos.json')
export const filters = 'filters' // path.join('/tmp', 'urls.json')

type Data = Record<string, any>

const normalize = (d: any): Data => {
  const o: Data = {}
  for (const attr in d) {
    if (d[attr] === 'false' || d[attr] === 'true') {
      o[attr] = JSON.parse(d[attr])
    } else {
      o[attr] = d[attr]
    }
  }
  return o
}

const store = async ({ file, update, selectorValue, action = 'all' }: Data): Promise<any> => {
  const model: Data = {
    todos: modelTodo,
    filters: modelFilter
  }
  const selectedModel = model[file]
  if (action === 'create') {
    const { data: { getMemberKeys: { keys } } }: { data: { getMemberKeys: { keys: any[] } } } = await rqRedis({
      data: {
        getMemberKeys: '*'
      }
    }, selectedModel)
    let id = '0'
    keys.sort((a: any, b: any) => a - b) // need sorted, redis may send unsorted memberKeys
    if (keys.length) {
      id = `${parseInt(keys.pop()) + 1}`
    }
    const res = await rqRedis({
      [file]: {
        [action]: {
          $params: {
            data: { ...update, id }
          },
          ...(file === 'todos' ? { id: 1, text: 1, completed: 1 } : { name: 1 })
        }
      }
    }, selectedModel)
    return normalize(res[file][action])
  } else if (action === 'remove') {
    await rqRedis({
      [file]: {
        [action]: {
          $params: {
            id: selectorValue
          }
        }
      }
    }, selectedModel)
  } else if (action === 'get') {
    const res = await rqRedis({
      [file]: {
        [action]: {
          $params: {
            id: selectorValue
          },
          id: 1,
          text: 1,
          completed: 1
        }
      }
    }, selectedModel)
    return normalize(res[file][action])
  } else if (action === 'update') {
    await rqRedis({
      [file]: {
        [action]: {
          $params: {
            id: selectorValue,
            data: update
          }
        }
      }
    }, selectedModel)
  } else {
    const { data } = await rqRedis({ data: { [action]: '*' } }, selectedModel)
    return data[action].map(normalize)
  }
}

const catcher = (err: any): void => { console.error(err) }

// do once to store filters in db
// const urls: filter[] = [
//   { url: '#/', name: 'all', selected: true },
//   { url: '#/active', name: 'active', selected: false },
//   { url: '#/completed', name: 'completed', selected: false }
// ]
// const init = async (): Promise<any> => {
//   for (const update of urls) {
//     await store({ file: filters, update, action: 'create' })
//   }
// }
// init().catch(catcher)

export function storeMiddleware (req: Request, res: Response, next: NextFunction): void {
  req.body = req.body || {}
  const load = async (): Promise<void> => {
    for (const file of [todos, filters]) {
      if (req.query.id && file === todos) {
        await store({ file, selectorValue: req.query.id, action: 'get' }).then(result => {
          req.body.todo = result
        })
      } else {
        await store({ file }).then(result => {
          req.body[file] = result || []
        }).catch(catcher)
      }
    }
  }
  load().then(() => { next() }).catch(catcher)
}

export function updateStoreMiddleware (file: string, update: any, req: Request, next: NextFunction, action?: string, selectorValue?: string): void {
  store({ file, update, selectorValue, action }).then((result) => {
    if (file === todos && action === 'create') {
      req.body.todo = result
    }
    next()
  }).catch(catcher)
}
