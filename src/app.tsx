import React from 'react'
import { type Router, type Response } from 'express'
import { type Request, type Todo, type filter } from './types'
import { EditTodo, MainTemplate, TodoFilter, TodoItem, TodoList } from './components'
import Redis from 'ioredis'
import * as dotenv from 'dotenv'
dotenv.config()
// eslint-disable-next-line @typescript-eslint/no-var-requires
const rq = require('requrse')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const rqRedis = require('rq-redis')

const redis = new Redis(`rediss://default:${process.env.REDIS_KEY}@willing-cowbird-38871.upstash.io:38871`)

const redisKey = 'todos'
const memberKey = 'todo_ids'

const modelOptions = {
  rq,
  redis,
  redisKey,
  memberKey,
  options: {
    methods: {
      async todos () {
        return await Promise.all((await redis.smembers(memberKey)).sort().map(async id => {
          return await redis.hgetall(`${redisKey}:${id}`)
        }))
      }
    }
  }
}

let urls: filter[] = [
  { url: '#/', name: 'all', selected: true },
  { url: '#/active', name: 'active', selected: false },
  { url: '#/completed', name: 'completed', selected: false }
]

export default (router: Router): void => {
  router.get('/', (req: Request, res: Response) => {
    rqRedis({
      data: {
        todos: '*'
      }
    }, modelOptions).then(({ data: { todos } }: { data: { todos: Todo[] } }) =>
      res.send(<MainTemplate todos={todos} filters={urls} />)
    )
  })

  router.get('/get-hash', (req: Request, res: Response) => {
    const hash = req.query.hash || 'all'
    const name = hash.slice(2).length ? hash.slice(2) : 'all'
    urls = urls.map(f => ({ ...f, selected: f.name === name }))
    res.send(<TodoFilter filters={urls} />)
  })

  router.get('/learn.json', (req: Request, res: Response) => res.send('{}'))

  router.get('/update-counts', (req: Request, res: Response) => {
    rqRedis({
      data: {
        todos: '*'
      }
    }, modelOptions).then(({ data: { todos } }: { data: { todos: Todo[] } }) => {
      const uncompleted = todos.filter(c => c.completed === '')
      res.send(<><strong>{uncompleted.length}</strong>{` item${uncompleted.length === 1 ? '' : 's'} left`}</>)
    })
  })

  router.patch('/toggle-todo', (req: Request, res: Response) => {
    const { id, completed } = req.query
    rqRedis({
      todo: {
        update: {
          $params: {
            id,
            data: {
              completed
            }
          },
          id: 1,
          text: 1,
          completed: 1
        }
      }
    }, modelOptions).then(({ todo: { update } }: { todo: { update: Todo } }) => res.send(<TodoItem {...update}/>))
  })

  router.patch('/edit-todo', (req: Request, res: Response) => {
    const { id, editing } = req.query
    // the trick is to only target the input element,
    // since there's bunch _hyperscript scope events happening here
    // we don't want to swap and loose the selectors.
    // Could also move it to the parentNode
    rqRedis({
      todo: {
        get: {
          $params: {
            id
          },
          id: 1,
          text: 1
        }
      }
    }, modelOptions).then(({ todo: { get } }: { todo: { get: Todo } }) => res.send(<EditTodo {...get} editing={editing}/>))
  })

  router.get('/update-todo', (req: Request, res: Response) => {
    // In a proper manner, this should always be sanitized
    const { id, text, key } = req.query
    rqRedis({
      todo: {
        update: {
          $params: {
            id,
            ...(key === '13' ? { data: { text } } : { data: {} }) // on enter update, ignore the rest
          },
          id: 1,
          text: 1,
          completed: 1
        }
      }
    }, modelOptions).then(({ todo: { update } }: { todo: { update: Todo } }) => res.send(<TodoItem {...update}/>))
  })

  router.delete('/remove-todo', (req: Request, res: Response) => {
    rqRedis({
      todo: {
        remove: {
          $params: { id: req.query.id },
          id: 1
        }
      }
    }, modelOptions).then(() => res.send(''))
  })

  router.get('/new-todo', (req: Request, res: Response) => {
    // In a proper manner, this should always be sanitized
    const { text } = req.query
    rqRedis({
      data: {
        getMemberKeys: '*'
      }
    }, modelOptions).then(({ data: { getMemberKeys: { keys } } }: { data: { getMemberKeys: { keys: any[] } } }) => {
      let id = '0'
      keys.sort((a: any, b: any) => a - b) // need sorted, redis may send unsorted memberKeys
      if (keys.length) {
        id = `${parseInt(keys.pop()) + 1}`
      }
      // ignore editing since its a pure client state handler that has nothing to do with the data
      const todo = { id, text, completed: '' }
      rqRedis({
        todo: {
          create: {
            $params: {
              data: todo,
              id: 1 // this will be used as secondary key
            }
          }
        }
      }, modelOptions).then(() => res.send(<TodoItem {...todo}/>))
    })
  })

  router.get('/todo-filter', (req: Request, res: Response) => {
    urls = urls.map(f => ({ ...f, selected: f.name === req.query.id }))
    res.send(<TodoFilter filters={urls} />)
  })

  router.get('/todo-list', (req: Request, res: Response) => {
    rqRedis({
      data: {
        todos: '*'
      }
    }, modelOptions).then(({ data: { todos } }: { data: { todos: Todo[] } }) =>
      res.send(<TodoList todos={todos} filters={urls} />)
    )
  })

  router.get('/toggle-all', (req: Request, res: Response) => {
    rqRedis({
      data: {
        todos: '*'
      }
    }, modelOptions).then(({ data: { todos } }: { data: { todos: Todo[] } }) =>
      res.send(`${todos.filter(t => t.completed === '').length === 0 && todos.length !== 0}`)
    )
  })

  router.get('/completed', (req: Request, res: Response) => {
    rqRedis({
      data: {
        todos: '*'
      }
    }, modelOptions).then(({ data: { todos } }: { data: { todos: Todo[] } }) =>
      res.send(todos.filter(t => t.completed === 'completed').map(t => t.id).toString())
    )
  })
}
