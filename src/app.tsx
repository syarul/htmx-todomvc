import React from 'react'
import crypto from 'crypto'
import { type Router, type Response } from 'express'
import { type Request, type Todo, type filter } from './types'
import { EditTodo, MainTemplate, TodoFilter, TodoItem, TodoList } from './components'

let todos: Todo[] = []

let urls: filter[] = [
  { url: '#/', name: 'all', selected: true },
  { url: '#/active', name: 'active', selected: false },
  { url: '#/completed', name: 'completed', selected: false }
]

export default (router: Router): void => {
  router.get('/', (req: Request, res: Response) => res.send(<MainTemplate todos={todos} filters={urls} />))

  router.get('/get-hash', (req: Request, res: Response) => {
    const hash = req.query.hash.length ? req.query.hash : '/#all'
    urls = urls.map(f => ({ ...f, selected: f.name === hash.slice(2) }))
    res.send(<TodoFilter filters={urls} />)
  })

  router.get('/learn.json', (req: Request, res: Response) => res.send('{}'))

  router.get('/update-counts', (req: Request, res: Response) => {
    const uncompleted = todos.filter(c => !c.completed)
    res.send(<><strong>{uncompleted.length}</strong>{` item${uncompleted.length === 1 ? '' : 's'} left`}</>)
  })

  router.patch('/toggle-todo', (req: Request, res: Response) => {
    const { id } = req.query
    let completed = false
    let todo: Todo = { id }
    todos = todos.map(t => {
      if (t.id === id) {
        completed = !t.completed
        todo = { ...t, completed }
        return todo
      }
      return t
    })
    res.send(<TodoItem {...todo}/>)
  })

  router.patch('/edit-todo', (req: Request, res: Response) =>
    res.send(<EditTodo {...req.query} editing={true}/>)
  )

  router.get('/update-todo', (req: Request, res: Response) => {
    // In a proper manner, this should always be sanitized
    const { id, text } = req.query
    let todo: Todo = { id }
    todos = todos.map(t => {
      if (t.id === id) {
        todo = { ...t, text }
        return todo
      }
      return t
    })
    res.send(<TodoItem {...todo} />)
  })

  router.delete('/remove-todo', (req: Request, res: Response) => {
    todos = todos.filter(t => t.id !== req.query.id)
    res.send('')
  })

  router.get('/new-todo', (req: Request, res: Response) => {
  // In a proper manner, this should always be sanitized
    const { text } = req.query
    const todo = { id: crypto.randomUUID(), text, completed: false }
    todos.push(todo)
    res.send(<TodoItem {...todo}/>)
  })

  router.get('/todo-filter', (req: Request, res: Response) => {
    urls = urls.map(f => ({ ...f, selected: f.name === req.query.id }))
    res.send(<TodoFilter filters={urls} />)
  })

  router.get('/todo-list', (req: Request, res: Response) => res.send(<TodoList todos={todos} filters={urls} />))
  // this can be migrated to FE
  router.get('/toggle-all', (req: Request, res: Response) => {
    res.send(`${todos.filter(t => !t.completed).length === 0 && todos.length !== 0}`)
  })
  // this can be migrated to FE
  router.get('/completed', (req: Request, res: Response) => {
    res.send(todos.filter(t => t.completed).length ? 'block' : 'none')
  })
}
