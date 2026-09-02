import express from 'express'
import { configureApp } from './app.js'

// Keep the Express app creation in Vercel's detected entrypoint. Vercel then
// discovers the routes and bundles this file as one serverless function.
const app = express()
configureApp(app)

export default app
