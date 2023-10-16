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
exports.updateStoreMiddleware = exports.storeMiddleware = exports.filters = exports.todos = exports.cacheControl = exports.processResponse = void 0;
// import { type filter } from './types'
const server_1 = require("react-dom/server");
// import { readFileSync, writeFileSync } from 'fs'
// import path from 'path'
const ioredis_1 = __importDefault(require("ioredis"));
const dotenv = __importStar(require("dotenv"));
dotenv.config();
// eslint-disable-next-line @typescript-eslint/no-var-requires
const rq = require('requrse');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const rqRedis = require('rq-redis');
const redis = new ioredis_1.default(`rediss://default:${process.env.REDIS_KEY}@us1-capital-badger-41133.upstash.io:41133`);
const redisKey = `${process.env.REDIS_MKEY}_todos`;
const memberKey = `${process.env.REDIS_MKEY}_todo_ids`;
const redisKeyFilter = `${process.env.REDIS_MKEY}_filters`;
const memberKeyFilter = `${process.env.REDIS_MKEY}_filter_ids`;
const modelTodo = {
    rq,
    redis,
    redisKey,
    memberKey,
    options: {
        methods: {
            create: 'create,data|id',
            update: 'update,id|data|id',
            remove: 'remove,id|id',
            async all() {
                return await Promise.all((await redis.smembers(memberKey)).sort().map(async (id) => {
                    const res = await redis.hgetall(`${redisKey}:${id}`);
                    return res;
                }));
            }
        }
    }
};
const modelFilter = {
    rq,
    redis,
    redisKey: redisKeyFilter,
    memberKey: memberKeyFilter,
    options: {
        methods: {
            create: 'create,data|name',
            update: 'update,id|data|name',
            remove: 'remove,id|name',
            async all() {
                return await Promise.all((await redis.smembers(memberKeyFilter)).sort().map(async (id) => {
                    const res = await redis.hgetall(`${redisKeyFilter}:${id}`);
                    return res;
                }));
            }
        }
    }
};
function processResponse(req, res, next) {
    const originalSend = res.send.bind(res);
    res.send = function (data) {
        if (typeof data === 'string') {
            return originalSend(data);
        }
        return originalSend((0, server_1.renderToString)(data));
    };
    next();
}
exports.processResponse = processResponse;
function cacheControl(req, res, next) {
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Cache-Control', 's-max-age=1, stale-while-revalidate');
    next();
}
exports.cacheControl = cacheControl;
// replaceable with database model
exports.todos = 'todos'; // path.join('/tmp', 'todos.json')
exports.filters = 'filters'; // path.join('/tmp', 'urls.json')
const normalize = (d) => {
    const o = {};
    for (const attr in d) {
        if (d[attr] === 'false' || d[attr] === 'true') {
            o[attr] = JSON.parse(d[attr]);
        }
        else {
            o[attr] = d[attr];
        }
    }
    return o;
};
const store = async ({ file, update, selectorValue, action = 'all' }) => {
    const model = {
        todos: modelTodo,
        filters: modelFilter
    };
    const selectedModel = model[file];
    if (action === 'create') {
        const { data: { getMemberKeys: { keys } } } = await rqRedis({
            data: {
                getMemberKeys: '*'
            }
        }, selectedModel);
        let id = '0';
        keys.sort((a, b) => a - b); // need sorted, redis may send unsorted memberKeys
        if (keys.length) {
            id = `${parseInt(keys.pop()) + 1}`;
        }
        const res = await rqRedis({
            [file]: {
                [action]: {
                    $params: {
                        data: { ...update, id }
                    },
                    ...(file === 'todos' ? { id: 1, text: 1, completed: 1 } : { name: 1 })
                }
            }
        }, selectedModel);
        return normalize(res[file][action]);
    }
    else if (action === 'remove') {
        await rqRedis({
            [file]: {
                [action]: {
                    $params: {
                        id: selectorValue
                    }
                }
            }
        }, selectedModel);
    }
    else if (action === 'get') {
        const res = await rqRedis({
            [file]: {
                [action]: {
                    $params: {
                        id: selectorValue
                    },
                    id: 1,
                    text: 1,
                    completed: 1
                }
            }
        }, selectedModel);
        return normalize(res[file][action]);
    }
    else if (action === 'update') {
        await rqRedis({
            [file]: {
                [action]: {
                    $params: {
                        id: selectorValue,
                        data: update
                    }
                }
            }
        }, selectedModel);
    }
    else {
        const { data } = await rqRedis({ data: { [action]: '*' } }, selectedModel);
        return data[action].map(normalize);
    }
};
const catcher = (err) => { console.error(err); };
// do once to store filters in db
// const urls: filter[] = [
//   { url: '#/', name: 'all', selected: true },
//   { url: '#/active', name: 'active', selected: false },
//   { url: '#/completed', name: 'completed', selected: false }
// ]
// const init = async (): Promise<any> => {
//   for (const update of urls) {
//     await store({ file: filters, update, action: 'create' })
//   }
// }
// init().catch(catcher)
function storeMiddleware(req, res, next) {
    req.body = req.body || {};
    const load = async () => {
        for (const file of [exports.todos, exports.filters]) {
            if (req.query.id && file === exports.todos) {
                await store({ file, selectorValue: req.query.id, action: 'get' }).then(result => {
                    req.body.todo = result;
                });
            }
            else {
                await store({ file }).then(result => {
                    req.body[file] = result || [];
                }).catch(catcher);
            }
        }
    };
    load().then(() => { next(); }).catch(catcher);
}
exports.storeMiddleware = storeMiddleware;
function updateStoreMiddleware(file, update, req, next, action, selectorValue) {
    store({ file, update, selectorValue, action }).then((result) => {
        if (file === exports.todos && action === 'create') {
            req.body.todo = result;
        }
        next();
    }).catch(catcher);
}
exports.updateStoreMiddleware = updateStoreMiddleware;
