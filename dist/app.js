"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const crypto_1 = __importDefault(require("crypto"));
const components_1 = require("./components");
let todos = [];
let urls = [
    { url: '#/', name: 'all', selected: true },
    { url: '#/active', name: 'active', selected: false },
    { url: '#/completed', name: 'completed', selected: false }
];
exports.default = (router) => {
    router.get('/', (req, res) => res.send(react_1.default.createElement(components_1.MainTemplate, { todos: todos, filters: urls })));
    router.get('/get-hash', (req, res) => {
        const hash = req.query.hash.length ? req.query.hash : '/#all';
        urls = urls.map(f => ({ ...f, selected: f.name === hash.slice(2) }));
        res.send(react_1.default.createElement(components_1.TodoFilter, { filters: urls }));
    });
    router.get('/learn.json', (req, res) => res.send('{}'));
    router.get('/update-counts', (req, res) => {
        const uncompleted = todos.filter(c => !c.completed);
        res.send(react_1.default.createElement(react_1.default.Fragment, null,
            react_1.default.createElement("strong", null, uncompleted.length),
            ` item${uncompleted.length === 1 ? '' : 's'} left`));
    });
    router.patch('/toggle-todo', (req, res) => {
        const { id } = req.query;
        let completed = false;
        let todo = { id };
        todos = todos.map(t => {
            if (t.id === id) {
                completed = !t.completed;
                todo = { ...t, completed };
                return todo;
            }
            return t;
        });
        res.send(react_1.default.createElement(components_1.TodoItem, { ...todo }));
    });
    router.patch('/edit-todo', (req, res) => res.send(react_1.default.createElement(components_1.EditTodo, { ...req.query, editing: true })));
    router.get('/update-todo', (req, res) => {
        // In a proper manner, this should always be sanitized
        const { id, text } = req.query;
        let todo = { id };
        todos = todos.map(t => {
            if (t.id === id) {
                todo = { ...t, text };
                return todo;
            }
            return t;
        });
        res.send(react_1.default.createElement(components_1.TodoItem, { ...todo }));
    });
    router.delete('/remove-todo', (req, res) => {
        todos = todos.filter(t => t.id !== req.query.id);
        res.send('');
    });
    router.get('/new-todo', (req, res) => {
        // In a proper manner, this should always be sanitized
        const { text } = req.query;
        const todo = { id: crypto_1.default.randomUUID(), text, completed: false };
        todos.push(todo);
        res.send(react_1.default.createElement(components_1.TodoItem, { ...todo }));
    });
    router.get('/todo-filter', (req, res) => {
        urls = urls.map(f => ({ ...f, selected: f.name === req.query.id }));
        res.send(react_1.default.createElement(components_1.TodoFilter, { filters: urls }));
    });
    router.get('/todo-list', (req, res) => res.send(react_1.default.createElement(components_1.TodoList, { todos: todos, filters: urls })));
    // this can be migrated to FE
    router.get('/toggle-all', (req, res) => {
        res.send(`${todos.filter(t => !t.completed).length === 0 && todos.length !== 0}`);
    });
    // this can be migrated to FE
    router.get('/completed', (req, res) => {
        res.send(todos.filter(t => t.completed).length ? 'block' : 'none');
    });
};
