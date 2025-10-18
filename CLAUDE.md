<!-- OPENSPEC:START -->

# OpenSpec Instructions

These instructions are for AI assistants working in this project.

Always open `@/openspec/AGENTS.md` when the request:

- Mentions planning or proposals (words like proposal, spec, change, plan)
- Introduces new capabilities, breaking changes, architecture shifts, or big performance/security work
- Sounds ambiguous and you need the authoritative spec before coding

Use `@/openspec/AGENTS.md` to learn:

- How to create and apply change proposals
- Spec format and conventions
- Project structure and guidelines

Keep this managed block so 'openspec update' can refresh the instructions.

<!-- OPENSPEC:END -->

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

# Freelancer Hub Project

## Project Overview

Freelancer Hub is a full-stack time tracking and project management application built as a monorepo with:

- **Backend**: AdonisJS v6 REST API with PostgreSQL
- **Frontend**: React 19 SPA with Refine v5 + Ant Design v5
- **Real-time Sync**: Electric SQL for local-first data synchronization

## Architecture

### Monorepo Structure

```
freelancer-hub-project/
├── freelancer-hub-backend/     # AdonisJS backend API
│   ├── app/
│   │   ├── controllers/        # HTTP request handlers
│   │   ├── models/            # Lucid ORM models
│   │   ├── validators/        # VineJS request validators
│   │   ├── services/          # Business logic layer
│   │   └── middleware/        # HTTP middleware
│   ├── database/
│   │   ├── migrations/        # Database migrations
│   │   └── seeders/           # Database seeders
│   ├── tests/
│   │   ├── unit/             # Unit tests
│   │   └── functional/       # API integration tests
│   ├── config/               # Application configuration
│   └── start/                # Bootstrap files (routes, kernel, env)
│
├── freelancer-hub-dashboard/   # React frontend
│   └── src/
│       ├── pages/            # Page components (organized by feature)
│       ├── components/       # Reusable UI components
│       ├── stores/           # Zustand state management
│       ├── services/         # API client & services
│       ├── hooks/            # Custom React hooks
│       ├── providers/        # Data providers for Refine
│       ├── contexts/         # React contexts (tenant, color-mode)
│       └── utils/            # Utility functions
│
└── start-electric.sh          # Docker script to run Electric SQL
```

### Multi-Tenancy Architecture

The application uses a **slug-based tenant system** where:

- Each tenant has a unique slug (e.g., `/tenants/acme-corp`)
- Users belong to tenants via the `Tenant` model
- All routes are scoped under `/tenants/:slug`
- The `TenantProvider` context manages current tenant state
- Backend API uses tenant-aware controllers to filter data by tenant

**Key tenant files:**

- Frontend: `src/contexts/tenant/index.tsx`
- Frontend: `src/components/TenantAwareNavigate.tsx`
- Frontend: `src/components/RefineWithTenant.tsx`

### Database & Data Sync

**Primary Database**: PostgreSQL with Lucid ORM (AdonisJS)

- Migrations in `freelancer-hub-backend/database/migrations/`
- Models in `freelancer-hub-backend/app/models/`

**Real-time Sync**: Electric SQL for local-first architecture

- Frontend maintains local state synced with backend
- Electric SQL runs as Docker container (port 3000)
- Start with: `./start-electric.sh`
- Database URL: `postgresql://admin:admin@host.docker.internal:5432/freelancerhub`

### Key Domain Models

**Core entities:**

- `User` - Authentication & user accounts
- `Tenant` - Multi-tenant organizations
- `Project` - Client projects
- `ProjectMember` - Team members assigned to projects (with hourly rates)
- `Position` - Job roles/positions for team members
- `Task` - Project tasks
- `TimeEntry` - Time tracking records
- `Timesheet` - Grouped time entries for approval
- `Customer` - Client information
- `Invoice` / `InvoiceItem` / `InvoiceProject` - Invoicing
- `Payment` / `PayrollBatch` - Payment processing
- `Notification` / `NotificationPreference` - In-app notifications
- `Invitation` - Team invitations

## Common Development Tasks

### Backend (AdonisJS)

**Running the backend:**

```bash
cd freelancer-hub-backend
npm run dev              # Start dev server with HMR
npm run build            # Build for production
npm start                # Start production server
```

**Testing:**

```bash
npm test                 # Run all tests (unit + functional)
npm run test -- --files tests/unit/**/*.spec.ts    # Run unit tests only
npm run test -- --files tests/functional/**/*.spec.ts  # Run functional tests
```

**Database:**

```bash
npm run migration:run         # Run pending migrations
npm run migration:fresh       # Drop all tables and re-run migrations + seeds
npm run migration:refresh     # Rollback all and re-run + seeds
npm run migration:rollback    # Rollback last batch
node ace make:migration create_table_name  # Create new migration
```

**Code quality:**

```bash
npm run lint             # Run ESLint
npm run format           # Run Prettier
npm run typecheck        # Run TypeScript compiler check
```

**Path aliases (in imports):**

- `#controllers/*` → `./app/controllers/*.js`
- `#models/*` → `./app/models/*.js`
- `#services/*` → `./app/services/*.js`
- `#validators/*` → `./app/validators/*.js`
- `#middleware/*` → `./app/middleware/*.js`
- `#config/*` → `./config/*.js`
- `#start/*` → `./start/*.js`
- `#tests/*` → `./tests/*.js`

### Frontend (React + Refine)

**Running the frontend:**

```bash
cd freelancer-hub-dashboard
npm run dev              # Start Vite dev server
npm run build            # Build for production (runs typecheck first)
npm start                # Serve production build
```

**Code structure:**

- Pages use **Refine hooks** (`useList`, `useShow`, `useCreate`, `useUpdate`, `useDelete`)
- UI components from **Ant Design v5**
- State management via **Zustand** (stores in `src/stores/`)
- Routing via **React Router v7** with tenant-aware navigation

**Key patterns:**

- All pages are tenant-scoped under `/tenants/:slug`
- Use `useTenant()` hook to access current tenant context
- Data providers are tenant-aware (automatic tenant filtering)
- Auth via JWT tokens with `authProvider.ts`

### Electric SQL Setup

**Start Electric SQL sync server:**

```bash
./start-electric.sh
```

This runs Electric in Docker on port 3000, connected to PostgreSQL.

**Environment variables needed:**

```env
# Backend (.env)
DB_HOST=127.0.0.1
DB_PORT=5432
DB_USER=admin
DB_PASSWORD=admin
DB_DATABASE=freelancerhub

# Frontend (.env)
VITE_API_BASE_URL=http://localhost:3333
ELECTRIC_URL=http://localhost:3000/v1/shape
```

## Testing Strategy

### Backend Testing with Japa

**Test organization:**

- `tests/unit/**/*.spec.ts` - Unit tests (2s timeout)
- `tests/functional/**/*.spec.ts` - API integration tests (30s timeout)

**Test setup:**

- Uses `@japa/runner` with plugins: `assert`, `apiClient`, `pluginAdonisJS`
- Bootstrap file: `tests/bootstrap.ts`
- HTTP server auto-started for functional tests

**Run a single test file:**

```bash
npm test -- --files tests/functional/projects.spec.ts
```

### Frontend Testing

Currently minimal - future instances should add:

- React Testing Library for components
- Vitest for unit tests
- MSW for API mocking

## Important Patterns & Conventions

### Validation (Backend)

Use **VineJS** for request validation:

```typescript
// app/validators/project_validator.ts
import vine from "@vinejs/vine";

export const createProjectValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(3),
    customer_id: vine.number().positive(),
  })
);
```

### Error Handling (Backend)

Use custom exceptions from `app/exceptions/`:

```typescript
throw new NotFoundException("Project not found");
```

### Authorization (Backend)

- Session-based auth with `@adonisjs/auth`
- Auth middleware in `app/middleware/auth.ts`
- Tenant scoping enforced in controllers

### State Management (Frontend)

**Zustand stores** for app-level state:

- `filterStore.ts` - Filter preferences across views
- `viewStore.ts` - View mode preferences (list/kanban/calendar)
- `favoriteStore.ts` - Favorited items
- `uiStore.ts` - UI state (sidebar, modals)

### Refine Integration (Frontend)

All CRUD operations use Refine's data hooks:

```typescript
import { useList, useCreate, useUpdate } from "@refinedev/core";

// In component
const { data, isLoading } = useList({ resource: "projects" });
const { mutate: createProject } = useCreate();
```

## Known Gotchas

### Backend

1. **Import extensions required**: AdonisJS uses ESM, so imports must include `.js` extension:

   ```typescript
   import User from "#models/user.js"; // Note the .js
   ```

2. **Path aliases**: Use `#` prefixed aliases instead of relative imports:

   ```typescript
   import ProjectService from "#services/project_service.js";
   ```

3. **Migrations**: Natural sort is enabled - name migrations with timestamps carefully

### Frontend

1. **Tenant context**: Always use `useTenant()` within tenant-scoped routes, will be undefined on auth pages

2. **Ant Design v5 + React 19**: Uses compatibility patch `@ant-design/v5-patch-for-react-19`

3. **Refine resources**: Resources must match backend API endpoints exactly

4. **TypeScript strict mode**: Frontend has `strict: true` but `noUnusedLocals: false` (different from backend)

### Electric SQL

1. **Docker requirement**: Electric SQL must be running for real-time sync features
2. **Port conflicts**: Ensure port 3000 is available for Electric
3. **Database credentials**: Must match between backend config and Electric env vars

## Environment Setup

### Required Tools

- Node.js (v20+)
- PostgreSQL (v14+)
- Docker (for Electric SQL)

### Initial Setup

1. **Backend:**

   ```bash
   cd freelancer-hub-backend
   npm install
   cp .env.example .env
   # Update .env with your database credentials
   npm run migration:fresh  # Sets up database
   npm run dev
   ```

2. **Frontend:**

   ```bash
   cd freelancer-hub-dashboard
   npm install
   cp .env.example .env
   # Update VITE_API_BASE_URL if needed
   npm run dev
   ```

3. **Electric SQL:**
   ```bash
   ./start-electric.sh
   ```

---

# Development Guidelines for Claude

## Core Philosophy

**TEST-DRIVEN DEVELOPMENT IS NON-NEGOTIABLE.** Every single line of production code must be written in response to a failing test. No exceptions. This is not a suggestion or a preference - it is the fundamental practice that enables all other principles in this document.

I follow Test-Driven Development (TDD) with a strong emphasis on behavior-driven testing and functional programming principles. All work should be done in small, incremental changes that maintain a working state throughout development.

## Quick Reference

**Key Principles:**

- Write tests first (TDD)
- Test behavior, not implementation
- No `any` types or type assertions
- Immutable data only
- Small, pure functions
- TypeScript strict mode always
- Use real schemas/types in tests, never redefine them
- Always use context7 when I need code generation, setup or configuration steps, or
  library/API documentation. This means you should automatically use the Context7 MCP
  tools to resolve library id and get library docs without me having to explicitly ask.

**Preferred Tools:**

- **Language**: TypeScript (strict mode)
- **Testing**: Jest/Vitest + React Testing Library
- **Backend**: AdonisJS v6
- **Frontend**: React v19
- **UI**: Refine v5 + Ant Design v5

## Testing Principles

### Behavior-Driven Testing

- **No "unit tests"** - this term is not helpful. Tests should verify expected behavior, treating implementation as a black box
- Test through the public API exclusively - internals should be invisible to tests
- No 1:1 mapping between test files and implementation files
- Tests that examine internal implementation details are wasteful and should be avoided
- **Coverage targets**: 100% coverage should be expected at all times, but these tests must ALWAYS be based on business behaviour, not implementation details
- Tests must document expected business behaviour

### Testing Tools

- **Jest** or **Vitest** for testing frameworks
- **React Testing Library** for React components
- **MSW (Mock Service Worker)** for API mocking when needed
- All test code must follow the same TypeScript strict mode rules as production code

### Test Organization

```
src/
  features/
    payment/
      payment-processor.ts
      payment-validator.ts
      payment-processor.test.ts // The validator is an implementation detail. Validation is fully covered, but by testing the expected business behaviour, treating the validation code itself as an implementation detail
```

### Test Data Pattern

Use factory functions with optional overrides for test data:

```typescript
const getMockPaymentPostPaymentRequest = (
  overrides?: Partial<PostPaymentsRequestV3>
): PostPaymentsRequestV3 => {
  return {
    CardAccountId: "1234567890123456",
    Amount: 100,
    Source: "Web",
    AccountStatus: "Normal",
    LastName: "Doe",
    DateOfBirth: "1980-01-01",
    PayingCardDetails: {
      Cvv: "123",
      Token: "token",
    },
    AddressDetails: getMockAddressDetails(),
    Brand: "Visa",
    ...overrides,
  };
};

const getMockAddressDetails = (
  overrides?: Partial<AddressDetails>
): AddressDetails => {
  return {
    HouseNumber: "123",
    HouseName: "Test House",
    AddressLine1: "Test Address Line 1",
    AddressLine2: "Test Address Line 2",
    City: "Test City",
    ...overrides,
  };
};
```

Key principles:

- Always return complete objects with sensible defaults
- Accept optional `Partial<T>` overrides
- Build incrementally - extract nested object factories as needed
- Compose factories for complex objects
- Consider using a test data builder pattern for very complex objects

### Type Definitions

- **Prefer `type` over `interface`** in all cases
- Use explicit typing where it aids clarity, but leverage inference where appropriate
- Utilize utility types effectively (`Pick`, `Omit`, `Partial`, `Required`, etc.)
- Create domain-specific types (e.g., `UserId`, `PaymentId`) for type safety
- Use Zod or any other [Standard Schema](https://standardschema.dev/) compliant schema library to create types, by creating schemas first

```typescript
// Good
type UserId = string & { readonly brand: unique symbol };
type PaymentAmount = number & { readonly brand: unique symbol };

// Avoid
type UserId = string;
type PaymentAmount = number;
```

### Code Structure

- **No nested if/else statements** - use early returns, guard clauses, or composition
- **Avoid deep nesting** in general (max 2 levels)
- Keep functions small and focused on a single responsibility
- Prefer flat, readable code over clever abstractions

### Naming Conventions

- **Functions**: `camelCase`, verb-based (e.g., `calculateTotal`, `validatePayment`)
- **Types**: `PascalCase` (e.g., `PaymentRequest`, `UserProfile`)
- **Constants**: `UPPER_SNAKE_CASE` for true constants, `camelCase` for configuration
- **Files**: `kebab-case.ts` for all TypeScript files
- **Test files**: `*.test.ts` or `*.spec.ts`

### No Comments in Code

Code should be self-documenting through clear naming and structure. Comments indicate that the code itself is not clear enough.

```typescript
// Avoid: Comments explaining what the code does
const calculateDiscount = (price: number, customer: Customer): number => {
  // Check if customer is premium
  if (customer.tier === "premium") {
    // Apply 20% discount for premium customers
    return price * 0.8;
  }
  // Regular customers get 10% discount
  return price * 0.9;
};

// Good: Self-documenting code with clear names
const PREMIUM_DISCOUNT_MULTIPLIER = 0.8;
const STANDARD_DISCOUNT_MULTIPLIER = 0.9;

const isPremiumCustomer = (customer: Customer): boolean => {
  return customer.tier === "premium";
};

const calculateDiscount = (price: number, customer: Customer): number => {
  const discountMultiplier = isPremiumCustomer(customer)
    ? PREMIUM_DISCOUNT_MULTIPLIER
    : STANDARD_DISCOUNT_MULTIPLIER;

  return price * discountMultiplier;
};

// Avoid: Complex logic with comments
const processPayment = (payment: Payment): ProcessedPayment => {
  // First validate the payment
  if (!validatePayment(payment)) {
    throw new Error("Invalid payment");
  }

  // Check if we need to apply 3D secure
  if (payment.amount > 100 && payment.card.type === "credit") {
    // Apply 3D secure for credit cards over £100
    const securePayment = apply3DSecure(payment);
    // Process the secure payment
    return executePayment(securePayment);
  }

  // Process the payment
  return executePayment(payment);
};

// Good: Extract to well-named functions
const requires3DSecure = (payment: Payment): boolean => {
  const SECURE_PAYMENT_THRESHOLD = 100;
  return (
    payment.amount > SECURE_PAYMENT_THRESHOLD && payment.card.type === "credit"
  );
};

const processPayment = (payment: Payment): ProcessedPayment => {
  if (!validatePayment(payment)) {
    throw new PaymentValidationError("Invalid payment");
  }

  const securedPayment = requires3DSecure(payment)
    ? apply3DSecure(payment)
    : payment;

  return executePayment(securedPayment);
};
```

**Exception**: JSDoc comments for public APIs are acceptable when generating documentation, but the code should still be self-explanatory without them.

### Prefer Options Objects

Use options objects for function parameters as the default pattern. Only use positional parameters when there's a clear, compelling reason (e.g., single-parameter pure functions, well-established conventions like `map(item => item.value)`).

```typescript
// Avoid: Multiple positional parameters
const createPayment = (
  amount: number,
  currency: string,
  cardId: string,
  customerId: string,
  description?: string,
  metadata?: Record<string, unknown>,
  idempotencyKey?: string
): Payment => {
  // implementation
};

// Calling it is unclear
const payment = createPayment(
  100,
  "GBP",
  "card_123",
  "cust_456",
  undefined,
  { orderId: "order_789" },
  "key_123"
);

// Good: Options object with clear property names
type CreatePaymentOptions = {
  amount: number;
  currency: string;
  cardId: string;
  customerId: string;
  description?: string;
  metadata?: Record<string, unknown>;
  idempotencyKey?: string;
};

const createPayment = (options: CreatePaymentOptions): Payment => {
  const {
    amount,
    currency,
    cardId,
    customerId,
    description,
    metadata,
    idempotencyKey,
  } = options;

  // implementation
};

// Clear and readable at call site
const payment = createPayment({
  amount: 100,
  currency: "GBP",
  cardId: "card_123",
  customerId: "cust_456",
  metadata: { orderId: "order_789" },
  idempotencyKey: "key_123",
});

// Avoid: Boolean flags as parameters
const fetchCustomers = (
  includeInactive: boolean,
  includePending: boolean,
  includeDeleted: boolean,
  sortByDate: boolean
): Customer[] => {
  // implementation
};

// Confusing at call site
const customers = fetchCustomers(true, false, false, true);

// Good: Options object with clear intent
type FetchCustomersOptions = {
  includeInactive?: boolean;
  includePending?: boolean;
  includeDeleted?: boolean;
  sortBy?: "date" | "name" | "value";
};

const fetchCustomers = (options: FetchCustomersOptions = {}): Customer[] => {
  const {
    includeInactive = false,
    includePending = false,
    includeDeleted = false,
    sortBy = "name",
  } = options;

  // implementation
};

// Self-documenting at call site
const customers = fetchCustomers({
  includeInactive: true,
  sortBy: "date",
});

// Good: Configuration objects for complex operations
type ProcessOrderOptions = {
  order: Order;
  shipping: {
    method: "standard" | "express" | "overnight";
    address: Address;
  };
  payment: {
    method: PaymentMethod;
    saveForFuture?: boolean;
  };
  promotions?: {
    codes?: string[];
    autoApply?: boolean;
  };
};

const processOrder = (options: ProcessOrderOptions): ProcessedOrder => {
  const { order, shipping, payment, promotions = {} } = options;

  // Clear access to nested options
  const orderWithPromotions = promotions.autoApply
    ? applyAvailablePromotions(order)
    : order;

  return executeOrder({
    ...orderWithPromotions,
    shippingMethod: shipping.method,
    paymentMethod: payment.method,
  });
};

// Acceptable: Single parameter for simple transforms
const double = (n: number): number => n * 2;
const getName = (user: User): string => user.name;

// Acceptable: Well-established patterns
const numbers = [1, 2, 3];
const doubled = numbers.map((n) => n * 2);
const users = fetchUsers();
const names = users.map((user) => user.name);
```

**Guidelines for options objects:**

- Default to options objects unless there's a specific reason not to
- Always use for functions with optional parameters
- Destructure options at the start of the function for clarity
- Provide sensible defaults using destructuring
- Keep related options grouped (e.g., all shipping options together)
- Consider breaking very large options objects into nested groups

**When positional parameters are acceptable:**

- Single-parameter pure functions
- Well-established functional patterns (map, filter, reduce callbacks)
- Mathematical operations where order is conventional

## Development Workflow

### TDD Process - THE FUNDAMENTAL PRACTICE

**CRITICAL**: TDD is not optional. Every feature, every bug fix, every change MUST follow this process:

Follow Red-Green-Refactor strictly:

1. **Red**: Write a failing test for the desired behavior. NO PRODUCTION CODE until you have a failing test.
2. **Green**: Write the MINIMUM code to make the test pass. Resist the urge to write more than needed.
3. **Refactor**: Assess the code for improvement opportunities. If refactoring would add value, clean up the code while keeping tests green. If the code is already clean and expressive, move on.

**Common TDD Violations to Avoid:**

- Writing production code without a failing test first
- Writing multiple tests before making the first one pass
- Writing more production code than needed to pass the current test
- Skipping the refactor assessment step when code could be improved
- Adding functionality "while you're there" without a test driving it

**Remember**: If you're typing production code and there isn't a failing test demanding that code, you're not doing TDD.

#### TDD Example Workflow

```typescript
// Step 1: Red - Start with the simplest behavior
describe("Order processing", () => {
  it("should calculate total with shipping cost", () => {
    const order = createOrder({
      items: [{ price: 30, quantity: 1 }],
      shippingCost: 5.99,
    });

    const processed = processOrder(order);

    expect(processed.total).toBe(35.99);
    expect(processed.shippingCost).toBe(5.99);
  });
});

// Step 2: Green - Minimal implementation
const processOrder = (order: Order): ProcessedOrder => {
  const itemsTotal = order.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return {
    ...order,
    shippingCost: order.shippingCost,
    total: itemsTotal + order.shippingCost,
  };
};

// Step 3: Red - Add test for free shipping behavior
describe("Order processing", () => {
  it("should calculate total with shipping cost", () => {
    // ... existing test
  });

  it("should apply free shipping for orders over £50", () => {
    const order = createOrder({
      items: [{ price: 60, quantity: 1 }],
      shippingCost: 5.99,
    });

    const processed = processOrder(order);

    expect(processed.shippingCost).toBe(0);
    expect(processed.total).toBe(60);
  });
});

// Step 4: Green - NOW we can add the conditional because both paths are tested
const processOrder = (order: Order): ProcessedOrder => {
  const itemsTotal = order.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const shippingCost = itemsTotal > 50 ? 0 : order.shippingCost;

  return {
    ...order,
    shippingCost,
    total: itemsTotal + shippingCost,
  };
};

// Step 5: Add edge case tests to ensure 100% behavior coverage
describe("Order processing", () => {
  // ... existing tests

  it("should charge shipping for orders exactly at £50", () => {
    const order = createOrder({
      items: [{ price: 50, quantity: 1 }],
      shippingCost: 5.99,
    });

    const processed = processOrder(order);

    expect(processed.shippingCost).toBe(5.99);
    expect(processed.total).toBe(55.99);
  });
});

// Step 6: Refactor - Extract constants and improve readability
const FREE_SHIPPING_THRESHOLD = 50;

const calculateItemsTotal = (items: OrderItem[]): number => {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
};

const qualifiesForFreeShipping = (itemsTotal: number): boolean => {
  return itemsTotal > FREE_SHIPPING_THRESHOLD;
};

const processOrder = (order: Order): ProcessedOrder => {
  const itemsTotal = calculateItemsTotal(order.items);
  const shippingCost = qualifiesForFreeShipping(itemsTotal)
    ? 0
    : order.shippingCost;

  return {
    ...order,
    shippingCost,
    total: itemsTotal + shippingCost,
  };
};
```

### Refactoring - The Critical Third Step

Evaluating refactoring opportunities is not optional - it's the third step in the TDD cycle. After achieving a green state and committing your work, you MUST assess whether the code can be improved. However, only refactor if there's clear value - if the code is already clean and expresses intent well, move on to the next test.

#### What is Refactoring?

Refactoring means changing the internal structure of code without changing its external behavior. The public API remains unchanged, all tests continue to pass, but the code becomes cleaner, more maintainable, or more efficient. Remember: only refactor when it genuinely improves the code - not all code needs refactoring.

#### When to Refactor

- **Always assess after green**: Once tests pass, before moving to the next test, evaluate if refactoring would add value
- **When you see duplication**: But understand what duplication really means (see DRY below)
- **When names could be clearer**: Variable names, function names, or type names that don't clearly express intent
- **When structure could be simpler**: Complex conditional logic, deeply nested code, or long functions
- **When patterns emerge**: After implementing several similar features, useful abstractions may become apparent

**Remember**: Not all code needs refactoring. If the code is already clean, expressive, and well-structured, commit and move on. Refactoring should improve the code - don't change things just for the sake of change.

#### Refactoring Guidelines

##### 1. Commit Before Refactoring

Always commit your working code before starting any refactoring. This gives you a safe point to return to:

```bash
git add .
git commit -m "feat: add payment validation"
# Now safe to refactor
```

##### 2. Look for Useful Abstractions Based on Semantic Meaning

Create abstractions only when code shares the same semantic meaning and purpose. Don't abstract based on structural similarity alone - **duplicate code is far cheaper than the wrong abstraction**.

```typescript
// Similar structure, DIFFERENT semantic meaning - DO NOT ABSTRACT
const validatePaymentAmount = (amount: number): boolean => {
  return amount > 0 && amount <= 10000;
};

const validateTransferAmount = (amount: number): boolean => {
  return amount > 0 && amount <= 10000;
};

// These might have the same structure today, but they represent different
// business concepts that will likely evolve independently.
// Payment limits might change based on fraud rules.
// Transfer limits might change based on account type.
// Abstracting them couples unrelated business rules.

// Similar structure, SAME semantic meaning - SAFE TO ABSTRACT
const formatUserDisplayName = (firstName: string, lastName: string): string => {
  return `${firstName} ${lastName}`.trim();
};

const formatCustomerDisplayName = (
  firstName: string,
  lastName: string
): string => {
  return `${firstName} ${lastName}`.trim();
};

const formatEmployeeDisplayName = (
  firstName: string,
  lastName: string
): string => {
  return `${firstName} ${lastName}`.trim();
};

// These all represent the same concept: "how we format a person's name for display"
// They share semantic meaning, not just structure
const formatPersonDisplayName = (
  firstName: string,
  lastName: string
): string => {
  return `${firstName} ${lastName}`.trim();
};

// Replace all call sites throughout the codebase:
// Before:
// const userLabel = formatUserDisplayName(user.firstName, user.lastName);
// const customerName = formatCustomerDisplayName(customer.firstName, customer.lastName);
// const employeeTag = formatEmployeeDisplayName(employee.firstName, employee.lastName);

// After:
// const userLabel = formatPersonDisplayName(user.firstName, user.lastName);
// const customerName = formatPersonDisplayName(customer.firstName, customer.lastName);
// const employeeTag = formatPersonDisplayName(employee.firstName, employee.lastName);

// Then remove the original functions as they're no longer needed
```

**Questions to ask before abstracting:**

- Do these code blocks represent the same concept or different concepts that happen to look similar?
- If the business rules for one change, should the others change too?
- Would a developer reading this abstraction understand why these things are grouped together?
- Am I abstracting based on what the code IS (structure) or what it MEANS (semantics)?

**Remember**: It's much easier to create an abstraction later when the semantic relationship becomes clear than to undo a bad abstraction that couples unrelated concepts.

##### 3. Understanding DRY - It's About Knowledge, Not Code

DRY (Don't Repeat Yourself) is about not duplicating **knowledge** in the system, not about eliminating all code that looks similar.

```typescript
// This is NOT a DRY violation - different knowledge despite similar code
const validateUserAge = (age: number): boolean => {
  return age >= 18 && age <= 100;
};

const validateProductRating = (rating: number): boolean => {
  return rating >= 1 && rating <= 5;
};

const validateYearsOfExperience = (years: number): boolean => {
  return years >= 0 && years <= 50;
};

// These functions have similar structure (checking numeric ranges), but they
// represent completely different business rules:
// - User age has legal requirements (18+) and practical limits (100)
// - Product ratings follow a 1-5 star system
// - Years of experience starts at 0 with a reasonable upper bound
// Abstracting them would couple unrelated business concepts and make future
// changes harder. What if ratings change to 1-10? What if legal age changes?

// Another example of code that looks similar but represents different knowledge:
const formatUserDisplayName = (user: User): string => {
  return `${user.firstName} ${user.lastName}`.trim();
};

const formatAddressLine = (address: Address): string => {
  return `${address.street} ${address.number}`.trim();
};

const formatCreditCardLabel = (card: CreditCard): string => {
  return `${card.type} ${card.lastFourDigits}`.trim();
};

// Despite the pattern "combine two strings with space and trim", these represent
// different domain concepts with different future evolution paths

// This IS a DRY violation - same knowledge in multiple places
class Order {
  calculateTotal(): number {
    const itemsTotal = this.items.reduce((sum, item) => sum + item.price, 0);
    const shippingCost = itemsTotal > 50 ? 0 : 5.99; // Knowledge duplicated!
    return itemsTotal + shippingCost;
  }
}

class OrderSummary {
  getShippingCost(itemsTotal: number): number {
    return itemsTotal > 50 ? 0 : 5.99; // Same knowledge!
  }
}

class ShippingCalculator {
  calculate(orderAmount: number): number {
    if (orderAmount > 50) return 0; // Same knowledge again!
    return 5.99;
  }
}

// Refactored - knowledge in one place
const FREE_SHIPPING_THRESHOLD = 50;
const STANDARD_SHIPPING_COST = 5.99;

const calculateShippingCost = (itemsTotal: number): number => {
  return itemsTotal > FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING_COST;
};

// Now all classes use the single source of truth
class Order {
  calculateTotal(): number {
    const itemsTotal = this.items.reduce((sum, item) => sum + item.price, 0);
    return itemsTotal + calculateShippingCost(itemsTotal);
  }
}
```

##### 4. Maintain External APIs During Refactoring

Refactoring must never break existing consumers of your code:

```typescript
// Original implementation
export const processPayment = (payment: Payment): ProcessedPayment => {
  // Complex logic all in one function
  if (payment.amount <= 0) {
    throw new Error("Invalid amount");
  }

  if (payment.amount > 10000) {
    throw new Error("Amount too large");
  }

  // ... 50 more lines of validation and processing

  return result;
};

// Refactored - external API unchanged, internals improved
export const processPayment = (payment: Payment): ProcessedPayment => {
  validatePaymentAmount(payment.amount);
  validatePaymentMethod(payment.method);

  const authorizedPayment = authorizePayment(payment);
  const capturedPayment = capturePayment(authorizedPayment);

  return generateReceipt(capturedPayment);
};

// New internal functions - not exported
const validatePaymentAmount = (amount: number): void => {
  if (amount <= 0) {
    throw new Error("Invalid amount");
  }

  if (amount > 10000) {
    throw new Error("Amount too large");
  }
};

// Tests continue to pass without modification because external API unchanged
```

##### 5. Verify and Commit After Refactoring

**CRITICAL**: After every refactoring:

1. Run all tests - they must pass without modification
2. Run static analysis (linting, type checking) - must pass
3. Commit the refactoring separately from feature changes

```bash
# After refactoring
npm test          # All tests must pass
npm run lint      # All linting must pass
npm run typecheck # TypeScript must be happy

# Only then commit
git add .
git commit -m "refactor: extract payment validation helpers"
```

#### Refactoring Checklist

Before considering refactoring complete, verify:

- [ ] The refactoring actually improves the code (if not, don't refactor)
- [ ] All tests still pass without modification
- [ ] All static analysis tools pass (linting, type checking)
- [ ] No new public APIs were added (only internal ones)
- [ ] Code is more readable than before
- [ ] Any duplication removed was duplication of knowledge, not just code
- [ ] No speculative abstractions were created
- [ ] The refactoring is committed separately from feature changes

#### Example Refactoring Session

```typescript
// After getting tests green with minimal implementation:
describe("Order processing", () => {
  it("calculates total with items and shipping", () => {
    const order = { items: [{ price: 30 }, { price: 20 }], shipping: 5 };
    expect(calculateOrderTotal(order)).toBe(55);
  });

  it("applies free shipping over £50", () => {
    const order = { items: [{ price: 30 }, { price: 25 }], shipping: 5 };
    expect(calculateOrderTotal(order)).toBe(55);
  });
});

// Green implementation (minimal):
const calculateOrderTotal = (order: Order): number => {
  const itemsTotal = order.items.reduce((sum, item) => sum + item.price, 0);
  const shipping = itemsTotal > 50 ? 0 : order.shipping;
  return itemsTotal + shipping;
};

// Commit the working version
// git commit -m "feat: implement order total calculation with free shipping"

// Assess refactoring opportunities:
// - The variable names could be clearer
// - The free shipping threshold is a magic number
// - The calculation logic could be extracted for clarity
// These improvements would add value, so proceed with refactoring:

const FREE_SHIPPING_THRESHOLD = 50;

const calculateItemsTotal = (items: OrderItem[]): number => {
  return items.reduce((sum, item) => sum + item.price, 0);
};

const calculateShipping = (
  baseShipping: number,
  itemsTotal: number
): number => {
  return itemsTotal > FREE_SHIPPING_THRESHOLD ? 0 : baseShipping;
};

const calculateOrderTotal = (order: Order): number => {
  const itemsTotal = calculateItemsTotal(order.items);
  const shipping = calculateShipping(order.shipping, itemsTotal);
  return itemsTotal + shipping;
};

// Run tests - they still pass!
// Run linting - all clean!
// Run type checking - no errors!

// Now commit the refactoring
// git commit -m "refactor: extract order total calculation helpers"
```

##### Example: When NOT to Refactor

```typescript
// After getting this test green:
describe("Discount calculation", () => {
  it("should apply 10% discount", () => {
    const originalPrice = 100;
    const discountedPrice = applyDiscount(originalPrice, 0.1);
    expect(discountedPrice).toBe(90);
  });
});

// Green implementation:
const applyDiscount = (price: number, discountRate: number): number => {
  return price * (1 - discountRate);
};

// Assess refactoring opportunities:
// - Code is already simple and clear
// - Function name clearly expresses intent
// - Implementation is a straightforward calculation
// - No magic numbers or unclear logic
// Conclusion: No refactoring needed. This is fine as-is.

// Commit and move to the next test
// git commit -m "feat: add discount calculation"
```

### Commit Guidelines

- Each commit should represent a complete, working change
- Use conventional commits format:
  ```
  feat: add payment validation
  fix: correct date formatting in payment processor
  refactor: extract payment validation logic
  test: add edge cases for payment validation
  ```
- Include test changes with feature changes in the same commit

### Pull Request Standards

- Every PR must have all tests passing
- All linting and quality checks must pass
- Work in small increments that maintain a working state
- PRs should be focused on a single feature or fix
- Include description of the behavior change, not implementation details

## Working with Claude

### Expectations

When working with my code:

1. **ALWAYS FOLLOW TDD** - No production code without a failing test. This is not negotiable.
2. **Think deeply** before making any edits
3. **Understand the full context** of the code and requirements
4. **Ask clarifying questions** when requirements are ambiguous
5. **Think from first principles** - don't make assumptions
6. **Assess refactoring after every green** - Look for opportunities to improve code structure, but only refactor if it adds value
7. **Keep project docs current** - update them whenever you introduce meaningful changes
   **At the end of every change, update CLAUDE.md with anything useful you wished you'd known at the start**.
   This is CRITICAL - Claude should capture learnings, gotchas, patterns discovered, or any context that would have made the task easier if known upfront. This continuous documentation ensures future work benefits from accumulated knowledge

### Code Changes

When suggesting or making changes:

- **Start with a failing test** - always. No exceptions.
- After making tests pass, always assess refactoring opportunities (but only refactor if it adds value)
- After refactoring, verify all tests and static analysis pass, then commit
- Respect the existing patterns and conventions
- Maintain test coverage for all behavior changes
- Keep changes small and incremental
- Ensure all TypeScript strict mode requirements are met
- Provide rationale for significant design decisions

**If you find yourself writing production code without a failing test, STOP immediately and write the test first.**

### Communication

- Be explicit about trade-offs in different approaches
- Explain the reasoning behind significant design decisions
- Flag any deviations from these guidelines with justification
- Suggest improvements that align with these principles
- When unsure, ask for clarification rather than assuming

## Example Patterns

### Error Handling

Use Result types or early returns:

```typescript
// Good - Result type pattern
type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

const processPayment = (
  payment: Payment
): Result<ProcessedPayment, PaymentError> => {
  if (!isValidPayment(payment)) {
    return { success: false, error: new PaymentError("Invalid payment") };
  }

  if (!hasSufficientFunds(payment)) {
    return { success: false, error: new PaymentError("Insufficient funds") };
  }

  return { success: true, data: executePayment(payment) };
};

// Also good - early returns with exceptions
const processPayment = (payment: Payment): ProcessedPayment => {
  if (!isValidPayment(payment)) {
    throw new PaymentError("Invalid payment");
  }

  if (!hasSufficientFunds(payment)) {
    throw new PaymentError("Insufficient funds");
  }

  return executePayment(payment);
};
```

### Testing Behavior

```typescript
// Good - tests behavior through public API
describe("PaymentProcessor", () => {
  it("should decline payment when insufficient funds", () => {
    const payment = getMockPaymentPostPaymentRequest({ Amount: 1000 });
    const account = getMockAccount({ Balance: 500 });

    const result = processPayment(payment, account);

    expect(result.success).toBe(false);
    expect(result.error.message).toBe("Insufficient funds");
  });

  it("should process valid payment successfully", () => {
    const payment = getMockPaymentPostPaymentRequest({ Amount: 100 });
    const account = getMockAccount({ Balance: 500 });

    const result = processPayment(payment, account);

    expect(result.success).toBe(true);
    expect(result.data.remainingBalance).toBe(400);
  });
});

// Avoid - testing implementation details
describe("PaymentProcessor", () => {
  it("should call checkBalance method", () => {
    // This tests implementation, not behavior
  });
});
```

#### Achieving 100% Coverage Through Business Behavior

Example showing how validation code gets 100% coverage without testing it directly:

```typescript
// payment-validator.ts (implementation detail)
export const validatePaymentAmount = (amount: number): boolean => {
  return amount > 0 && amount <= 10000;
};

export const validateCardDetails = (card: PayingCardDetails): boolean => {
  return /^\d{3,4}$/.test(card.cvv) && card.token.length > 0;
};

// payment-processor.ts (public API)
export const processPayment = (
  request: PaymentRequest
): Result<Payment, PaymentError> => {
  // Validation is used internally but not exposed
  if (!validatePaymentAmount(request.amount)) {
    return { success: false, error: new PaymentError("Invalid amount") };
  }

  if (!validateCardDetails(request.payingCardDetails)) {
    return { success: false, error: new PaymentError("Invalid card details") };
  }

  // Process payment...
  return { success: true, data: executedPayment };
};

// payment-processor.test.ts
describe("Payment processing", () => {
  // These tests achieve 100% coverage of validation code
  // without directly testing the validator functions

  it("should reject payments with negative amounts", () => {
    const payment = getMockPaymentPostPaymentRequest({ amount: -100 });
    const result = processPayment(payment);

    expect(result.success).toBe(false);
    expect(result.error.message).toBe("Invalid amount");
  });

  it("should reject payments exceeding maximum amount", () => {
    const payment = getMockPaymentPostPaymentRequest({ amount: 10001 });
    const result = processPayment(payment);

    expect(result.success).toBe(false);
    expect(result.error.message).toBe("Invalid amount");
  });

  it("should reject payments with invalid CVV format", () => {
    const payment = getMockPaymentPostPaymentRequest({
      payingCardDetails: { cvv: "12", token: "valid-token" },
    });
    const result = processPayment(payment);

    expect(result.success).toBe(false);
    expect(result.error.message).toBe("Invalid card details");
  });

  it("should process valid payments successfully", () => {
    const payment = getMockPaymentPostPaymentRequest({
      amount: 100,
      payingCardDetails: { cvv: "123", token: "valid-token" },
    });
    const result = processPayment(payment);

    expect(result.success).toBe(true);
    expect(result.data.status).toBe("completed");
  });
});
```

### React Component Testing

```typescript
// Good - testing user-visible behavior
describe("PaymentForm", () => {
  it("should show error when submitting invalid amount", async () => {
    render(<PaymentForm />);

    const amountInput = screen.getByLabelText("Amount");
    const submitButton = screen.getByRole("button", { name: "Submit Payment" });

    await userEvent.type(amountInput, "-100");
    await userEvent.click(submitButton);

    expect(screen.getByText("Amount must be positive")).toBeInTheDocument();
  });
});
```

## Common Patterns to Avoid

### Anti-patterns

```typescript
// Avoid: Mutation
const addItem = (items: Item[], newItem: Item) => {
  items.push(newItem); // Mutates array
  return items;
};

// Prefer: Immutable update
const addItem = (items: Item[], newItem: Item): Item[] => {
  return [...items, newItem];
};

// Avoid: Nested conditionals
if (user) {
  if (user.isActive) {
    if (user.hasPermission) {
      // do something
    }
  }
}

// Prefer: Early returns
if (!user || !user.isActive || !user.hasPermission) {
  return;
}
// do something

// Avoid: Large functions
const processOrder = (order: Order) => {
  // 100+ lines of code
};

// Prefer: Composed small functions
const processOrder = (order: Order) => {
  const validatedOrder = validateOrder(order);
  const pricedOrder = calculatePricing(validatedOrder);
  const finalOrder = applyDiscounts(pricedOrder);
  return submitOrder(finalOrder);
};
```

## Implementation Patterns Discovered

### Invoice Generation from Time Entries

When implementing the invoice generation feature, several important patterns and gotchas were discovered:

**1. Role-based authorization in controllers:**

```typescript
// INCORRECT - User model doesn't have a role property
if (user.role !== 'owner') {
  return response.forbidden()
}

// CORRECT - Use userRole from HttpContext
async generate({ userRole, ... }: HttpContext) {
  if (!userRole.isOwner()) {
    return response.forbidden({
      error: 'Only tenant owners can generate invoices',
    })
  }
}
```

Roles are tenant-specific and accessed via the `userRole` property from HttpContext, not directly on the User model.

**2. DateTime formatting for database queries:**

```typescript
// INCORRECT - toSQLDate() doesn't exist
.where('time_entries.date', '>=', startDate.toSQLDate())

// CORRECT - Use toFormat() with pattern
.where('time_entries.date', '>=', startDate.toFormat('yyyy-MM-dd'))
```

Luxon's DateTime uses `.toFormat('yyyy-MM-dd')` for SQL-compatible date strings, not `.toSQLDate()`.

**3. Many-to-many junction tables with pivot timestamps:**

```typescript
// In model - specify pivot timestamps configuration
@manyToMany(() => TimeEntry, {
  pivotTable: 'invoice_item_time_entries',
  localKey: 'id',
  pivotForeignKey: 'invoice_item_id',
  relatedKey: 'id',
  pivotRelatedForeignKey: 'time_entry_id',
  pivotTimestamps: {
    createdAt: 'created_at',
    updatedAt: false,  // Only track creation, not updates
  },
})
declare timeEntries: ManyToMany<typeof TimeEntry>

// In controller - insert into junction table manually within transaction
for (const timeEntryId of lineItem.timeEntryIds) {
  await trx.table('invoice_item_time_entries').insert({
    invoice_item_id: invoiceItem.id,
    time_entry_id: timeEntryId,
    created_at: DateTime.now().toSQL(),
  })
}
```

**4. Transaction pattern for multi-step operations:**

```typescript
const trx = await db.transaction()

try {
  // Step 1: Create parent record
  const invoice = await Invoice.create({ ... }, { client: trx })

  // Step 2: Create related records
  for (const projectId of data.projectIds) {
    await InvoiceProject.create({ ... }, { client: trx })
  }

  // Step 3: Create line items and junction records
  for (const lineItem of result.lineItems) {
    const invoiceItem = await InvoiceItem.create({ ... }, { client: trx })

    for (const timeEntryId of lineItem.timeEntryIds) {
      await trx.table('invoice_item_time_entries').insert({ ... })
    }
  }

  await trx.commit()
} catch (error) {
  await trx.rollback()
  throw error
}
```

Always use transactions for operations that create multiple related records to ensure data consistency.

**5. Service layer pattern for business logic:**

```typescript
// Service layer (app/services/invoice_service.ts)
export class InvoiceService {
  async generateLineItems(options: GenerateInvoiceOptions): Promise<InvoiceGenerationResult> {
    // Pure business logic - no HTTP concerns
    const timeEntries = await this.queryBillableTimeEntries(...)
    const grouped = this.groupTimeEntriesByProjectAndMember(timeEntries)
    const lineItems = this.generateLineItemsFromGroups(grouped)
    return { lineItems, totals, warnings }
  }
}

// Controller (app/controllers/invoices.ts)
async generate({ request, response, tenant, userRole }: HttpContext) {
  // HTTP concerns - validation, authorization, response formatting
  const data = await request.validateUsing(generateInvoiceValidator)

  if (!userRole.isOwner()) {
    return response.forbidden({ error: 'Only owners can generate invoices' })
  }

  const result = await invoiceService.generateLineItems({
    customerId: data.customerId,
    projectIds: data.projectIds,
    startDate: DateTime.fromJSDate(data.startDate),
    endDate: DateTime.fromJSDate(data.endDate),
    tenantId: tenant.id,
  })

  // Use result to create invoice with transaction...
}
```

Separate business logic (services) from HTTP concerns (controllers) for better testability and reusability.

**6. Warnings pattern for non-blocking issues:**

```typescript
const warnings: string[] = [];

if (!projectMember.hourlyRate || projectMember.hourlyRate <= 0) {
  warnings.push(
    `Project member ${user.fullName} on ${project.name} has no hourly rate set. ` +
      `Their time entries were excluded from this invoice.`
  );
  continue;
}

return {
  lineItems,
  subtotal,
  total,
  warnings, // Include warnings in response for user visibility
};
```

Use warnings array to inform users of skipped data or potential issues without failing the entire operation.

### Invoice Display (View Invoice Feature)

When implementing the invoice show/view feature, the following patterns were discovered:

**1. API Response Data Type Coercion:**

The backend API returns numeric fields (amounts, prices) as strings when serialized. Frontend must explicitly convert these to numbers before using numeric operations.

```typescript
// INCORRECT - Assumes API returns numbers
const balanceDue = invoice.totalAmount - invoice.amountPaid; // Runtime error if strings

// CORRECT - Convert to numbers explicitly
const subtotal = Number(invoice.subtotal);
const taxAmount = Number(invoice.taxAmount);
const discountAmount = Number(invoice.discountAmount);
const totalAmount = Number(invoice.totalAmount);
const amountPaid = Number(invoice.amountPaid);
const balanceDue = totalAmount - amountPaid;
```

**2. Table Column Rendering with Type Safety:**

When rendering numeric values in Ant Design tables, always wrap in `Number()` to handle both string and number types:

```typescript
{
  title: "Amount",
  dataIndex: "amount",
  key: "amount",
  render: (amount: number) => (
    <Text strong>${Number(amount).toFixed(2)}</Text>
  ),
}
```

**3. Print-Friendly Styling:**

Use CSS media queries with `.no-print` class for UI elements that shouldn't appear in printed versions:

```typescript
// In component
<div className="no-print">
  <Button>Back</Button>
  <Button>Edit</Button>
</div>

// In styles
<style>
  {`
    @media print {
      .no-print {
        display: none !important;
      }
    }
  `}
</style>
```

**4. Refine useShow Hook Pattern:**

For detail/show pages, use Refine's `useShow` hook for consistent data fetching:

```typescript
const { query } = useShow({
  resource: "invoices",
  id, // from route params
});

const { data, isLoading, refetch } = query;
const invoice = data?.data;
```

**5. Route Parameter Type Handling:**

When passing IDs from Refine hooks to components, type coercion may be needed:

```typescript
// Invoice ID from useShow might be BaseKey (string | number)
<SendInvoiceModal
  invoiceId={invoice.id as number}  // Explicit cast if needed
  // ... other props
/>
```

### PDF Generation with Puppeteer

When implementing PDF generation from HTML using Puppeteer:

**1. Stream PDFs directly instead of storing files:**

```typescript
// Service returns Buffer
async generateInvoicePDF(invoice: Invoice): Promise<Buffer> {
  const html = this.generateInvoiceHTML(invoice)
  const pdfBuffer = await this.convertHtmlToPdf(html)
  return pdfBuffer
}

// Controller streams directly to response
const pdfBuffer = await pdfService.generateInvoicePDF(invoice)
response.header('Content-Type', 'application/pdf')
response.header('Content-Disposition', `attachment; filename="invoice-${invoice.invoiceNumber}.pdf"`)
return response.send(pdfBuffer)
```

**2. Puppeteer Configuration for Server Environments:**

```typescript
const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox'], // Required for Docker/server
})
```

**3. HTML to PDF Conversion:**

- Use inline CSS (external stylesheets may not load)
- Set proper page format and margins
- Wait for content to load: `waitUntil: 'networkidle0'`
- Always close browser in finally block to prevent memory leaks

**4. Security - HTML Escaping:**

Always escape user-provided content when generating HTML:

```typescript
private escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  }
  return text.replace(/[&<>"']/g, (m) => map[m])
}
```

**5. Testing PDF Generation:**

- Verify PDF magic number: `%PDF` at start of buffer
- Don't try to parse PDF content in tests - trust Puppeteer's rendering
- Test behavior: authorization, error handling, response headers
- Check for invoice number in binary string if needed: `buffer.toString('binary').includes(invoiceNumber)`

**6. Authentication in AdonisJS Tests:**

For token-based auth (`DbAccessTokensProvider`), create tokens directly:

```typescript
const generateToken = async (user: User): Promise<string> => {
  const token = await User.accessTokens.create(user, ['*'], {
    name: 'test-token',
    expiresAt: null,
  })
  return token.value!.release()
}

// Use bearer token in tests
const response = await client
  .post('/api/v1/invoices/123/pdf')
  .header('x-tenant-slug', tenant.slug)
  .bearerToken(token)
```

**7. Route Patterns:**

Routes use header-based tenant scoping, not URL parameters:

```typescript
// Correct
.post('/api/v1/invoices/:id/pdf')
.header('x-tenant-slug', tenant.slug)

// Not like this (no /tenants/:slug in URL)
.post('/api/v1/tenants/:slug/invoices/:id/pdf')
```

**8. Frontend: Downloading Streaming PDFs:**

When the backend streams a PDF buffer directly (not a URL), the frontend must handle the binary response properly:

```typescript
// INCORRECT - Using useCustomMutation expects JSON, not binary
const { mutate: generatePDF } = useCustomMutation();
generatePDF({
  url: `/invoices/${id}/pdf`,
  method: "post",
  values: {},
});

// CORRECT - Fetch with blob response type and trigger download
const handleDownloadPDF = async () => {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    const tenantSlug = localStorage.getItem(TENANT_SLUG_KEY);
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

    const response = await fetch(`${apiBaseUrl}/invoices/${id}/pdf`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "X-Tenant-Slug": tenantSlug || "",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Get the PDF blob from response
    const blob = await response.blob();

    // Create download link
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `invoice-${invoiceNumber}.pdf`;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();

    // Clean up
    setTimeout(() => {
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }, 100);

    message.success("PDF downloaded successfully");
  } catch (error) {
    console.error("PDF download error:", error);
    message.error("Failed to download PDF. Please try again.");
  }
};
```

**Key points:**
- Use native `fetch` API instead of Refine's `useCustomMutation` for binary responses
- Response must be read as `.blob()`, not `.json()`
- Create object URL from blob for download
- Always clean up object URLs with `revokeObjectURL()` to prevent memory leaks
- Include proper authentication headers (Bearer token and tenant slug)
- If using Axios, set `responseType: 'blob'` in config

### Email Sending with Resend

When implementing email functionality with Resend:

**1. Environment Configuration:**

Add Resend configuration to `start/env.ts`:

```typescript
RESEND_API_KEY: Env.schema.string.optional(),
EMAIL_FROM: Env.schema.string.optional(),
EMAIL_FROM_NAME: Env.schema.string.optional(),
```

Update `.env.example` with documentation:

```env
# Email Configuration (Resend)
# Get your API key from: https://resend.com/api-keys
RESEND_API_KEY=re_your_api_key_here
EMAIL_FROM=noreply@freelancerhub.com
EMAIL_FROM_NAME=Freelancer Hub
```

**2. Service Implementation Pattern:**

Initialize Resend client with graceful fallback:

```typescript
import { Resend } from 'resend'

export class EmailService {
  private resend: Resend | null

  constructor() {
    const apiKey = env.get('RESEND_API_KEY')
    this.resend = apiKey ? new Resend(apiKey) : null
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    // Validate before sending
    if (!this.isValidEmail(options.to)) {
      throw new Error(`Invalid email address: ${options.to}`)
    }

    // Fallback to console logging if Resend not configured
    if (!this.resend) {
      console.log('📧 Email would be sent (Resend not configured):')
      // ... log details
      return true
    }

    try {
      await this.resend.emails.send({
        from: `${this.fromName} <${this.fromEmail}>`,
        to: options.to,
        cc: options.cc && options.cc.length > 0 ? options.cc : undefined,
        subject: options.subject,
        html: options.html,
        attachments: options.attachments,
      })
      return true
    } catch (error) {
      console.error('Failed to send email via Resend:', error)
      return false
    }
  }
}
```

**3. Email Validation:**

Always validate emails before attempting to send:

```typescript
private isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email) && !email.includes('\n') && !email.includes('\r')
}
```

Key validation rules:
- Check email format with regex
- Reject emails with newlines (security risk - email header injection)
- Reject emails with carriage returns
- Validate CC recipients (max 10 per Resend limits)
- Throw errors for invalid emails (fail fast)

**4. Testing Email Services:**

Use TDD with behavior-based tests:

```typescript
test('should send email with valid recipient', async ({ assert }) => {
  const emailService = new EmailService()

  const result = await emailService.sendEmail({
    to: 'user@example.com',
    subject: 'Test',
    html: '<p>Test email</p>',
  })

  assert.isTrue(result)
})

test('should reject invalid email address', async ({ assert }) => {
  const emailService = new EmailService()

  await assert.rejects(
    async () => {
      await emailService.sendEmail({
        to: 'not-an-email',
        subject: 'Test',
        html: '<p>Test</p>',
      })
    },
    'Invalid email address: not-an-email'
  )
})
```

**5. Testing with Database Records:**

When testing high-level email methods that use database records, use unique identifiers to avoid conflicts:

```typescript
test('should send invoice email successfully', async ({ assert }) => {
  const timestamp = Date.now()

  const tenant = await Tenant.create({
    name: `Test Company ${timestamp}`,
    slug: `test-company-${timestamp}`,
  })

  const user = await User.create({
    email: `owner-${timestamp}@test.com`,
    password: 'password',
  })

  // ... rest of test
})
```

This prevents "duplicate key" errors when tests run multiple times.

**6. Graceful Degradation:**

The email service falls back to console logging when Resend is not configured, allowing:
- Local development without API keys
- Test environments without real email sending
- Debugging email content in development

**7. Email Tracking Pattern:**

For invoices and other entities that track email sending:

```typescript
async sendInvoiceEmail(options: SendInvoiceEmailOptions): Promise<boolean> {
  const sent = await this.sendEmail({
    to: options.to,
    cc: options.cc,
    subject: emailSubject,
    html,
    attachments,
  })

  if (sent) {
    // Update tracking fields
    invoice.sentAt = DateTime.now()
    invoice.sentTo = options.to
    invoice.emailCount = (invoice.emailCount || 0) + 1
    invoice.lastEmailSentAt = DateTime.now()
    await invoice.save()
  }

  return sent
}
```

**Key Gotchas:**
- Resend requires verified sender domains in production
- Test mode sends to your own email only
- Attachments use `path` not `content` - Resend handles file reading
- CC recipients count against rate limits
- Always validate emails before sending to avoid API errors
- Email validation must happen in `sendEmail` to catch all cases (don't duplicate in higher-level methods)

## Resources and References

- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [Testing Library Principles](https://testing-library.com/docs/guiding-principles)
- [Kent C. Dodds Testing JavaScript](https://testingjavascript.com/)
- [Functional Programming in TypeScript](https://gcanti.github.io/fp-ts/)
- [Puppeteer Documentation](https://pptr.dev/)
- [Resend Documentation](https://resend.com/docs)
