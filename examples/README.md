# VibeFixing Examples

Example projects with intentional issues for demonstrating VibeFixing.

## Projects

| Example | Stack | Issues |
|---|---|---|
| [nextjs-app-router](./nextjs-app-router) | Next.js 14, TypeScript | SQL injection, hardcoded secrets, unnecessary 'use client', missing next/image |
| [nestjs-layered](./nestjs-layered) | NestJS, TypeScript | Business logic in controllers, no service layer, no DTOs, god objects |
| [express-api](./express-api) | Express, TypeScript | No security middleware, plain text passwords, no error handling |

## Usage

```bash
# Run doctor on an example
cd examples/nextjs-app-router
npx vibefixing doctor

# Scan for issues
npx vibefixing scan

# Detect applicable skills
npx vibefixing skills detect
```
