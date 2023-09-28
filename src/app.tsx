import React from 'react'
import crypto from 'crypto'
import express, { type Response } from 'express'
import { processResponse } from './middleware'
import { type Request, type Todo, type Todos, type Filter, type filter } from './types'
import classNames from 'classnames'

const app = express()

app.use('/static', express.static('node_modules'))

app.use(processResponse)

// An empty array of Todo objects and just a simple in memory store
// feel free to change if you want this to be from database instead
let todos: Todo[] = []

let urls: filter[] = [
  { url: '#/', name: 'all', selected: true },
  { url: '#/active', name: 'active', selected: false },
  { url: '#/completed', name: 'completed', selected: false }
]

const TodoCheck: React.FC<Todo> = ({ id, completed }) => (
  <input
    className="toggle"
    type="checkbox"
    defaultChecked={completed}
    hx-patch={`/toggle-todo?id=${id}`}
    hx-target="closest <li/>"
    hx-swap="outerHTML"
    _={`
      on htmx:afterRequest fetch /update-counts then put the result into .todo-count
    `}
  />
)

const TodoItem: React.FC<Todo> = ({ id, text, completed, editing }) => (
  <li
    key={id}
    className={classNames({ completed, editing })}
    x-bind:style={`
      show === 'all' ||
      (show === 'active' && !$el.classList.contains('completed')) ||
      (show === 'completed' && $el.classList.contains('completed'))
      ? 'display:block;' : 'display:none;'
    `} // bind display base on alpine data 'show' state and this class 'completed'
  >
    <div className="view">
      <TodoCheck id={id} completed={completed} />
      <label>{text}</label>
      <button
        className="destroy"
        hx-delete={`/remove-todo?id=${id}`}
        hx-trigger="click"
        hx-target="closest li"
      />
    </div>
    <input className="edit" />
  </li>
)

const TodoFilter: React.FC<Filter> = ({ filters }) => (
  <ul className="filters">
    {filters.map(({ url, name, selected }: filter) => (
      <li key={name}>
        <a className={classNames({ selected })} href={url}
          hx-get={`/todo-filter?id=${name}`}
          hx-trigger="click"
          hx-target=".filters"
          hx-swap="outerHTML"
          x-on:click={`show = '${name}'`}
        >{`${name.charAt(0).toUpperCase()}${name.slice(1)}`}</a>
      </li>
    ))}
  </ul>
)

const TodoList: React.FC<Todos> = ({ todos }) => todos.map(TodoItem)

const MainTemplate: React.FC<Todos> = ({ todos, filters }) => (
  <html lang="en" data-framework="htmx">
    <head>
      <meta charSet="utf-8" />
      <title>HTMX • TodoMVC</title>
      <link rel="stylesheet" href="static/todomvc-common/base.css" type="text/css" />
      <link rel="stylesheet" href="static/todomvc-app-css/index.css" type="text/css" />
    </head>
    <body>
      <section
        className="todoapp"
        _="on load fetch /update-counts then put the result into .todo-count" // on load update todo count
        hx-get="/get-hash" // send hash to the server and render .filters base on hash location on load
        hx-vals="js:{hash: window.location.hash}"
        hx-trigger="load"
        hx-target=".filters"
        hx-swap="outerHTML"
        x-data={`{
          show: {
            '#/completed': 'completed',
            '#/active': 'active',
            '#/': 'all'
          }[window.location.hash] || 'all'
        }`} // set initial alpine data state 'show' default to location hash
      >
        <header className="header">
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
            _={`
              on htmx:afterRequest set my value to ''
              on htmx:afterRequest fetch /update-counts then put the result into .todo-count
            `}
            autoFocus />
        </header>
        <section className="main">
          <input id="toggle-all" className="toggle-all" type="checkbox" />
          <label htmlFor="toggle-all">Mark all as complete</label>
          <ul className="todo-list">
            <TodoList todos={todos} filters={filters} />
          </ul>
        </section>
        <footer className="footer">
          <span
            className="todo-count"
            hx-trigger="load"
            _="on load fetch /update-counts then put the result into .todo-count"
          />
          <TodoFilter filters={filters} />
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
      <script src="static/alpinejs/dist/cdn.js" />
    </body>
  </html>
)

app.get('/', (req: Request, res: Response) => res.send(<MainTemplate todos={todos} filters={urls} />))

app.get('/get-hash', (req: Request, res: Response) => {
  const hash = req.query.hash || 'all'
  const name = hash.slice(2).length ? hash.slice(2) : 'all'
  urls = urls.map(f => ({ ...f, selected: f.name === name }))
  res.send(<TodoFilter filters={urls} />)
})

app.get('/learn.json', (req: Request, res: Response) => res.send('{}'))

app.get('/update-counts', (req: Request, res: Response) => {
  const uncompleted = todos.filter(c => !c.completed)
  res.send(<><strong>{uncompleted.length}</strong>{` item${uncompleted.length === 1 ? '' : 's'} left`}</>)
})

app.patch('/toggle-todo', (req: Request, res: Response) => {
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

app.delete('/remove-todo', (req: Request, res: Response) => {
  todos = todos.filter(t => t.id !== req.query.id)
  res.send('')
})

app.get('/new-todo', (req: Request, res: Response) => {
  // In a proper manner, this should always be sanitized
  const { text } = req.query
  const id = crypto.randomUUID()
  const todo = { id, text, completed: false, editing: false }
  todos.push(todo)
  res.send(<TodoItem {...todo}/>)
})

app.get('/todo-filter', (req: Request, res: Response) => {
  urls = urls.map(f => ({ ...f, selected: f.name === req.query.id }))
  res.send(<TodoFilter filters={urls} />)
})

app.get('/todo-list', (req: Request, res: Response) => res.send(<TodoList todos={todos} filters={urls} />))

export default app
