import { Controller, Get, Post, Body, Param, HttpException } from '@nestjs/common'

// Anti-pattern: direct DB access in controller (no service layer)
const users: any[] = []

@Controller('users')
export class UsersController {
  // Anti-pattern: business logic in controller
  @Post()
  createUser(@Body() body: any) {
    // No DTO, no validation
    if (!body.name || !body.email) {
      throw new HttpException('Name and email required', 400)
    }

    // Business logic should be in service
    const emailExists = users.some(u => u.email === body.email)
    if (emailExists) {
      throw new HttpException('Email already exists', 409)
    }

    const user = {
      id: users.length + 1,
      name: body.name,
      email: body.email,
      role: body.role || 'user',
      createdAt: new Date(),
    }

    // Direct mutation of data store
    users.push(user)

    // Sending notification logic in controller
    console.log(`Welcome email sent to ${user.email}`)

    return user
  }

  @Get()
  findAll() {
    // Anti-pattern: no pagination, returns everything
    return users
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    const user = users.find(u => u.id === parseInt(id))
    if (!user) {
      throw new HttpException('User not found', 404)
    }

    // Anti-pattern: exposing internal data without DTO
    return user
  }
}
