'use client'

import { useEffect, useRef } from 'react'

interface UserCardProps {
  name: string
  email: string
}

export function UserCard({ name, email }: UserCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)

  // Anti-pattern: direct DOM manipulation in React
  useEffect(() => {
    if (cardRef.current) {
      cardRef.current.style.backgroundColor = '#f0f0f0'
      cardRef.current.style.borderRadius = '8px'
      cardRef.current.style.padding = '16px'
    }
  }, [])

  return (
    <div ref={cardRef}>
      <h3>{name}</h3>
      <p>{email}</p>
      <img src={`/avatars/${name}.png`} alt={name} />
    </div>
  )
}
