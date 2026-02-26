# Farm Intelligence Platform — Folder Structure

```
farm-intelligence/
├── prisma/
│   ├── schema.prisma              # Database schema (source of truth)
│   ├── migrations/                # Prisma-managed migrations
│   └── seed/
│       └── index.ts               # Seed script with example data
│
├── src/
│   ├── app/                       # Next.js 14 App Router
│   │   ├── layout.tsx             # Root layout (providers, global styles)
│   │   ├── page.tsx               # Landing / redirect to dashboard
│   │   │
│   │   ├── (auth)/                # Route group: unauthenticated pages
│   │   │   ├── login/page.tsx
│   │   │   └── signup/page.tsx
│   │   │
│   │   ├── (protected)/           # Route group: requires authentication
│   │   │   ├── layout.tsx         # Sidebar + topbar layout
│   │   │   ├── dashboard/
│   │   │   │   ├── page.tsx               # Dashboard overview
│   │   │   │   ├── crop-performance/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── financial/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── integrated/
│   │   │   │       └── page.tsx
│   │   │   └── admin/
│   │   │       └── upload/
│   │   │           └── page.tsx           # XLSX import wizard
│   │   │
│   │   └── api/                   # API routes (thin handlers)
│   │       ├── auth/
│   │       │   └── callback/route.ts      # Supabase auth callback
│   │       ├── admin/
│   │       │   └── import/route.ts        # POST: xlsx import
│   │       └── dashboard/
│   │           ├── crop-performance/route.ts
│   │           └── financial/route.ts
│   │
│   ├── components/
│   │   ├── ui/                    # Generic reusable components
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── DataTable.tsx
│   │   │   └── LoadingSpinner.tsx
│   │   ├── dashboard/             # Domain-specific dashboard components
│   │   │   ├── FilterBar.tsx
│   │   │   ├── CropChart.tsx
│   │   │   ├── FinancialChart.tsx
│   │   │   └── StatsCard.tsx
│   │   ├── admin/                 # Admin-only components
│   │   │   ├── FileUploader.tsx
│   │   │   └── ValidationResults.tsx
│   │   └── layout/                # Layout components
│   │       ├── Sidebar.tsx
│   │       ├── Topbar.tsx
│   │       └── AppProviders.tsx
│   │
│   ├── services/                  # Business logic layer
│   │   ├── importService.ts       # Excel parsing, validation, persistence
│   │   ├── cropService.ts         # Crop performance queries + transforms
│   │   ├── financialService.ts    # Financial queries + transforms
│   │   └── exportService.ts       # CSV export utility
│   │
│   ├── lib/
│   │   ├── prisma/
│   │   │   └── client.ts          # Singleton Prisma client
│   │   └── auth/
│   │       ├── supabase-server.ts # Server-side Supabase client
│   │       ├── supabase-browser.ts# Client-side Supabase client
│   │       └── guards.ts          # Role-checking helpers
│   │
│   ├── types/
│   │   ├── database.ts            # Mirrors Prisma models for frontend
│   │   ├── api.ts                 # API request/response types
│   │   ├── import.ts              # Import validation types
│   │   └── dashboard.ts           # Chart data shapes
│   │
│   ├── utils/
│   │   ├── apiResponse.ts         # Typed response envelope builder
│   │   ├── csvExport.ts           # Generic CSV generation
│   │   └── formatters.ts          # Number, date, currency formatters
│   │
│   └── middleware.ts              # Auth + role middleware
│
├── .env.example                   # Required environment variables
├── next.config.js                 # Next.js configuration
├── tailwind.config.ts             # Tailwind configuration
├── tsconfig.json                  # TypeScript strict mode
├── package.json
└── README.md
```
