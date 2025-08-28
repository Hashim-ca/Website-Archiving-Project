# Node.js TypeScript Development Guidelines

## Core Engineering Principles

You are a senior engineer writing production code. Always pedantically review code first.

**Priorities:**
- Clarity over cleverness
- Simplicity over abstraction  
- Explicit over implicit
- Readable, maintainable, type-safe code
- Avoid spaghetti comments and over-commenting

## Code Quality Standards

- Follow TypeScript and Node.js idioms and established patterns
- Use descriptive, meaningful names for variables, functions, and classes
- Separate concerns cleanly with proper architecture
- Handle errors properly with appropriate error types
- Write code that's easy to debug, test, and modify six months from now
- Ship working solutions—avoid premature optimization and over-engineering
- Document tradeoffs when making architectural decisions

## Project Structure

Maintain strict separation of concerns using this folder structure:

```
src/
├── models/       # Data models and types
├── controllers/  # Request handlers and business logic coordination
├── services/     # Business logic and external integrations
├── routes/       # API route definitions
└── types/        # Shared TypeScript types and interfaces
```

## Type Safety Requirements

- Everything must be fully type-safe
- **NEVER use `any` or `unknown` types** - always define proper types
- Use proper TypeScript interfaces and types
- Leverage strict TypeScript compiler settings
- Each folder should have its own type definitions where appropriate

### MongoDB & Mongoose Type Safety

- **Always properly type MongoDB ObjectIds**: Use `Types.ObjectId` from mongoose
- **Never use type assertions (`as`) for MongoDB IDs** - use proper typing instead
- **Define explicit interfaces for all Mongoose documents** extending `Document`
- **Use generic typing for Mongoose models**: `model<IYourInterface>('ModelName', schema)`
- **For ObjectId references**: Use `Types.ObjectId | IPopulatedDocument` union types
- **After document save operations**: Access `_id` property using proper Document interface, not type assertions

Example of proper MongoDB typing:
```typescript
// ✅ Correct
export interface IJob extends Document {
  _id: Types.ObjectId;
  urlToArchive: string;
  website: Types.ObjectId | IWebsite;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

const job = new Job({ ... });
await job.save();
return job._id.toString(); // No type assertion needed

// ❌ Wrong
return (job._id as string).toString(); // Never use type assertions
```

## Testing and Linting

Before implementing any feature:
- Run `npm run lint` to ensure code style compliance
- Run `npm run typecheck` to verify type safety
- Ensure all tests pass with `npm test`

## Code Review Process

Always review code pedantically before submission:
1. Verify type safety and proper error handling
2. Check for separation of concerns
3. Ensure readable, maintainable structure
4. Validate proper use of established patterns
5. Confirm no over-engineering or premature optimization