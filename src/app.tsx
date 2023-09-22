// src/app.tsx
import React from 'react';
import crypto from 'crypto';
import express, { Request as ExpressRequest, Response, NextFunction  } from 'express';
const { renderToString } = require('react-dom/server');

interface Request extends ExpressRequest {
    query: {
      text: string;
    };
}

declare module 'react' {
    interface HTMLAttributes<T> extends AriaAttributes, DOMAttributes<T> {
      // extends React's HTMLAttributes
      _?: string;
      _1?: string;
    }
}

function processResponse(req: Request, res: Response, next: NextFunction) {
    const originalSend: (body?: any) => Response = res.send.bind(res); 
    res.send = function (data: any): Response {
        if (typeof data === 'string') {
            return originalSend(data);
        }
        return originalSend(renderToString(data));
    };
    next();
}

const app = express();

app.use('/static', express.static('node_modules'));

app.use(processResponse);

const port = process.env.PORT || 3000;

interface Todo {
    id: string;
    text: string;
    completed: boolean;
};

interface TodoProps {
    id: string;
    text: string;
};

interface Todos {
    todos: Todo[]; // An array of Todo objects
};

const todos: Todo[] = []; // An empty array of Todo objects

const Todo: React.FC<TodoProps> = ({ id, text }) => (
    <li key={id}>
        <div className="view">
            <input className="toggle" type="checkbox" />
            <label>{text}</label>
            <button className="destroy" />
        </div>
        <input className="edit" />
    </li>
)

// const completed = todos.filter(c => c.completed)
const uncompleted = () => todos.filter(c => !c.completed)

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
                    <ul className="todo-list">{todos.map(Todo)}</ul>
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
            <script src="static/hyperscript.org/dist/_hyperscript.min.js" />
        </body>
    </html>
)

app.get('/', (req: Request, res: Response) => {
    res.send(<MainTemplate todos={todos} />);
});

app.get('/learn.json', (req: Request, res: Response) => res.send('{}'));

app.get('/update-counts', (req: Request, res: Response) => res.send(
    <>
        <strong>{uncompleted().length}</strong>{` item${uncompleted().length === 1 ? '' : 's'} left`}
    </>
));

app.get('/new-todo', (req: Request, res: Response) => {
    // in a proper way this should always get sanitize
    const { text } = req.query
    const id = crypto.randomUUID()
    todos.push({ id, text, completed: false })
    res.send(
        <Todo id={id} text={text} />
    )
});

app.listen(port, () => console.log(`Server is running on port ${port}`));
