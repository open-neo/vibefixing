'use client'

export default function HomePage() {
  const data = [
    { id: 1, name: 'Item 1', price: 10 },
    { id: 2, name: 'Item 2', price: 20 },
  ]

  return (
    <div style={{ padding: '20px' }}>
      <h1>Welcome</h1>
      <img src="/hero.png" alt="Hero" width={800} height={400} />
      {data.map((item) => (
        <div key={item.id}>
          <p>{item.name} - ${item.price}</p>
        </div>
      ))}
    </div>
  )
}
