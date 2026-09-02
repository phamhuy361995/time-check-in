import express from 'express'
import app from './server/app.js'

// Vercel nhận diện file server.js ở thư mục gốc và đóng gói Express
// thành một Vercel Function. Không gọi app.listen() trong entrypoint này.
void express
export default app
