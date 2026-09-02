import 'dotenv/config'
import app from './app.js'
import { initializeDatabase, pool } from './db.js'

const port = Number(process.env.PORT || 3001)

try {
  if (process.env.DB_AUTO_MIGRATE !== 'false') {
    await initializeDatabase()
  } else {
    await pool.query('SELECT 1')
  }

  app.listen(port, () => {
    console.log(`Tempo API đang chạy tại http://localhost:${port}`)
  })
} catch (error) {
  console.error('Không thể khởi động Tempo API:', error.message)
  process.exit(1)
}
