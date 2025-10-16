# Project Context

## Purpose
Freelancer Hub is a full-stack time tracking and project management application designed for freelancers and agencies to manage their client work, track time, generate invoices, and handle team collaboration. The application follows a local-first architecture with real-time synchronization capabilities.

**Core Goals:**
- Enable accurate time tracking across multiple projects and clients
- Streamline invoice generation and payment processing
- Support multi-tenant team collaboration
- Provide real-time data sync across devices
- Maintain 100% test coverage with behavior-driven testing

## Tech Stack

### Backend
- **AdonisJS v6** - REST API framework with TypeScript
- **PostgreSQL** - Primary database
- **Lucid ORM** - Database ORM for AdonisJS
- **VineJS** - Request validation
- **Japa** - Testing framework (unit + functional tests)

### Frontend
- **React 19** - UI library (SPA)
- **Refine v5** - Framework for CRUD applications
- **Ant Design v5** - UI component library (with React 19 compatibility patch)
- **React Router v7** - Routing
- **Zustand** - State management
- **Vite** - Build tool and dev server
- **TypeScript** - Type safety (strict mode)

### Data Sync & Infrastructure
- **Electric SQL** - Local-first real-time data synchronization
- **Docker** - For running Electric SQL sync server
- **JWT** - Authentication tokens

### Development Tools
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **TypeScript Compiler** - Type checking

## Project Conventions

### Code Style

**TypeScript Strict Mode (Non-Negotiable):**
- No `any` types ever - use `unknown` if type is truly unknown
- No type assertions (`as SomeType`) without clear justification
- No `@ts-ignore` or `@ts-expect-error` without explicit explanation
- All strict mode flags enabled including `noUnusedLocals` and `noUnusedParameters`
- These rules apply to both production AND test code

**Naming Conventions:**
- Functions: `camelCase`, verb-based (e.g., `calculateTotal`, `validatePayment`)
- Types: `PascalCase` (e.g., `PaymentRequest`, `UserProfile`)
- Constants: `UPPER_SNAKE_CASE` for true constants, `camelCase` for configuration
- Files: `kebab-case.ts` for all TypeScript files
- Test files: `*.test.ts` or `*.spec.ts`

**Functional Programming Principles:**
- **No data mutation** - all data structures must be immutable
- **Pure functions** wherever possible
- **Composition** as primary mechanism for code reuse
- Use array methods (`map`, `filter`, `reduce`) over imperative loops
- Avoid heavy FP abstractions unless there's clear advantage

**Code Structure:**
- No nested if/else statements - use early returns or guard clauses
- Avoid deep nesting (max 2 levels)
- Keep functions small and focused on single responsibility
- Prefer flat, readable code over clever abstractions
- **No comments** - code should be self-documenting through clear naming
- **Prefer options objects** over multiple positional parameters

**Backend Path Aliases:**
- `#controllers/*` → `./app/controllers/*.js`
- `#models/*` → `./app/models/*.js`
- `#services/*` → `./app/services/*.js`
- `#validators/*` → `./app/validators/*.js`
- `#middleware/*` → `./app/middleware/*.js`
- Note: Import extensions (`.js`) are required for ESM compatibility

### Architecture Patterns

**Monorepo Structure:**
```
freelancer-hub-project/
├── freelancer-hub-backend/     # AdonisJS REST API
└── freelancer-hub-dashboard/   # React SPA
```

**Multi-Tenancy (Slug-based):**
- Each tenant has unique slug (e.g., `/tenants/acme-corp`)
- Users belong to tenants via `Tenant` model
- All routes scoped under `/tenants/:slug`
- Frontend uses `TenantProvider` context for current tenant state
- Backend controllers filter data by tenant automatically

**Local-First with Electric SQL:**
- Frontend maintains local state synced with backend
- Electric SQL provides real-time bidirectional sync
- Database changes propagate to all connected clients
- Optimistic UI updates with eventual consistency

**Backend Layered Architecture:**
- **Controllers** - HTTP request handlers (tenant-aware)
- **Services** - Business logic layer
- **Models** - Lucid ORM models
- **Validators** - VineJS request validation
- **Middleware** - HTTP middleware (auth, CORS, etc.)

**Frontend Architecture:**
- **Pages** - Feature-organized page components
- **Components** - Reusable UI components
- **Stores** - Zustand state management (filters, views, favorites, UI)
- **Providers** - Refine data providers (tenant-aware)
- **Services** - API client and services
- **Contexts** - React contexts (tenant, color-mode)

### Testing Strategy

**Test-Driven Development (TDD) - NON-NEGOTIABLE:**
- Every line of production code must be written in response to a failing test
- Follow Red-Green-Refactor cycle strictly:
  1. **Red**: Write failing test for desired behavior
  2. **Green**: Write minimum code to make test pass
  3. **Refactor**: Assess and improve code structure (only if it adds value)
- **No production code without a failing test first**

**Behavior-Driven Testing:**
- Test behavior through public APIs, not implementation details
- No 1:1 mapping between test files and implementation files
- Tests document expected business behavior
- Treat implementation as black box
- 100% coverage expected through behavior testing

**Backend Testing (Japa):**
- `tests/unit/**/*.spec.ts` - Unit tests (2s timeout)
- `tests/functional/**/*.spec.ts` - API integration tests (30s timeout)
- HTTP server auto-started for functional tests
- Use factory functions with optional overrides for test data

**Frontend Testing:**
- React Testing Library for components (test user-visible behavior)
- Vitest for unit tests
- MSW for API mocking

**Test Data Pattern:**
```typescript
const getMockEntity = (overrides?: Partial<Entity>): Entity => {
  return { ...defaults, ...overrides };
};
```

### Git Workflow

**Conventional Commits:**
```
feat: add payment validation
fix: correct date formatting in payment processor
refactor: extract payment validation logic
test: add edge cases for payment validation
```

**Commit Requirements:**
- Each commit represents complete, working change
- All tests must pass
- All linting and type checking must pass
- Include test changes with feature changes in same commit
- Commit working code before refactoring
- Commit refactoring separately from feature changes

**Pull Request Standards:**
- All tests passing
- All quality checks passing (lint, typecheck)
- Work in small increments maintaining working state
- Focused on single feature or fix
- Description of behavior change, not implementation details

**Branch Strategy:**
- Main branch: `main`
- Feature branches: `feat/description`
- Bug fix branches: `fix/description`

## Domain Context

**Core Business Domain: Freelance Project Management**

The application serves freelancers, agencies, and their clients in managing billable work. Key domain concepts:

**Entities:**
- **User** - Authenticated accounts (freelancers, team members)
- **Tenant** - Organizations/workspaces (multi-tenant isolation)
- **Customer** - Clients who are billed for work
- **Project** - Client engagements with budgets and deadlines
- **Position** - Job roles/positions for team members
- **ProjectMember** - Team members assigned to projects (with hourly rates)
- **Task** - Discrete work items within projects
- **TimeEntry** - Individual time tracking records
- **Timesheet** - Grouped time entries for approval workflow
- **Invoice/InvoiceItem/InvoiceProject** - Billing documents
- **Payment/PayrollBatch** - Payment processing
- **Notification/NotificationPreference** - In-app messaging
- **Invitation** - Team invitation workflow

**Business Rules:**
- Time entries are billable based on project member hourly rates
- Projects can have per-member rate overrides
- Invoices aggregate time entries from multiple projects
- Multi-tenant data isolation is strict (no cross-tenant data access)
- All monetary values in cents/smallest currency unit

**Key Workflows:**
1. Time tracking → Timesheet approval → Invoice generation → Payment
2. Team invitation → User onboarding → Project assignment
3. Project setup → Task creation → Time tracking → Billing

## Important Constraints

**Mandatory Practices:**
- **TDD is non-negotiable** - No code without failing test first
- **100% test coverage** through behavior-driven tests
- **TypeScript strict mode** - No escape hatches
- **Immutable data only** - No mutations anywhere
- **No `any` types** - Ever

**Technical Constraints:**
- Backend requires ESM imports with `.js` extensions
- Electric SQL requires Docker and port 3000 availability
- PostgreSQL v14+ required
- Node.js v20+ required
- Ant Design v5 requires React 19 compatibility patch

**Code Quality Gates:**
- All tests must pass (no skipped tests in main)
- ESLint must pass with zero warnings
- TypeScript compiler must pass with zero errors
- No commented-out code in main branch

**Refactoring Rules:**
- Always commit before refactoring
- Refactor only when it adds clear value
- Never break public APIs during refactoring
- All tests must pass unchanged after refactoring
- Commit refactoring separately from features

## External Dependencies

**Critical Services:**
- **PostgreSQL Database**
  - Host: 127.0.0.1:5432
  - Database: `freelancerhub`
  - Used by both backend and Electric SQL
  - Migrations managed via AdonisJS

- **Electric SQL Sync Server**
  - Runs in Docker on port 3000
  - Connects to PostgreSQL at `host.docker.internal:5432`
  - Endpoint: `http://localhost:3000/v1/shape`
  - Start via: `./start-electric.sh`

**Backend Environment Variables:**
```env
DB_HOST=127.0.0.1
DB_PORT=5432
DB_USER=admin
DB_PASSWORD=admin
DB_DATABASE=freelancerhub
PORT=3333
HOST=0.0.0.0
NODE_ENV=development
APP_KEY=[generated]
```

**Frontend Environment Variables:**
```env
VITE_API_BASE_URL=http://localhost:3333
ELECTRIC_URL=http://localhost:3000/v1/shape
```

**Development Ports:**
- Backend API: 3333
- Frontend Dev Server: 5173 (Vite default)
- Electric SQL: 3000
- PostgreSQL: 5432
