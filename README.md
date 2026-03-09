<p align="center">
  <img src="https://img.shields.io/badge/VibeFixing-code%20health%20for%20AI%20era-blue?style=for-the-badge" alt="VibeFixing" />
</p>

<h3 align="center">Code health CLI for the AI coding era.</h3>

<p align="center">
  Detect architecture issues, security risks, and quality problems<br>
  — aware of your stack, framework, and workflow.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/vibefixing"><img src="https://img.shields.io/npm/v/vibefixing.svg" alt="npm version" /></a>
  <a href="https://pypi.org/project/vibefixing/"><img src="https://img.shields.io/pypi/v/vibefixing.svg" alt="PyPI version" /></a>
  <a href="https://github.com/open-neo/vibefixing/stargazers"><img src="https://img.shields.io/github/stars/open-neo/vibefixing?style=social" alt="GitHub stars" /></a>
  <a href="https://github.com/open-neo/vibefixing/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-Apache%202.0-green.svg" alt="License" /></a>
</p>

<p align="center">
  <a href="#quick-start">Quick Start</a> &middot;
  <a href="#what-it-checks">What It Checks</a> &middot;
  <a href="#built-in-skills">Skills</a> &middot;
  <a href="#github-action">GitHub Action</a> &middot;
  <a href="#open-source-vs-cloud">OSS vs Cloud</a> &middot;
  <a href="#contributing">Contributing</a>
</p>

---

## Why Now

AI writes code faster than teams can review it.

eslint checks syntax. VibeFixing checks your **stack**, **architecture**, and **workflow** — then tells you what's actually broken.

## Quick Start

```bash
# npm
npm install -g vibefixing

# pip
pip3 install vibefixing
```

```bash
vibefixing doctor
```

Zero config. Auto-detects your stack and applies the right skills.

### Example Output

```
 VibeFixing v0.1.0

 Environment
  ✔ Node.js 18+
  ✔ Git repository detected
  ✔ API key configured

 Skills detected
  ✔ TypeScript
  ✔ Next.js (App Router)
  ✔ OWASP Top 10

 Project Health
  Architecture   ███████████████░░░░░  78
  Security       ████████████░░░░░░░░  64
  Quality        ██████████████░░░░░░  72
  ─────────────────────────────────────
  Overall        █████████████░░░░░░░  71

 Top recommendations
  1. [high]   Direct DB access in API route handlers — extract to service layer
  2. [high]   Missing CSRF protection on mutation endpoints
  3. [medium] 'use client' applied to 12 components that use no browser APIs
  4. [medium] Duplicated validation logic across 3 route handlers
  5. [low]    next/image not used in 8 components with <img> tags
```

## Before / After

Real output from an AI-generated Next.js codebase:

| | Before | After diagnosis |
|---|---|---|
| Input validation | None | 6 injection vectors found |
| DB access | Direct calls in route handlers | Service layer extraction recommended |
| Business logic | Duplicated across 3 routes | Consolidation points identified |
| Architecture score | — | 78 |
| Security score | — | 64 |

VibeFixing doesn't auto-rewrite your code. It **diagnoses** what's broken so you fix it right.

## What It Checks

| Category | Examples |
|---|---|
| **Security** | OWASP Top 10, hardcoded secrets, injection vectors, insecure defaults |
| **Architecture** | Layer violations, circular dependencies, god objects, missing boundaries |
| **Framework** | Next.js App Router misuse, NestJS DI anti-patterns, Express middleware gaps |
| **Infrastructure** | Docker security, Terraform state management, K8s resource limits, CI/CD hardening |
| **Database** | Missing indexes, N+1 queries, unparameterized queries, connection pooling |
| **Quality** | Dead code, duplicated logic, complexity hotspots, missing error handling |
| **Language** | TypeScript strict mode gaps, Python type hints, Go error handling, Java null safety |

## Built-in Skills

VibeFixing uses **skills** — structured analysis packs that understand specific languages, frameworks, and architectures.

Each skill is based on official documentation and industry-standard references:

| Category | Skill | Reference |
|---|---|---|
| Language | `typescript` | [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/) |
| Language | `python` | [PEP 8](https://peps.python.org/pep-0008/) / [Python Docs](https://docs.python.org/3/) |
| Language | `go` | [Effective Go](https://go.dev/doc/effective_go) |
| Language | `java` | [Oracle Java SE Best Practices](https://dev.java/learn/) |
| Language | `javascript` | [MDN JavaScript Guide](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide) |
| Language | `rust` | [The Rust Book](https://doc.rust-lang.org/book/) |
| Language | `ruby` | [Ruby Style Guide](https://rubystyle.guide/) |
| Language | `php` | [PHP The Right Way](https://phptherightway.com/) |
| Language | `csharp` | [C# Documentation](https://learn.microsoft.com/en-us/dotnet/csharp/) |
| Language | `swift` | [Swift.org Documentation](https://www.swift.org/documentation/) |
| Language | `kotlin` | [Kotlin Docs](https://kotlinlang.org/docs/home.html) |
| Language | `scala` | [Scala Documentation](https://docs.scala-lang.org/) |
| Language | `dart` | [Effective Dart](https://dart.dev/effective-dart) |
| Language | `elixir` | [Elixir Guides](https://elixir-lang.org/getting-started/) |
| Framework | `nextjs` | [Next.js Docs](https://nextjs.org/docs) |
| Framework | `react` | [React Docs](https://react.dev/reference/react) |
| Framework | `nestjs` | [NestJS Docs](https://docs.nestjs.com/) |
| Framework | `express` | [Express.js Guide](https://expressjs.com/en/guide/routing.html) |
| Framework | `django` | [Django Docs](https://docs.djangoproject.com/) |
| Framework | `flask` | [Flask Docs](https://flask.palletsprojects.com/) |
| Framework | `vue` | [Vue.js Docs](https://vuejs.org/guide/) |
| Framework | `angular` | [Angular Docs](https://angular.dev/) |
| Framework | `nuxt` | [Nuxt Docs](https://nuxt.com/docs) |
| Framework | `sveltekit` | [SvelteKit Docs](https://svelte.dev/docs/kit/) |
| Framework | `spring` | [Spring Boot Docs](https://docs.spring.io/spring-boot/reference/) |
| Framework | `rails` | [Rails Guides](https://guides.rubyonrails.org/) |
| Framework | `laravel` | [Laravel Docs](https://laravel.com/docs/) |
| Framework | `fastapi` | [FastAPI Docs](https://fastapi.tiangolo.com/) |
| Framework | `aspnet` | [ASP.NET Core Docs](https://learn.microsoft.com/en-us/aspnet/core/) |
| Framework | `flutter` | [Flutter Docs](https://docs.flutter.dev/) |
| Framework | `remix` | [Remix Docs](https://remix.run/docs/) |
| Framework | `astro` | [Astro Docs](https://docs.astro.build/) |
| Framework | `supabase` | [Supabase Docs](https://supabase.com/docs) |
| Framework | `firebase` | [Firebase Docs](https://firebase.google.com/docs) |
| Security | `owasp-top10` | [OWASP Top 10 (2021)](https://owasp.org/www-project-top-ten/) |
| Security | `secrets-detection` | [OWASP Secrets Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html) |
| Architecture | `clean-architecture` | [The Clean Architecture — Robert C. Martin](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html) |
| Architecture | `ddd` | [Domain-Driven Design Reference — Eric Evans](https://www.domainlanguage.com/ddd/reference/) |
| Infrastructure | `aws` | [AWS Well-Architected](https://aws.amazon.com/architecture/well-architected/) |
| Infrastructure | `gcp` | [GCP Best Practices](https://cloud.google.com/docs/enterprise/best-practices-for-enterprise-organizations) |
| Infrastructure | `azure` | [Azure Well-Architected](https://learn.microsoft.com/en-us/azure/well-architected/) |
| Infrastructure | `terraform` | [Terraform Best Practices](https://developer.hashicorp.com/terraform/cloud-docs/recommended-practices) |
| Infrastructure | `docker` | [Dockerfile Best Practices](https://docs.docker.com/build/building/best-practices/) |
| Infrastructure | `kubernetes` | [Kubernetes Docs](https://kubernetes.io/docs/home/) |
| Infrastructure | `github-actions` | [GitHub Actions Docs](https://docs.github.com/en/actions) |
| Database | `postgresql` | [PostgreSQL Docs](https://www.postgresql.org/docs/) |
| Database | `mysql` | [MySQL Docs](https://dev.mysql.com/doc/) |
| Database | `mongodb` | [MongoDB Docs](https://www.mongodb.com/docs/) |
| Database | `redis` | [Redis Docs](https://redis.io/docs/) |
| Database | `bigquery` | [BigQuery Docs](https://cloud.google.com/bigquery/docs) |
| Database | `firestore` | [Firestore Docs](https://firebase.google.com/docs/firestore) |

**51 built-in skills. Auto-detected. No config needed.**

### Custom Skills

Add your own skills for team-specific patterns:

```yaml
# .vibefixing/skills/my-team-rules.yml
skillId: my-team-rules
category: architecture
name: My Team Rules
version: "1.0.0"
match:
  files: ["*.ts"]
rules:
  - "All API handlers must use the withAuth wrapper"
  - "Database access only through repository classes"
antiPatterns:
  - "Direct Prisma calls outside /repositories"
  - "Missing error boundary in page components"
```

## Commands

```bash
vibefixing doctor            # Health check — architecture, security, quality scores
vibefixing scan [path]       # Scan for issues using activated skills
vibefixing skills list       # Show available and active skills
vibefixing skills detect     # Detect which skills match your project
vibefixing init              # Initialize config
vibefixing upgrade           # Self-update
```

Output formats: `table` (default), `json`, `sarif` (GitHub Code Scanning).

## GitHub Action

Run VibeFixing on every PR:

```yaml
name: VibeFixing
on: pull_request

jobs:
  review:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: write
    steps:
      - uses: actions/checkout@v4
      - uses: open-neo/vibefixing-action@v1
        with:
          scan: 'true'
          severity: 'medium'
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
```

PR comments show findings inline with severity and suggested fixes.

<!-- TODO: PR comment screenshot -->

## Supported Stacks

**Languages**: TypeScript, JavaScript, Python, Go, Java, Rust, Ruby, PHP, C#, Swift, Kotlin, Scala, Dart, Elixir

**Frameworks**: Next.js, React, NestJS, Express, Django, Flask, Vue, Angular, Nuxt, SvelteKit, Spring, Rails, Laravel, FastAPI, ASP.NET, Flutter, Remix, Astro, Supabase, Firebase

**Infrastructure**: AWS, GCP, Azure, Terraform, Docker, Kubernetes, GitHub Actions

**Databases**: PostgreSQL, MySQL, MongoDB, Redis, BigQuery, Firestore

**Architectures**: Clean Architecture, DDD, Layered, MVC

More stacks added through [skill contributions](#contributing).

## Open Source vs Cloud

| | OSS (this repo) | Cloud |
|---|---|---|
| CLI | ✔ | ✔ |
| Skills | ✔ | ✔ |
| GitHub Action | ✔ | ✔ |
| AI-powered review | — | ✔ |
| Auto-fix engine | — | ✔ |
| Patch ranking | — | ✔ |
| Team dashboard | — | ✔ |
| Repo-wide analytics | — | ✔ |
| Policy management | — | ✔ |

The CLI is free and open source (Apache 2.0).

## Configuration

VibeFixing works with zero config. For customization:

```yaml
# .vibefixing.yml
version: "1"
ai:
  provider: anthropic
skills:
  enabled: [typescript, nextjs, owasp-top10]
  custom: ./my-skills
scan:
  severity: medium
  ignore: ["**/*.test.ts", "dist/**"]
```

## Contributing

The easiest way to contribute is to add a new skill pack.

1. Create a YAML file in `skills/<category>/`
2. Define `skillId`, `match`, `rules`, and `antiPatterns`
3. Submit a PR

Look for issues labeled **`good first issue`** — scoped to single skill additions or rule improvements.

```bash
git clone https://github.com/open-neo/vibefixing.git
cd vibefixing
pnpm install
pnpm build
pnpm test
```

## License

Apache 2.0
