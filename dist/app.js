"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const crypto_1 = __importDefault(require("crypto"));
const components_1 = require("./components");
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const todosFile = path_1.default.join(process.cwd(), 'todos.json');
const urlsFile = path_1.default.join(process.cwd(), 'urls.json');
const store = (file, data) => {
    // const directory = path.dirname(file)
    // if (!existsSync(directory)) {
    // mkdirSync(directory, { recursive: true })
    // }
    if (data) {
        (0, fs_1.writeFileSync)(file, JSON.stringify(data));
        return data;
    }
    return JSON.parse((0, fs_1.readFileSync)(file, 'utf-8'));
};
store(urlsFile, [
    { url: '#/', name: 'all', selected: true },
    { url: '#/active', name: 'active', selected: false },
    { url: '#/completed', name: 'completed', selected: false }
]);
store(todosFile, []);
exports.default = (router) => {
    router.get('/', (req, res) => {
        res.send(react_1.default.createElement(components_1.MainTemplate, { todos: store(todosFile), filters: store(urlsFile) }));
    });
    router.get('/get-hash', (req, res) => {
        const hash = req.query.hash.length ? req.query.hash : '/#all';
        const urls = store(urlsFile);
        res.send(react_1.default.createElement(components_1.TodoFilter, { filters: store(urlsFile, urls.map(f => ({ ...f, selected: f.name === hash.slice(2) }))) }));
    });
    router.get('/learn.json', (req, res) => res.send('{}'));
    router.get('/update-counts', (req, res) => {
        const todos = store(todosFile);
        const uncompleted = todos.filter(c => !c.completed);
        res.send(react_1.default.createElement(react_1.default.Fragment, null,
            react_1.default.createElement("strong", null, uncompleted.length),
            ` item${uncompleted.length === 1 ? '' : 's'} left`));
    });
    router.patch('/toggle-todo', (req, res) => {
        const { id } = req.query;
        let completed = false;
        let todo = { id };
        const todos = store(todosFile);
        store(todosFile, todos.map(t => {
            if (t.id === id) {
                completed = !t.completed;
                todo = { ...t, completed };
                return todo;
            }
            return t;
        }));
        res.send(react_1.default.createElement(components_1.TodoItem, { ...todo }));
    });
    router.patch('/edit-todo', (req, res) => res.send(react_1.default.createElement(components_1.EditTodo, { ...req.query, editing: true })));
    router.get('/update-todo', (req, res) => {
        // In a proper manner, this should always be sanitized
        const { id, text } = req.query;
        let todo = { id };
        const todos = store(todosFile);
        store(todosFile, todos.map(t => {
            if (t.id === id) {
                todo = { ...t, text };
                return todo;
            }
            return t;
        }));
        res.send(react_1.default.createElement(components_1.TodoItem, { ...todo }));
    });
    router.delete('/remove-todo', (req, res) => {
        const todos = store(todosFile);
        store(todosFile, todos.filter(t => t.id !== req.query.id));
        res.send('');
    });
    router.get('/new-todo', (req, res) => {
        // In a proper manner, this should always be sanitized
        const { text } = req.query;
        const todo = { id: crypto_1.default.randomUUID(), text, completed: false };
        const todos = store(todosFile);
        store(todosFile, [...todos, todo]);
        res.send(react_1.default.createElement(components_1.TodoItem, { ...todo }));
    });
    router.get('/todo-filter', (req, res) => {
        const urls = store(urlsFile);
        res.send(react_1.default.createElement(components_1.TodoFilter, { filters: store(urlsFile, urls.map(f => ({ ...f, selected: f.name === req.query.id }))) }));
    });
    router.get('/todo-list', (req, res) => {
        res.send(react_1.default.createElement(components_1.TodoList, { todos: store(todosFile), filters: store(urlsFile) }));
    });
    // this can be migrated to FE
    router.get('/toggle-all', (req, res) => {
        const todos = store(todosFile);
        res.send(`${todos.filter(t => !t.completed).length === 0 && todos.length !== 0}`);
    });
    // this can be migrated to FE
    router.get('/completed', (req, res) => {
        const todos = store(todosFile);
        res.send(todos.filter(t => t.completed).length ? 'block' : 'none');
    });
};
