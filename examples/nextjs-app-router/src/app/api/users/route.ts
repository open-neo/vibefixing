import { NextResponse } from 'next/server'

// Simulated DB connection (anti-pattern: direct DB in route handler)
const db = {
  query: (sql: string) => Promise.resolve([{ id: 1, name: 'test' }])
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const name = searchParams.get('name')

  // Anti-pattern: SQL string concatenation
  const users = await db.query(`SELECT * FROM users WHERE name = '${name}'`)

  return NextResponse.json(users)
}

export async function POST(request: Request) {
  const body = await request.json()

  // Anti-pattern: no input validation
  const result = await db.query(
    `INSERT INTO users (name, email) VALUES ('${body.name}', '${body.email}')`
  )

  return NextResponse.json({ success: true, data: result })
}
