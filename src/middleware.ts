import { type Response, type NextFunction } from 'express'
import { type Request } from './types'
import { renderToString } from 'react-dom/server'

export function processResponse (req: Request, res: Response, next: NextFunction): void {
  const originalSend: (body?: any) => Response = res.send.bind(res)
  res.send = function (data: any): Response {
    if (typeof data === 'string') {
      return originalSend(data)
    }
    return originalSend(renderToString(data))
  }
  next()
}
