import React from 'react'
import crypto from 'crypto'
import { type Router, type Response } from 'express'
import { type Request, type Todo, type filter } from './types'
import { MainTemplate, TodoFilter, TodoItem, TodoList } from './components'
import fs from 'fs'
// An empty array of Todo objects and just a simple in memory store
// feel free to change if you want this to be from database instead
// if (!fs.existsSync('./tmp')) {
// fs.mkdirSync('./tmp')
// fs.writeFileSync('./tmp/todos.json', JSON.stringify([]))
// }
const todoData = fs.readFileSync('./tmp/todos.json', 'utf-8')
let todos: Todo[] = JSON.parse(todoData)

let urls: filter[] = [
  { url: '#/', name: 'all', selected: true },
  { url: '#/active', name: 'active', selected: false },
  { url: '#/completed', name: 'completed', selected: false }
]

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
    fs.writeFileSync('./tmp/todos.json', JSON.stringify(todos))
    res.send(<TodoItem {...todo}/>)
  })

  router.delete('/remove-todo', (req: Request, res: Response) => {
    todos = todos.filter(t => t.id !== req.query.id)
    fs.writeFileSync('./tmp/todos.json', JSON.stringify(todos))
    res.send('')
  })

  router.get('/new-todo', (req: Request, res: Response) => {
  // In a proper manner, this should always be sanitized
    const { text } = req.query
    const todo = { id: crypto.randomUUID(), text, completed: false, editing: false }
    todos.push(todo)
    fs.writeFileSync('./tmp/todos.json', JSON.stringify(todos))
    res.send(<TodoItem {...todo}/>)
  })

  router.get('/todo-filter', (req: Request, res: Response) => {
    urls = urls.map(f => ({ ...f, selected: f.name === req.query.id }))
    res.send(<TodoFilter filters={urls} />)
  })

  router.get('/todo-list', (req: Request, res: Response) => res.send(<TodoList todos={todos} filters={urls} />))
}
