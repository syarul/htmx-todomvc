import React from 'react'
import crypto from 'crypto'
import express, { type Response } from 'express'
import { processResponse } from './middleware'
import { type Request, type Todo, type Todos } from './types'
import classNames from 'classnames'

const app = express()

app.use('/static', express.static('node_modules'))

app.use(processResponse)

const port = process.env.PORT ?? 3000

// An empty array of Todo objects and just a simple in memory store
// feel free to change if you want this to be from database instead
let todos: Todo[] = []

const TodoCheck: React.FC<Todo> = ({ id, completed }) => (
  <input
    className="toggle"
    type="checkbox"
    defaultChecked={completed}
    hx-patch={`/toggle-todo?id=${id}`}
    _={`on click ${completed ? 'remove' : 'add'} .completed ${completed ? 'from' : 'to the'} closest <li/>`}
    hx-target="this"
    hx-swap="outerHTML"
  />
)

const TodoItem: React.FC<Todo> = ({ id, text, completed, editing }) => (
  <li key={id} className={classNames({ completed, editing })}>
    <div className="view">
      <TodoCheck id={id} completed={completed} />
      <label>{text}</label>
      <button
        className="destroy"
        hx-delete={`/remove-todo?id=${id}`}
        hx-trigger="click"
        hx-target="closest li"
        _="on htmx:afterRequest fetch /update-counts then put the result into .todo-count"
      />
    </div>
    <input className="edit" />
  </li>
)

const MainTemplate: React.FC<Todos> = ({ todos }) => (
  <html lang="en" data-framework="htmx">
    <head>
      <meta charSet="utf-8" />
      <title>HTMX • TodoMVC</title>
      <link rel="stylesheet" href="static/todomvc-common/base.css" type="text/css" />
      <link rel="stylesheet" href="static/todomvc-app-css/index.css" type="text/css" />
    </head>
    <body>
      <section className="todoapp" _="on load fetch /update-counts then put the result into .todo-count">
        <header
          className="header"
          _="on keyup[keyCode==13] fetch /update-counts then put the result into .todo-count">
          <h1>todos</h1>
          <input
            id="new-todo"
            name="text"
            className="new-todo"
            placeholder="What needs to be done?"
            hx-get="/new-todo"
            hx-trigger="keyup[keyCode==13], text"
            hx-target=".todo-list"
            hx-swap="beforeend"
            _="on htmx:afterRequest set my value to ''"
            autoFocus />
        </header>
        <section className="main">
          <input id="toggle-all" className="toggle-all" type="checkbox" />
          <label htmlFor="toggle-all">Mark all as complete</label>
          <ul className="todo-list">{todos.map(TodoItem)}</ul>
        </section>
        <footer className="footer">
          <span className="todo-count" />
          <ul className="filters">
            <li>
              <a className="selected" href="#/">All</a>
            </li>
            <li>
              <a href="#/active">Active</a>
            </li>
            <li>
              <a href="#/completed">Completed</a>
            </li>
          </ul>
        </footer>
      </section>
      <footer className="info">
        <p>Double-click to edit a todo</p>
        <p>Created by <a href="http://github.com/syarul/">syarul</a></p>
        <p>Part of <a href="http://todomvc.com">TodoMVC</a></p>
      </footer>
      <script src="static/todomvc-common/base.js" />
      <script src="static/htmx.org/dist/htmx.js" />
      <script src="static/hyperscript.org/dist/_hyperscript.js" />
    </body>
  </html>
)

app.get('/', (req: Request, res: Response) => res.send(<MainTemplate todos={todos} />))

app.get('/learn.json', (req: Request, res: Response) => res.send('{}'))

app.get('/update-counts', (req: Request, res: Response) => {
  const uncompleted = todos.filter(c => !c.completed)
  res.send(<><strong>{uncompleted.length}</strong>{` item${uncompleted.length === 1 ? '' : 's'} left`}</>)
})

app.patch('/toggle-todo', (req: Request, res: Response) => {
  // in a proper way this should always get sanitize
  const { id } = req.query
  let completed = false
  todos = todos.map(t => {
    if (t.id === id) {
      completed = !t.completed
      return { ...t, completed }
    }
    return t
  })
  res.send(<TodoCheck id={id} completed={completed} />)
})

app.delete('/remove-todo', (req: Request, res: Response) => {
  // in a proper way this should always get sanitize
  const { id } = req.query
  todos = todos.filter(t => t.id !== id)
  res.send('')
})

app.get('/new-todo', (req: Request, res: Response) => {
  // in a proper way this should always get sanitize
  const { text } = req.query
  const id = crypto.randomUUID()
  const todo = { id, text, completed: false, editing: false }
  todos.push(todo)
  res.send(
    <TodoItem {...todo}/>
  )
})

app.listen(port, () => { console.log(`Server is running on port ${port}`) })
