import app from './app'
import express from 'express'

const router = express.Router()

const port = process.env.PORT ?? 3000

app.use('*', router)

app.listen(port, () => { console.log(`Server is running on port ${port}`) })
