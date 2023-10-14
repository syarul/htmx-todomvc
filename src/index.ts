import express from 'express'
import todoApp from './app'
import { cacheControl, processResponse, storeMiddleware } from './middleware'

const app = express()

app.use(processResponse)
app.use(cacheControl)
app.use(storeMiddleware)

todoApp(app)

const port = process.env.PORT ?? 3000
app.listen(port, () => { console.log(`Server is running on port ${port}`) })

const lambdaPath = ''

export default app
export {
  app,
  lambdaPath
}
module.exports = app
