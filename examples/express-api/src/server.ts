import express from 'express'

const app = express()
app.use(express.json())

// Anti-pattern: no security middleware (helmet, cors, rate-limit)

// Anti-pattern: magic number
const PORT = 3000

// Users routes inline (no router separation)
const users: any[] = []

app.get('/api/users', (req, res) => {
  // No pagination
  res.json(users)
})

app.post('/api/users', (req, res) => {
  const { name, email, password } = req.body

  // Anti-pattern: storing plain text password
  users.push({ id: users.length + 1, name, email, password })

  // Anti-pattern: returning password in response
  res.json({ success: true, user: users[users.length - 1] })
})

app.get('/api/users/:id', (req, res) => {
  const user = users.find(u => u.id === parseInt(req.params.id))
  if (!user) {
    // Anti-pattern: inconsistent error response format
    res.status(404).send('Not found')
    return
  }
  res.json(user)
})

// Anti-pattern: no global error handler
// Anti-pattern: no graceful shutdown

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
