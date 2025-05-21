# Shared Schema Files

This project has two schema files for different purposes:

## 1. Database Schema: `/shared/schema.ts`

This file defines the PostgreSQL database schema using Drizzle ORM. It contains:
- Table definitions
- Column types and constraints
- Relationships between tables
- Enum definitions

This schema is used by the server to create and interact with the database tables.

## 2. Frontend Types: `/client/src/shared/schema.ts`

This file contains TypeScript interfaces used throughout the frontend application. It defines:
- Data structures for API responses
- Common types shared between components
- Type definitions for domain objects

## Import Paths

When importing from these schema files, use:

```typescript
// For database schema (server-side)
import { users, transactions, ... } from '@shared/schema';

// For frontend types (client-side)
import { User, Transaction, ... } from '@shared/schema';
```

The `@shared/schema` path alias is configured in `tsconfig.json` to ensure consistent imports across the application.
