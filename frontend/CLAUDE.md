# React TypeScript Frontend Development Guidelines

## Core Engineering Principles

You are a senior frontend engineer writing production React code. Always pedantically review code first.

**Priorities:**
- Clarity over cleverness
- Simplicity over abstraction  
- Explicit over implicit
- Readable, maintainable, type-safe code
- Avoid spaghetti comments and over-commenting

## Code Quality Standards

- Follow React, TypeScript, and modern frontend idioms and established patterns
- Use descriptive, meaningful names for components, hooks, and utilities
- Separate concerns cleanly with proper component architecture
- Handle errors properly with appropriate error boundaries and error types
- Write code that's easy to debug, test, and modify six months from now
- Ship working solutions—avoid premature optimization and over-engineering
- Document tradeoffs when making architectural decisions

## Project Structure

Maintain strict separation of concerns using this folder structure:

```
src/
├── components/      # Reusable UI components
│   ├── ui/         # shadcn/ui components
│   └── shared/     # Custom shared components
├── pages/          # Page components and routing
├── hooks/          # Custom React hooks
├── utils/          # Pure utility functions
├── services/       # API calls and external integrations
├── types/          # Shared TypeScript types and interfaces
├── lib/            # Configuration and setup utilities
└── styles/         # Global styles and theme configuration
```

## UI Framework Standards

### shadcn/ui Component Library

- **ALWAYS use shadcn/ui components exclusively** for UI elements
- Install components as needed: `npx shadcn@latest add [component-name]`
- Available components: Accordion, Alert, Alert Dialog, Aspect Ratio, Avatar, Badge, Breadcrumb, Button, Calendar, Card, Carousel, Chart, Checkbox, Collapsible, Combobox, Command, Context Menu, Data Table, Date Picker, Dialog, Drawer, Dropdown Menu, Hover Card, Input, Input OTP, Label, Menubar, Navigation Menu, Pagination, Popover, Progress, Radio Group, Resizable, Scroll Area, Select, Separator, Sheet, Sidebar, Skeleton, Slider, Sonner, Switch, Table, Tabs, Textarea, Toast, Toggle, Toggle Group, Tooltip, Typography
- Customize components through the established theming system
- Never create custom UI components when shadcn/ui equivalent exists

### Design System & Color Palette

**Strict Color Palette - Use ONLY these colors:**
```css
:root {
  --dominant: #EBEBD3;     /* Primary background/neutral */
  --primary: #2B806B;      /* Primary actions/links */
  --accent: #DADA5B;       /* Highlights/warnings */
  --muted: #7E8381;        /* Secondary text/borders */
  --brown: #875B4E;        /* Error states/emphasis */
  --warm: #C19780;         /* Success states/warm accents */
}
```

**Color Usage Guidelines:**
- `#EBEBD3` (dominant): Main backgrounds, cards, neutral spaces
- `#2B806B` (primary): Primary buttons, links, active states
- `#DADA5B` (accent): Warnings, highlights, call-to-action elements
- `#7E8381` (muted): Secondary text, borders, disabled states
- `#875B4E` (brown): Error states, destructive actions
- `#C19780` (warm): Success states, positive feedback

## Type Safety Requirements

- Everything must be fully type-safe
- **NEVER use `any` or `unknown` types** - always define proper types
- **Frontend-Backend Type Synchronization**: Ensure exact type matches between frontend and backend
- Use proper TypeScript interfaces and types
- Leverage strict TypeScript compiler settings
- Each folder should have its own type definitions where appropriate

### API Integration Type Safety

- **Always define proper API response types** that match backend exactly
- **Use typed API clients** - never use untyped fetch calls
- **Define request/response interfaces** for all API endpoints
- **Validate API responses at runtime** when necessary

Example of proper API typing:
```typescript
// ✅ Correct - matches backend types exactly
interface CreateJobRequest {
  urlToArchive: string;
  websiteId: string;
}

interface JobResponse {
  _id: string;
  urlToArchive: string;
  website: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
}

// ✅ Proper API service with full typing
const createJob = async (data: CreateJobRequest): Promise<JobResponse> => {
  const response = await fetch('/api/jobs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  
  if (!response.ok) {
    throw new Error(`Failed to create job: ${response.statusText}`);
  }
  
  return response.json() as JobResponse;
};
```

## React Component Standards

### Component Architecture

- **Use functional components exclusively** with hooks
- **Follow the single responsibility principle** - one purpose per component
- **Separate presentation from logic** using custom hooks
- **Use proper prop typing** with interfaces, never inline types
- **Export components as named exports** for better tree shaking

### Hook Usage

- **Extract complex logic into custom hooks** for reusability
- **Use built-in hooks appropriately**: useState, useEffect, useCallback, useMemo
- **Create typed custom hooks** with proper return type inference
- **Follow hooks naming convention**: `use[HookName]`

Example of proper component structure:
```typescript
// ✅ Correct component structure
interface JobCardProps {
  job: JobResponse;
  onStatusChange: (jobId: string, status: JobStatus) => void;
}

export const JobCard: React.FC<JobCardProps> = ({ job, onStatusChange }) => {
  const { isLoading, error, updateStatus } = useJobStatus(job._id);

  const handleStatusUpdate = useCallback((newStatus: JobStatus) => {
    updateStatus(newStatus);
    onStatusChange(job._id, newStatus);
  }, [job._id, updateStatus, onStatusChange]);

  if (error) {
    return <Alert variant="destructive">{error.message}</Alert>;
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{job.urlToArchive}</CardTitle>
        <Badge variant={getStatusVariant(job.status)}>{job.status}</Badge>
      </CardHeader>
      <CardContent>
        {/* Component content */}
      </CardContent>
    </Card>
  );
};
```

## File and Naming Conventions

- **Components**: PascalCase (e.g., `JobCard.tsx`, `UserProfile.tsx`)
- **Hooks**: camelCase starting with `use` (e.g., `useJobStatus.ts`, `useApiClient.ts`)
- **Utils**: camelCase (e.g., `formatDate.ts`, `apiClient.ts`)
- **Types**: PascalCase interfaces (e.g., `JobResponse`, `UserData`)
- **Constants**: SCREAMING_SNAKE_CASE (e.g., `API_ENDPOINTS`, `DEFAULT_COLORS`)

## Error Handling

- **Use Error Boundaries** for component-level error handling
- **Implement proper loading and error states** in all components
- **Use typed error objects** - never catch errors as `any`
- **Provide meaningful error messages** to users
- **Log errors appropriately** for debugging

## Performance Optimization

- **Use React.memo for expensive re-renders** only when necessary
- **Implement proper dependency arrays** in useEffect and useCallback
- **Lazy load components** for route-based code splitting
- **Optimize bundle size** by avoiding unnecessary dependencies
- **Use proper key props** in lists

## Testing and Linting

Before implementing any feature:
- Run `npm run lint` to ensure code style compliance
- Run `npm run typecheck` to verify type safety
- Ensure all tests pass with `npm test`
- Test components with proper accessibility standards

## Accessibility Standards

- **Follow WCAG 2.1 AA guidelines**
- **Use semantic HTML elements** properly
- **Implement proper ARIA attributes** when necessary
- **Ensure keyboard navigation** works for all interactive elements
- **Maintain proper color contrast** ratios with the established palette
- **Test with screen readers** when implementing complex interactions

## Code Review Process

Always review code pedantically before submission:
1. Verify type safety and proper error handling
2. Check component structure and separation of concerns
3. Ensure accessibility compliance
4. Validate proper use of shadcn/ui components
5. Confirm adherence to color palette
6. Verify frontend-backend type synchronization
7. Check for proper performance optimizations
8. Ensure readable, maintainable structure

## State Management

- **Use React's built-in state management** (useState, useReducer, useContext) for most cases
- **Only add external state management** (Zustand, Redux) when truly necessary
- **Keep state as close to where it's used** as possible
- **Use proper state lifting patterns** when sharing state between components
- **Implement proper state normalization** for complex data structures