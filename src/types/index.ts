import { type Request as ExpressRequest } from 'express'

declare module 'react' {
  interface HTMLAttributes<T> extends DOMAttributes<T> {
    // extends React's HTMLAttributes
    _?: string
  }
}

export interface Request extends ExpressRequest {
  query: {
    text: string
    id: string
  }
}

export interface Todo {
  id: string
  text?: string
  completed?: boolean
  editing?: boolean
}

export interface Todos {
  todos: Todo[] // An array of Todo objects
}
