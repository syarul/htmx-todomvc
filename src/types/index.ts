import { type Request as ExpressRequest } from 'express'

declare module 'react' {
  interface HTMLAttributes<T> extends DOMAttributes<T> {
    // extends React's HTMLAttributes
    _?: string
    after?: string
  }
}

export interface Todo {
  id: string
  text?: string
  completed?: boolean
  editing?: boolean
}

export interface Todos {
  todos: Todo[]
  filters: filter[]
}

export interface filter {
  url: string
  name: string
  selected: boolean
}

export interface Filter {
  filters: filter[]
}

export interface Request extends ExpressRequest {
  query: {
    text: string
    id: string
    hash: string
    editing: string
  }
  body: { // cache todos in body request
    todos: Todo[]
    filters: filter[]
    todo: Todo
  }
}
