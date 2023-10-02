import express from 'express'
import todoApp from './app'
import { cacheControl, processResponse } from './middleware'

const app = express()

app.use(processResponse)
app.use(cacheControl)

todoApp(app)

app.use('/learn.json', (req, res) => { res.sendFile('{}') })

if (process.env.NODE_ENV !== 'prod') {
  const port = process.env.PORT ?? 3000
  app.listen(port, () => { console.log(`Server is running on port ${port}`) })
}

let lambdaPath = ''
if (process.env.NODE_ENV === 'prod') {
  lambdaPath = '/api'
}

export default app
export {
  app,
  lambdaPath
}
module.exports = app
