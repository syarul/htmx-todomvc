"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cacheControl = exports.processResponse = void 0;
const server_1 = require("react-dom/server");
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
