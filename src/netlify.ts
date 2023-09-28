import express from 'express'
import serverless from 'serverless-http'
import bodyParser from 'body-parser'
// import app from './app'

const app = express()
const router = express.Router()

// app.use('*', router)
router.get('/', (req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html' })
  res.write('<h1>Hello from Express.js!</h1>')
  res.end()
})
router.get('/another', (req, res) => res.json({ route: req.originalUrl }))
router.post('/', (req, res) => res.json({ postBody: req.body }))

app.use(bodyParser.json())
app.use('/.netlify/functions/server', router) // path must route to lambda

export const handler = serverless(app)
