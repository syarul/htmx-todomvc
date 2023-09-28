import express from 'express'
import serverless from 'serverless-http'
import bodyParser from 'body-parser'
import app from './app'

const router = express.Router()

app.use('*', router)

app.use(bodyParser.json())
app.use('/.netlify/functions/server', router) // path must route to lambda

export const handler = serverless(app)
