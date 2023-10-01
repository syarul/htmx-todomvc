import React from 'react'
import { type Todo, type Todos, type Filter, type filter } from '../types'
import classNames from 'classnames'
import { lambdaPath } from '../server'

export const TodoCheck: React.FC<Todo> = ({ id, completed }) => (
  <input
    className="toggle"
    type="checkbox"
    defaultChecked={completed}
    hx-patch={`${lambdaPath}/toggle-todo?id=${id}&completed=${completed}`}
    hx-target="closest <li/>"
    hx-swap="outerHTML"
    _={`
      on toggle
        if $toggleAll.checked and my.checked === false
          my.click()
        else if $toggleAll.checked === false and my.checked
          my.click()
    `}
  />
)

export const EditTodo: React.FC<Todo> = ({ id, text, editing }) => (
  <input
    className="edit"
    name="text"
    defaultValue={editing ? text : ''}
    hx-trigger="keyup[keyCode==13], keyup[keyCode==27], text" // capture Enter, ESC and text input
    hx-vals="js:{key: event.keyCode}" // send event keyCode to server as well
    hx-get={`${lambdaPath}/update-todo?id=${id}`}
    hx-target="closest li"
    hx-swap="outerHTML"
    _="on htmx:afterRequest send focus to <input.new-todo/>"
    autoFocus/>
)

export const TodoItem: React.FC<Todo> = ({ id, text, completed, editing }) => (
  <li
    key={id}
    className={classNames('todo', { completed, editing })}
    x-bind:style={`
      show === 'all' ||
      (show === 'active' && !$el.classList.contains('completed')) ||
      (show === 'completed' && $el.classList.contains('completed'))
      ? 'display:block;' : 'display:none;'
    `}
    _="on destroy my.querySelector('button').click()"
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
          on htmx:afterRequest wait 50ms
            set $el to my.parentNode.nextSibling
            set $el.selectionStart to $el.value.length
        `} // 1) add class editing 2) place cursor on the end of the text line in the input
      >{text}</label>
      <button
        className="destroy"
        hx-delete={`${lambdaPath}/remove-todo?id=${id}`}
        hx-trigger="click"
        hx-target="closest li"
        _={`
          on htmx:afterRequest 
            send toggleDisplayClearCompleted to <button.clear-completed/>
            send todoCount to <span.todo-count/>
            send toggleAll to <input.toggle-all/>
            send footerToggleDisplay to <footer.footer/>
            send labelToggleAll to <label/>
            send focus to <input.new-todo/>
        `}
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
              on focus my.focus()
            `}
            autoFocus />
        </header>
        <section className="main">
          <input id="toggle-all" className="toggle-all" type="checkbox"
            defaultChecked={todos.filter(t => !t.completed).length === 0 && todos.length !== 0}
            _={`
              on load set $toggleAll to me
              on toggleAll debounced at 100ms
                fetch ${lambdaPath}/toggle-all then
                if it === 'true' and my.checked === false then
                  set my.checked to true
                else
                  if my.checked === true and it === 'false' then set my.checked to false
                end
              end
              on click send toggle to <input.toggle/>
            `}
          />
          <label htmlFor="toggle-all"
            _={`
             on load send labelToggleAll to me
             on labelToggleAll debounced at 100ms
               if $todo.hasChildNodes() set my.style.display to 'flex'
               else set my.style.display to 'none'
           `}
            style={{ display: 'none' }}>Mark all as complete</label>
          <ul
            className="todo-list"
            _={`
              on load debounced at 10ms set $todo to me
              on load debounced at 10ms
                send toggleDisplayClearCompleted to <button.clear-completed/>
                send footerToggleDisplay to <footer.footer/>
                send todoCount to <span.todo-count/>
                send toggleAll to <input.toggle-all/>
                send footerToggleDisplay to <footer.footer/>
                send labelToggleAll to <label/>
            `}
          >
            <TodoList todos={todos} filters={filters} />
          </ul>
        </section>
        <footer className="footer" _={`
          on load send footerToggleDisplay to me
          on footerToggleDisplay debounced at 100ms
            if $todo.hasChildNodes() set my.style.display to 'block'
            else set my.style.display to 'none'
            send focus to <input.new-todo/>
        `} style={{ display: 'none' }}>
          <span
            className="todo-count"
            hx-trigger="load"
            _={`
              on load send todoCount to me
              on todoCount debounced at 100ms
                fetch ${lambdaPath}/update-counts then put the result into me
            `}
          />
          <TodoFilter filters={filters} />
          <button className="clear-completed"
            _={`
              on load send toggleDisplayClearCompleted to me
              on toggleDisplayClearCompleted debounced at 100ms
                fetch ${lambdaPath}/completed then
                set my.style.display to it
              end
              on click send destroy to <li.completed/>
            `}
          >Clear Complete</button>
        </footer>
      </section>
      <footer className="info" _="on load debounced at 100ms call startMeUp()">
        <p>Double-click to edit a todo</p>
        <p>Created by <a href="http://github.com/syarul/">syarul</a></p>
        <p>Part of <a href="http://todomvc.com">TodoMVC</a></p>
      </footer>
      <script src="https://unpkg.com/todomvc-common@1.0.5/base.js" />
      <script src="https://unpkg.com/htmx.org@1.9.6" />
      <script src="https://unpkg.com/hyperscript.org/dist/_hyperscript.js" />
      <script src="https://unpkg.com/alpinejs/dist/cdn.js" />
      <script type="text/hyperscript">
        {`
          def startMeUp()
            log \`this is TodoMVC app build with HTMX!\`
          end
        `}
      </script>
    </body>
  </html>
)
