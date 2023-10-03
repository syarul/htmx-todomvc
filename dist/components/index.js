"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MainTemplate = exports.TodoList = exports.TodoFilter = exports.TodoItem = exports.EditTodo = exports.TodoCheck = void 0;
const react_1 = __importDefault(require("react"));
const classnames_1 = __importDefault(require("classnames"));
const __1 = require("..");
const TodoCheck = ({ id, completed }) => (react_1.default.createElement("input", { className: "toggle", type: "checkbox", defaultChecked: completed === 'completed', "hx-patch": `${__1.lambdaPath}/toggle-todo?id=${id}&completed=${completed === 'completed' ? '' : 'completed'}`, "hx-target": "closest <li/>", "hx-swap": "outerHTML", _: `
      on toggle
        if $toggleAll.checked and my.checked === false
          my.click()
        else if $toggleAll.checked === false and my.checked
          my.click()
    ` }));
exports.TodoCheck = TodoCheck;
const EditTodo = ({ id, text, editing }) => (react_1.default.createElement("input", { className: "edit", name: "text", defaultValue: editing ? text : '', "hx-trigger": "keyup[keyCode==13], text" // capture Enter, ESC and text input
    , "hx-get": `${__1.lambdaPath}/update-todo?id=${id}`, "hx-target": "closest li", "hx-swap": "outerHTML", _: `
      on keyup[keyCode==27] remove .editing from closest <li/>
      on htmx:afterRequest send focus to <input.new-todo/>
    `, autoFocus: true }));
exports.EditTodo = EditTodo;
const TodoItem = ({ id, text, completed }) => (react_1.default.createElement("li", { key: id, className: (0, classnames_1.default)('todo', { completed }), _: `
      on destroy my.querySelector('button').click()
      on show wait 20ms
        if window.location.hash === '#/active' and my.classList.contains('completed')
          set my.style.display to 'none'
        else if window.location.hash === '#/completed' and my.classList.contains('completed') === false
          set my.style.display to 'none'
        else
          set my.style.display to 'block'
    ` },
    react_1.default.createElement("div", { className: "view" },
        react_1.default.createElement(exports.TodoCheck, { id: id, completed: completed }),
        react_1.default.createElement("label", { "hx-trigger": "dblclick", "hx-patch": `${__1.lambdaPath}/edit-todo?id=${id}&text=${text}`, "hx-target": "next input", "hx-swap": "outerHTML", _: `
          on dblclick add .editing to the closest <li/>
          on htmx:afterRequest wait 50ms
            set $el to my.parentNode.nextSibling
            set $el.selectionStart to $el.value.length
        ` }, text),
        react_1.default.createElement("button", { className: "destroy", "hx-delete": `${__1.lambdaPath}/remove-todo?id=${id}`, "hx-trigger": "click", "hx-target": "closest li", _: `
          on htmx:afterRequest 
            send toggleDisplayClearCompleted to <button.clear-completed/>
            send todoCount to <span.todo-count/>
            send toggleAll to <input.toggle-all/>
            send footerToggleDisplay to <footer.footer/>
            send labelToggleAll to <label/>
            send focus to <input.new-todo/>
        ` })),
    react_1.default.createElement(exports.EditTodo, { id: id, text: text })));
exports.TodoItem = TodoItem;
const TodoFilter = ({ filters }) => (react_1.default.createElement("ul", { className: "filters" }, filters.map(({ url, name, selected }) => (react_1.default.createElement("li", { key: name },
    react_1.default.createElement("a", { className: (0, classnames_1.default)({ selected }), href: url, "hx-get": `${__1.lambdaPath}/todo-filter?id=${name}`, "hx-trigger": "click", "hx-target": ".filters", "hx-swap": "outerHTML", _: "on htmx:afterRequest send show to <li.todo/>" }, `${name.charAt(0).toUpperCase()}${name.slice(1)}`))))));
exports.TodoFilter = TodoFilter;
const TodoList = ({ todos }) => todos.map(exports.TodoItem);
exports.TodoList = TodoList;
const MainTemplate = ({ todos, filters }) => (react_1.default.createElement("html", { lang: "en", "data-framework": "htmx" },
    react_1.default.createElement("head", null,
        react_1.default.createElement("meta", { charSet: "utf-8" }),
        react_1.default.createElement("title", null, "HTMX \u2022 TodoMVC"),
        react_1.default.createElement("link", { rel: "stylesheet", href: "https://unpkg.com/todomvc-common@1.0.5/base.css", type: "text/css" }),
        react_1.default.createElement("link", { rel: "stylesheet", href: "https://unpkg.com/todomvc-app-css/index.css", type: "text/css" })),
    react_1.default.createElement("body", null,
        react_1.default.createElement("section", { className: "todoapp", "hx-get": `${__1.lambdaPath}/get-hash`, "hx-vals": "js:{hash: window.location.hash}", "hx-trigger": "load", "hx-target": ".filters", "hx-swap": "outerHTML" },
            react_1.default.createElement("header", { className: "header" },
                react_1.default.createElement("h1", null, "todos"),
                react_1.default.createElement("input", { id: "new-todo", name: "text", className: "new-todo", placeholder: "What needs to be done?", "hx-get": `${__1.lambdaPath}/new-todo`, "hx-trigger": "keyup[keyCode==13], text", "hx-target": ".todo-list", "hx-swap": "beforeend", _: `
              on htmx:afterRequest set my value to ''
              on focus my.focus()
            `, autoFocus: true })),
            react_1.default.createElement("section", { className: "main" },
                react_1.default.createElement("input", { id: "toggle-all", className: "toggle-all", type: "checkbox", defaultChecked: todos.filter(t => !t.completed).length === 0 && todos.length !== 0, _: `
              on load set $toggleAll to me
              on toggleAll debounced at 100ms
                fetch ${__1.lambdaPath}/toggle-all then
                if it === 'true' and my.checked === false then
                  set my.checked to true
                else
                  if my.checked === true and it === 'false' then set my.checked to false
                end
              end
              on click send toggle to <input.toggle/>
            ` }),
                react_1.default.createElement("label", { htmlFor: "toggle-all", _: `
             on load send labelToggleAll to me
             on labelToggleAll debounced at 100ms
               if $todo.hasChildNodes() set my.style.display to 'flex'
               else set my.style.display to 'none'
           `, style: { display: 'none' } }, "Mark all as complete"),
                react_1.default.createElement("ul", { className: "todo-list", _: `
              on load debounced at 10ms 
                set $todo to me
                send toggleDisplayClearCompleted to <button.clear-completed/>
                send footerToggleDisplay to <footer.footer/>
                send todoCount to <span.todo-count/>
                send toggleAll to <input.toggle-all/>
                send footerToggleDisplay to <footer.footer/>
                send labelToggleAll to <label/>
                send show to <li.todo/>
            ` },
                    react_1.default.createElement(exports.TodoList, { todos: todos, filters: filters }))),
            react_1.default.createElement("footer", { className: "footer", _: `
          on load send footerToggleDisplay to me
          on footerToggleDisplay debounced at 100ms
            if $todo.hasChildNodes() set my.style.display to 'block'
            else set my.style.display to 'none'
            send focus to <input.new-todo/>
        `, style: { display: 'none' } },
                react_1.default.createElement("span", { className: "todo-count", "hx-trigger": "load", _: `
              on load send todoCount to me
              on todoCount debounced at 100ms
                fetch ${__1.lambdaPath}/update-counts then put the result into me
            ` }),
                react_1.default.createElement(exports.TodoFilter, { filters: filters }),
                react_1.default.createElement("button", { className: "clear-completed", _: `
              on load send toggleDisplayClearCompleted to me
              on toggleDisplayClearCompleted debounced at 100ms
                fetch ${__1.lambdaPath}/completed then
                set my.style.display to it
              end
              on click send destroy to <li.completed/>
            ` }, "Clear Complete"))),
        react_1.default.createElement("footer", { className: "info", _: "on load debounced at 100ms call startMeUp()" },
            react_1.default.createElement("p", null, "Double-click to edit a todo"),
            react_1.default.createElement("p", null,
                "Created by ",
                react_1.default.createElement("a", { href: "http://github.com/syarul/" }, "syarul")),
            react_1.default.createElement("p", null,
                "Part of ",
                react_1.default.createElement("a", { href: "http://todomvc.com" }, "TodoMVC")),
            react_1.default.createElement("img", { src: "https://htmx.org/img/createdwith.jpeg", width: "250", height: "auto" })),
        react_1.default.createElement("script", { src: "https://unpkg.com/todomvc-common@1.0.5/base.js" }),
        react_1.default.createElement("script", { src: "https://unpkg.com/htmx.org@1.9.6" }),
        react_1.default.createElement("script", { src: "https://unpkg.com/hyperscript.org/dist/_hyperscript.js" }),
        react_1.default.createElement("script", { type: "text/hyperscript" }, `
          def startMeUp()
            log \`this is TodoMVC app build with HTMX!\`
          end
        `))));
exports.MainTemplate = MainTemplate;
