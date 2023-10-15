import React from 'react'
import crypto from 'crypto'
import { type Router, type Response, type NextFunction } from 'express'
import { type Request } from './types'
import { MainTemplate, EditTodo, TodoFilter, TodoItem } from './components'
import { updateStoreMiddleware, todos as todosFile, filters as filtersFile } from './middleware'

export default (router: Router): void => {
  router.get('/', (req: Request, res: Response) => res.send(<MainTemplate {...req.body} />))

  router.get('/get-hash', (req: Request, res: Response, next: NextFunction) => {
    const hash = req.query.hash.length ? req.query.hash : '/#all'
    req.body.filters = req.body.filters.map(f => ({ ...f, selected: f.name === hash.slice(2) }))
    updateStoreMiddleware(filtersFile, req.body.filters, next)
  }, (req: Request, res: Response) => res.send(<TodoFilter filters={req.body.filters} />))

  router.get('/learn.json', (req: Request, res: Response) => res.send('{}'))

  router.get('/update-counts', (req: Request, res: Response) => {
    const { todos } = req.body
    const uncompleted = todos.filter(c => !c.completed)
    res.send(<><strong>{uncompleted.length}</strong>{` item${uncompleted.length === 1 ? '' : 's'} left`}</>)
  })

  router.patch('/toggle-todo', (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.query
    req.body.todo = { ...req.body.todo, completed: !req.body.todo.completed }
    updateStoreMiddleware(todosFile, req.body.todo, next, 'id', id)
  }, (req: Request, res: Response) => res.send(<TodoItem {...req.body.todo}/>))

  router.patch('/edit-todo', (req: Request, res: Response) => {
    res.send(<EditTodo {...req.query} editing={true}/>)
  })

  router.get('/update-todo', (req: Request, res: Response, next: NextFunction) => {
    // In a proper manner, this should always be sanitized
    const { id, text } = req.query
    req.body.todo = { ...req.body.todo, text }
    updateStoreMiddleware(todosFile, req.body.todo, next, 'id', id)
  }, (req: Request, res: Response) => res.send(<TodoItem {...req.body.todo}/>))

  router.delete('/remove-todo', (req: Request, res: Response, next: NextFunction) => {
    updateStoreMiddleware(todosFile, req.body.todo, next, 'id', req.query.id, true)
  }, (req: Request, res: Response) => res.send(''))

  router.get('/new-todo', (req: Request, res: Response, next: NextFunction) => {
    // In a proper manner, this should always be sanitized
    const { text } = req.query
    if (!text.length) {
      res.send('')
      next()
    } else {
      req.body.todo = { id: crypto.randomUUID(), text, completed: false }
      updateStoreMiddleware(todosFile, req.body.todo, next)
    }
  }, (req: Request, res: Response) => req.query.text.length && res.send(<TodoItem {...req.body.todo}/>))

  router.get('/todo-filter', (req: Request, res: Response, next: NextFunction) => {
    req.body.filters = req.body.filters.map(f => ({ ...f, selected: f.name === req.query.id }))
    updateStoreMiddleware(filtersFile, req.body.filters, next)
  }, (req: Request, res: Response) => res.send(<TodoFilter filters={req.body.filters}/>))

  // this can be migrated to FE
  router.get('/toggle-all', (req: Request, res: Response) => {
    const { todos } = req.body
    res.send(`${todos.filter(t => !t.completed).length === 0 && todos.length !== 0}`)
  })
  // this can be migrated to FE
  router.get('/completed', (req: Request, res: Response) => {
    res.send(req.body.todos.filter(t => t.completed).length ? 'block' : 'none')
  })
}
