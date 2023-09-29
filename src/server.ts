import express from 'express'
import serverless from 'serverless-http'
import bodyParser from 'body-parser'
import todoApp from './app'
import path from 'path'
import { processResponse } from './middleware'

const app = express()

const router = express.Router()
app.use(processResponse)
app.use(bodyParser.json())

todoApp(router)

let activePath = ''
if (process.env.NODE_ENV === 'prod') {
  activePath = '/.netlify/functions/server'
}

app.use(activePath, router) // path must route to lambda
app.use('/learn.json', (req, res) => { res.sendFile('{}') })
app.use('/', (req, res) => { res.sendFile(path.join(__dirname, '../index.html')) })

if (process.env.NODE_ENV !== 'prod') {
  const port = process.env.PORT ?? 3000
  app.listen(port, () => { console.log(`Server is running on port ${port}`) })
}

export default app
export const lambdaPath = activePath
export const handler = serverless(app)
