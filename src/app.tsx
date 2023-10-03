import React from 'react'
import crypto from 'crypto'
import { type Router, type Response } from 'express'
import { type Request, type Todo, type filter } from './types'
import { EditTodo, MainTemplate, TodoFilter, TodoItem, TodoList } from './components'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import path from 'path'
const todosFile = path.join('/tmp', 'todos.json')
const urlsFile = path.join('/tmp', 'urls.json')

const store = (file: string, data?: any): any => {
  const directory = path.dirname(file)
  if (!existsSync(directory)) {
    mkdirSync(directory, { recursive: true })
  }
  if (data) {
    writeFileSync(file, JSON.stringify(data))
    return data
  }
  return JSON.parse(readFileSync(file, 'utf-8'))
}

store(urlsFile, [
  { url: '#/', name: 'all', selected: true },
  { url: '#/active', name: 'active', selected: false },
  { url: '#/completed', name: 'completed', selected: false }
])

store(todosFile, [])

export default (router: Router): void => {
  router.get('/', (req: Request, res: Response) => {
    res.send(<MainTemplate todos={store(todosFile)} filters={store(urlsFile)} />)
  })

  router.get('/get-hash', (req: Request, res: Response) => {
    const hash = req.query.hash.length ? req.query.hash : '/#all'
    const urls: filter[] = store(urlsFile)
    res.send(<TodoFilter filters={store(urlsFile, urls.map(f => ({ ...f, selected: f.name === hash.slice(2) })))} />)
  })

  router.get('/learn.json', (req: Request, res: Response) => res.send('{}'))

  router.get('/update-counts', (req: Request, res: Response) => {
    const todos: Todo[] = store(todosFile)
    const uncompleted = todos.filter(c => !c.completed)
    res.send(<><strong>{uncompleted.length}</strong>{` item${uncompleted.length === 1 ? '' : 's'} left`}</>)
  })

  router.patch('/toggle-todo', (req: Request, res: Response) => {
    const { id } = req.query
    let completed = false
    let todo: Todo = { id }
    const todos: Todo[] = store(todosFile)
    store(todosFile, todos.map(t => {
      if (t.id === id) {
        completed = !t.completed
        todo = { ...t, completed }
        return todo
      }
      return t
    }))
    res.send(<TodoItem {...todo}/>)
  })

  router.patch('/edit-todo', (req: Request, res: Response) =>
    res.send(<EditTodo {...req.query} editing={true}/>)
  )

  router.get('/update-todo', (req: Request, res: Response) => {
    // In a proper manner, this should always be sanitized
    const { id, text } = req.query
    let todo: Todo = { id }
    const todos: Todo[] = store(todosFile)
    store(todosFile, todos.map(t => {
      if (t.id === id) {
        todo = { ...t, text }
        return todo
      }
      return t
    }))
    res.send(<TodoItem {...todo} />)
  })

  router.delete('/remove-todo', (req: Request, res: Response) => {
    const todos: Todo[] = store(todosFile)
    store(todosFile, todos.filter(t => t.id !== req.query.id))
    res.send('')
  })

  router.get('/new-todo', (req: Request, res: Response) => {
  // In a proper manner, this should always be sanitized
    const { text } = req.query
    const todo = { id: crypto.randomUUID(), text, completed: false }
    const todos: Todo[] = store(todosFile)
    store(todosFile, [...todos, todo])
    res.send(<TodoItem {...todo}/>)
  })

  router.get('/todo-filter', (req: Request, res: Response) => {
    const urls: filter[] = store(urlsFile)
    res.send(<TodoFilter filters={store(urlsFile, urls.map(f => ({ ...f, selected: f.name === req.query.id })))} />)
  })

  router.get('/todo-list', (req: Request, res: Response) => {
    res.send(<TodoList todos={store(todosFile)} filters={store(urlsFile)} />)
  })
  // this can be migrated to FE
  router.get('/toggle-all', (req: Request, res: Response) => {
    const todos: Todo[] = store(todosFile)
    res.send(`${todos.filter(t => !t.completed).length === 0 && todos.length !== 0}`)
  })
  // this can be migrated to FE
  router.get('/completed', (req: Request, res: Response) => {
    const todos: Todo[] = store(todosFile)
    res.send(todos.filter(t => t.completed).length ? 'block' : 'none')
  })
}
