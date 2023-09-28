import React from 'react'
import crypto from 'crypto'
import { type Router, type Response } from 'express'
import { type Request, type Todo, type filter } from './types'
import { MainTemplate, TodoFilter, TodoItem, TodoList } from './components'

// An empty array of Todo objects and just a simple in memory store
// feel free to change if you want this to be from database instead
let todos: Todo[] = []

let urls: filter[] = [
  { url: '#/', name: 'all', selected: true },
  { url: '#/active', name: 'active', selected: false },
  { url: '#/completed', name: 'completed', selected: false }
]

const uuid = () => {
  /* jshint bitwise:false */
  let i, random
  let uuid = ''
  for (i = 0; i < 32; i++) {
    random = Math.random() * 16 | 0
    if (i === 8 || i === 12 || i === 16 || i === 20) {
      uuid += '-'
    }
    uuid += (i === 12 ? 4 : (i === 16 ? (random & 3 | 8) : random))
      .toString(16)
  }
  return uuid
}

export default (router: Router): void => {
  router.get('/', (req: Request, res: Response) => res.send(<MainTemplate todos={todos} filters={urls} />))

  router.get('/get-hash', (req: Request, res: Response) => {
    const hash = req.query.hash || 'all'
    const name = hash.slice(2).length ? hash.slice(2) : 'all'
    urls = urls.map(f => ({ ...f, selected: f.name === name }))
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

  router.delete('/remove-todo', (req: Request, res: Response) => {
    todos = todos.filter(t => t.id !== req.query.id)
    res.send('')
  })

  router.get('/new-todo', (req: Request, res: Response) => {
  // In a proper manner, this should always be sanitized
    const { text } = req.query
    const todo = { id: uuid(), text, completed: false, editing: false }
    todos.push(todo)
    res.send(<TodoItem {...todo}/>)
  })

  router.get('/todo-filter', (req: Request, res: Response) => {
    urls = urls.map(f => ({ ...f, selected: f.name === req.query.id }))
    res.send(<TodoFilter filters={urls} />)
  })

  router.get('/todo-list', (req: Request, res: Response) => res.send(<TodoList todos={todos} filters={urls} />))
}
