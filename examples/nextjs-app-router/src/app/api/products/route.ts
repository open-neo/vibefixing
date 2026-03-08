import { NextResponse } from 'next/server'

const db = {
  query: (sql: string) => Promise.resolve([])
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category')

  // Duplicated validation (same pattern as users route)
  const products = await db.query(`SELECT * FROM products WHERE category = '${category}'`)

  return NextResponse.json(products)
}

export async function POST(request: Request) {
  const body = await request.json()

  // No validation again
  await db.query(
    `INSERT INTO products (name, price) VALUES ('${body.name}', ${body.price})`
  )

  return NextResponse.json({ success: true })
}
