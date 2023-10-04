"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.lambdaPath = exports.app = void 0;
const express_1 = __importDefault(require("express"));
const app_1 = __importDefault(require("./app"));
const middleware_1 = require("./middleware");
const app = (0, express_1.default)();
exports.app = app;
app.use(middleware_1.processResponse);
// app.use(cacheControl)
(0, app_1.default)(app);
const port = (_a = process.env.PORT) !== null && _a !== void 0 ? _a : 3000;
app.listen(port, () => { console.log(`Server is running on port ${port}`); });
const lambdaPath = '';
exports.lambdaPath = lambdaPath;
exports.default = app;
module.exports = app;
