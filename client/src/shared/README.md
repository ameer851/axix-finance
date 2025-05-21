# Client Shared Schema

This directory contains TypeScript interfaces and types used throughout the frontend application.

The `schema.ts` file defines:
- Data structures for API responses
- Common types shared between components
- Type definitions for domain objects

## Import Usage

When importing from this schema file, use:

```typescript
// In client components/services
import { User, Transaction, ... } from '@shared/schema';
```

The `@shared/schema` path alias is configured in `tsconfig.json` to ensure consistent imports across the application.

## Relationship with Database Schema

Note that this schema is separate from the database schema defined in `/shared/schema.ts`. That file defines the actual PostgreSQL database tables using Drizzle ORM, while this file defines TypeScript interfaces for frontend use.
