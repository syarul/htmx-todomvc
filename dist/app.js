"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const components_1 = require("./components");
const ioredis_1 = __importDefault(require("ioredis"));
const dotenv = __importStar(require("dotenv"));
dotenv.config();
// eslint-disable-next-line @typescript-eslint/no-var-requires
const rq = require('requrse');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const rqRedis = require('rq-redis');
const redis = new ioredis_1.default(`rediss://default:${process.env.REDIS_KEY}@willing-cowbird-38871.upstash.io:38871`);
const redisKey = `${process.env.REDIS_MKEY}_todos`;
const memberKey = `${process.env.REDIS_MKEY}_todo_ids`;
const modelOptions = {
    rq,
    redis,
    redisKey,
    memberKey,
    options: {
        methods: {
            async todos() {
                return await Promise.all((await redis.smembers(memberKey)).sort().map(async (id) => {
                    const res = await redis.hgetall(`${redisKey}:${id}`);
                    return res;
                }));
            }
        }
    }
};
let urls = [
    { url: '#/', name: 'all', selected: true },
    { url: '#/active', name: 'active', selected: false },
    { url: '#/completed', name: 'completed', selected: false }
];
exports.default = (router) => {
    router.get('/', (req, res) => rqRedis({
        data: {
            todos: '*'
        }
    }, modelOptions).then(({ data: { todos } }) => res.send(react_1.default.createElement(components_1.MainTemplate, { todos: todos, filters: urls }))));
    router.get('/get-hash', (req, res) => {
        const hash = req.query.hash.length ? req.query.hash : '/#all';
        urls = urls.map(f => ({ ...f, selected: f.name === hash.slice(2) }));
        res.send(react_1.default.createElement(components_1.TodoFilter, { filters: urls }));
    });
    router.get('/learn.json', (req, res) => res.send('{}'));
    router.get('/update-counts', (req, res) => {
        rqRedis({
            data: {
                todos: '*'
            }
        }, modelOptions).then(({ data: { todos } }) => {
            const uncompleted = todos.filter(c => c.completed === '');
            res.send(react_1.default.createElement(react_1.default.Fragment, null,
                react_1.default.createElement("strong", null, uncompleted.length),
                ` item${uncompleted.length === 1 ? '' : 's'} left`));
        });
    });
    router.patch('/toggle-todo', (req, res) => {
        const { id, completed } = req.query;
        rqRedis({
            todo: {
                update: {
                    $params: {
                        id,
                        data: {
                            completed
                        }
                    },
                    id: 1,
                    text: 1,
                    completed: 1
                }
            }
        }, modelOptions).then(({ todo: { update } }) => res.send(react_1.default.createElement(components_1.TodoItem, { ...update })));
    });
    router.patch('/edit-todo', (req, res) => res.send(react_1.default.createElement(components_1.EditTodo, { ...req.query, editing: true })));
    router.get('/update-todo', (req, res) => {
        // In a proper manner, this should always be sanitized
        const { id, text } = req.query;
        rqRedis({
            todo: {
                update: {
                    $params: {
                        id,
                        data: { text }
                    },
                    id: 1,
                    text: 1,
                    completed: 1
                }
            }
        }, modelOptions).then(({ todo: { update } }) => res.send(react_1.default.createElement(components_1.TodoItem, { ...update })));
    });
    router.delete('/remove-todo', (req, res) => {
        rqRedis({
            todo: {
                remove: {
                    $params: { id: req.query.id },
                    id: 1
                }
            }
        }, modelOptions).then(() => res.send(''));
    });
    router.get('/new-todo', (req, res) => {
        // In a proper manner, this should always be sanitized
        const { text } = req.query;
        rqRedis({
            data: {
                getMemberKeys: '*'
            }
        }, modelOptions).then(({ data: { getMemberKeys: { keys } } }) => {
            let id = '0';
            keys.sort((a, b) => a - b); // need sorted, redis may send unsorted memberKeys
            if (keys.length) {
                id = `${parseInt(keys.pop()) + 1}`;
            }
            // ignore editing since its a pure client state handler that has nothing to do with the data
            const todo = { id, text, completed: '' };
            rqRedis({
                todo: {
                    create: {
                        $params: {
                            data: todo,
                            id: 1 // this will be used as secondary key
                        }
                    }
                }
            }, modelOptions).then(() => res.send(react_1.default.createElement(components_1.TodoItem, { ...todo })));
        });
    });
    router.get('/todo-filter', (req, res) => {
        urls = urls.map(f => ({ ...f, selected: f.name === req.query.id }));
        res.send(react_1.default.createElement(components_1.TodoFilter, { filters: urls }));
    });
    router.get('/todo-list', (req, res) => {
        rqRedis({
            data: {
                todos: '*'
            }
        }, modelOptions).then(({ data: { todos } }) => res.send(react_1.default.createElement(components_1.TodoList, { todos: todos, filters: urls })));
    });
    // this can be migrated to FE
    router.get('/toggle-all', (req, res) => {
        rqRedis({
            data: {
                todos: '*'
            }
        }, modelOptions).then(({ data: { todos } }) => res.send(`${todos.filter(t => t.completed === '').length === 0 && todos.length !== 0}`));
    });
    // this can be migrated to FE
    router.get('/completed', (req, res) => {
        // res.send(todos.filter(t => t.completed).length ? 'block' : 'none')
        rqRedis({
            data: {
                todos: '*'
            }
        }, modelOptions).then(({ data: { todos } }) => res.send(todos.filter(t => t.completed === 'completed').length ? 'block' : 'none'));
    });
};
