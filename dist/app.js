"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const components_1 = require("./components");
const middleware_1 = require("./middleware");
exports.default = (router) => {
    router.get('/', (req, res) => res.send(react_1.default.createElement(components_1.MainTemplate, { ...req.body })));
    router.get('/get-hash', (req, res, next) => {
        const hash = req.query.hash.length ? req.query.hash : '/#all';
        req.body.filters = req.body.filters.map(f => ({ ...f, selected: f.name === hash.slice(2) }));
        (0, middleware_1.updateStoreMiddleware)(middleware_1.filters, req.body.filters, next);
    }, (req, res) => res.send(react_1.default.createElement(components_1.TodoFilter, { filters: req.body.filters })));
    router.get('/learn.json', (req, res) => res.send('{}'));
    router.get('/update-counts', (req, res) => {
        const { todos } = req.body;
        const uncompleted = todos.filter(c => !c.completed);
        res.send(react_1.default.createElement(react_1.default.Fragment, null,
            react_1.default.createElement("strong", null, uncompleted.length),
            ` item${uncompleted.length === 1 ? '' : 's'} left`));
    });
    router.patch('/toggle-todo', (req, res, next) => {
        req.body.todo = { ...req.body.todo, completed: !req.body.todo.completed };
        (0, middleware_1.updateStoreMiddleware)(middleware_1.todos, req.body.todo, next, 'update', req.query.id);
    }, (req, res) => res.send(react_1.default.createElement(components_1.TodoItem, { ...req.body.todo })));
    router.patch('/edit-todo', (req, res) => {
        res.send(react_1.default.createElement(components_1.EditTodo, { ...req.query, editing: true }));
    });
    router.get('/update-todo', (req, res, next) => {
        // In a proper manner, this should always be sanitized
        const { id, text } = req.query;
        req.body.todo = { ...req.body.todo, text };
        (0, middleware_1.updateStoreMiddleware)(middleware_1.todos, req.body.todo, next, 'update', id);
    }, (req, res) => res.send(react_1.default.createElement(components_1.TodoItem, { ...req.body.todo })));
    router.delete('/remove-todo', (req, res, next) => {
        (0, middleware_1.updateStoreMiddleware)(middleware_1.todos, {}, next, 'remove', req.query.id);
    }, (req, res) => res.send(''));
    router.get('/new-todo', (req, res, next) => {
        // In a proper manner, this should always be sanitized
        const { text } = req.query;
        if (!text.length) {
            res.send('');
            next();
        }
        else {
            req.body.todo = { id: '', text, completed: false };
            (0, middleware_1.updateStoreMiddleware)(middleware_1.todos, req.body.todo, next, 'create');
        }
    }, (req, res) => req.query.text.length && res.send(react_1.default.createElement(components_1.TodoItem, { ...req.body.todo })));
    router.get('/todo-filter', (req, res, next) => {
        req.body.filters = req.body.filters.map(f => ({ ...f, selected: f.name === req.query.id }));
        (0, middleware_1.updateStoreMiddleware)(middleware_1.filters, req.body.filters, next);
    }, (req, res) => res.send(react_1.default.createElement(components_1.TodoFilter, { filters: req.body.filters })));
    // this can be migrated to FE
    router.get('/toggle-all', (req, res) => {
        const { todos } = req.body;
        res.send(`${todos.filter(t => !t.completed).length === 0 && todos.length !== 0}`);
    });
    // this can be migrated to FE
    router.get('/completed', (req, res) => {
        res.send(req.body.todos.filter(t => t.completed).length ? 'block' : 'none');
    });
};
