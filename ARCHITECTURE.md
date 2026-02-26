# Farm Intelligence Platform — Architecture Overview

## 1. System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      CLIENT (Browser)                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │
│  │ Dashboard │  │  Import  │  │  Auth    │  │ Shared  │ │
│  │  Pages    │  │  Wizard  │  │  Pages   │  │ Layout  │ │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬────┘ │
│       │              │             │              │      │
│  ┌────▼──────────────▼─────────────▼──────────────▼────┐ │
│  │              React Component Layer                   │ │
│  │   (Presentation only — NO business logic)            │ │
│  └─────────────────────┬───────────────────────────────┘ │
└────────────────────────┼────────────────────────────────┘
                         │ HTTP (fetch)
┌────────────────────────▼────────────────────────────────┐
│                  NEXT.JS SERVER                          │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │  /app/api/*  — Thin API Route Handlers            │   │
│  │  (validate request → delegate to service → respond)│   │
│  └───────────────────────┬──────────────────────────┘   │
│                          │                               │
│  ┌───────────────────────▼──────────────────────────┐   │
│  │  /services/*  — Business Logic Layer              │   │
│  │  ┌─────────────┐ ┌──────────────┐ ┌────────────┐ │   │
│  │  │ importSvc   │ │ cropSvc      │ │ financeSvc │ │   │
│  │  └─────────────┘ └──────────────┘ └────────────┘ │   │
│  └───────────────────────┬──────────────────────────┘   │
│                          │                               │
│  ┌───────────────────────▼──────────────────────────┐   │
│  │  /lib/prisma  — Data Access Layer (Prisma ORM)    │   │
│  └───────────────────────┬──────────────────────────┘   │
│                          │                               │
│  ┌───────────────────────▼──────────────────────────┐   │
│  │  Middleware: Auth guard + Role enforcement         │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                         │ TCP
┌────────────────────────▼────────────────────────────────┐
│              SUPABASE POSTGRES                            │
│  ┌──────┐ ┌──────────┐ ┌───────────┐ ┌──────────────┐  │
│  │Fields│ │  Crops   │ │ Varieties │ │FieldCropYear │  │
│  └──────┘ └──────────┘ └───────────┘ └──────────────┘  │
│  ┌──────────┐ ┌──────────┐ ┌────────┐                   │
│  │Financials│ │ImportLog │ │ Users  │                   │
│  └──────────┘ └──────────┘ └────────┘                   │
└─────────────────────────────────────────────────────────┘
```

## 2. Layer Responsibilities

### Presentation Layer (`/app`, `/components`)
- Renders UI, handles user interactions
- Calls API routes via typed fetch wrappers
- **ZERO** business logic — only display state and delegate events
- Components split: `ui/` (generic), `dashboard/` (domain), `admin/` (admin-only)

### API Route Layer (`/app/api`)
- Thin handlers: parse request → authenticate → call service → return response
- All routes return typed `ApiResponse<T>` envelopes
- Error handling via centralized `handleApiError()` utility

### Service Layer (`/services`)
- **ALL** business logic lives here
- Each service exports typed async functions
- Services call Prisma for data access, never raw SQL
- Testable in isolation (no framework coupling)

### Data Access Layer (`/lib/prisma`)
- Single Prisma client instance (connection pooled for serverless)
- Typed queries — Prisma generates types from schema
- No raw SQL unless documented with justification

### Auth Layer (`/middleware.ts` + `/lib/auth`)
- Supabase Auth handles signup/login/session
- Middleware intercepts requests, validates JWT, checks role
- Role enum: `ADMIN` | `VIEWER`

## 3. Data Flow: Import

```
Admin uploads .xlsx
  → POST /api/admin/import
    → middleware checks ADMIN role
    → API route reads multipart form
    → importService.parseExcel(buffer)
      → validates headers, types, constraints
      → returns { valid: Row[], errors: ValidationError[] }
    → If errors → 422 with error details
    → If valid → importService.persistData(rows)
      → Prisma upsert in transaction
      → Log to ImportLog
    → Return 200 with summary
```

## 4. Data Flow: Dashboard Query

```
User visits /dashboard/crop-performance
  → GET /api/dashboard/crop-performance?year=2024
    → middleware checks authenticated
    → cropService.getPerformance(filters)
      → Prisma query with filters
      → Transform into chart-ready shape
    → Return typed response
  → Component renders Recharts
```

## 5. Key Design Decisions

| Decision | Rationale |
|---|---|
| Prisma over raw SQL | Type safety, migrations, Supabase-compatible |
| Service layer pattern | Testability, reuse across routes |
| Server-side Excel parsing | Security, validation integrity |
| UUID primary keys | Supabase convention, no sequential ID leakage |
| JSON for quality_metrics | Semi-structured data varying by crop |
| Typed API envelope | Consistent error handling, frontend type inference |
| Middleware auth | Centralized, can't be bypassed |

## 6. Security Model

- All API routes authenticated via Supabase JWT
- Role checked in middleware before handler executes
- Import: ADMIN only, file size limited, MIME validated
- No client-side role enforcement (server = source of truth)
- Secrets never exposed to client bundle
