import React from 'react'
import { type Todo, type Todos, type Filter, type filter } from '../types'
import classNames from 'classnames'
import { lambdaPath } from '../server'

export const TodoCheck: React.FC<Todo> = ({ id, completed }) => (
  <input
    className="toggle"
    type="checkbox"
    defaultChecked={completed === 'completed'}
    hx-patch={`${lambdaPath}/toggle-todo?id=${id}&completed=${completed === 'completed' ? '' : 'completed'}`}
    hx-target="closest <li/>"
    hx-swap="outerHTML"
    _={`on htmx:afterRequest fetch ${lambdaPath}/update-counts then put the result into .todo-count`}
  />
)

export const EditTodo: React.FC<Todo> = ({ id, text, editing }) => (
  <input
    className="edit"
    name="text"
    value={editing === 'editing' ? text : ''}
    hx-trigger="keyup[keyCode==13], keyup[keyCode==27], text" // capture Enter, ESC and text input
    hx-vals="js:{key: event.keyCode}" // send event keyCode to server as well
    hx-get={`${lambdaPath}/update-todo?id=${id}`}
    hx-target="closest li"
    hx-swap="outerHTML"
    autoFocus/>
)

export const TodoItem: React.FC<Todo> = ({ id, text, completed, editing }) => (
  <li
    key={id}
    className={classNames({ completed: completed === 'completed', editing: editing === 'editing' })}
    x-bind:style={`
        show === 'all' ||
        (show === 'active' && !$el.classList.contains('completed')) ||
        (show === 'completed' && $el.classList.contains('completed'))
        ? 'display:block;' : 'display:none;'
      `} // bind display base on alpine data 'show' state and this class 'completed'
  >
    <div className="view">
      <TodoCheck id={id} completed={completed} />
      <label
        hx-trigger="dblclick"
        hx-patch={`${lambdaPath}/edit-todo?id=${id}&editing=editing`}
        hx-target="next input"
        hx-swap="outerHTML"
        _={`
          on dblclick add .editing to the closest <li/>
          on htmx:afterRequest wait 100ms
          set $el to me.parentNode.nextSibling
          js $el.selectionStart = $el.selectionEnd = $el.value.length
        `} // 1) add class editing 2) place cursor on the end of the text line in the input
      >{text}</label>
      <button
        className="destroy"
        hx-delete={`${lambdaPath}/remove-todo?id=${id}`}
        hx-trigger="click"
        hx-target="closest li"
        _={`on htmx:afterRequest fetch ${lambdaPath}/update-counts then put the result into .todo-count`}
      />
    </div>
    <EditTodo id={id} text={text} editing={editing}/>
  </li>
)

export const TodoFilter: React.FC<Filter> = ({ filters }) => (
  <ul className="filters">
    {filters.map(({ url, name, selected }: filter) => (
      <li key={name}>
        <a className={classNames({ selected })} href={url}
          hx-get={`${lambdaPath}/todo-filter?id=${name}`}
          hx-trigger="click"
          hx-target=".filters"
          hx-swap="outerHTML"
          x-on:click={`show = '${name}'`}
        >{`${name.charAt(0).toUpperCase()}${name.slice(1)}`}</a>
      </li>
    ))}
  </ul>
)

export const TodoList: React.FC<Todos> = ({ todos }) => todos.map(TodoItem)

export const MainTemplate: React.FC<Todos> = ({ todos, filters }) => (
  <html lang="en" data-framework="htmx">
    <head>
      <meta charSet="utf-8" />
      <title>HTMX • TodoMVC</title>
      <link rel="stylesheet" href="https://unpkg.com/todomvc-common@1.0.5/base.css" type="text/css" />
      <link rel="stylesheet" href="https://unpkg.com/todomvc-app-css/index.css" type="text/css" />
    </head>
    <body>
      <section
        className="todoapp"
        hx-get={`${lambdaPath}/get-hash`} // send hash to the server and render .filters base on hash location on load
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
            hx-get={`${lambdaPath}/new-todo`}
            hx-trigger="keyup[keyCode==13], text"
            hx-target=".todo-list"
            hx-swap="beforeend"
            _={`
                on htmx:afterRequest set my value to ''
                on htmx:afterRequest fetch ${lambdaPath}/update-counts then put the result into .todo-count
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
            _={`on load fetch ${lambdaPath}/update-counts then put the result into .todo-count`}
          />
          <TodoFilter filters={filters} />
        </footer>
      </section>
      <footer className="info">
        <p>Double-click to edit a todo</p>
        <p>Created by <a href="http://github.com/syarul/">syarul</a></p>
        <p>Part of <a href="http://todomvc.com">TodoMVC</a></p>
      </footer>
      <script src="https://unpkg.com/todomvc-common@1.0.5/base.js" />
      <script src="https://unpkg.com/htmx.org@1.9.6" />
      <script src="https://unpkg.com/hyperscript.org/dist/_hyperscript.js" />
      <script src="https://unpkg.com/alpinejs/dist/cdn.js" />
    </body>
  </html>
)
