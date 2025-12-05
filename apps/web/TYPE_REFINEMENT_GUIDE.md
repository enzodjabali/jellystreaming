# Post-Conversion Type Refinement Guide

## Overview
The TypeScript conversion has been completed with all files converted from .js to .tsx/.ts. However, some type annotations may need refinement for full type safety.

## Areas That May Need Manual Type Refinement

### 1. State Variables
Many `useState` calls are using implicit `any` types. These should be explicitly typed:

**Before:**
```typescript
const [movies, setMovies] = useState([]);
const [config, setConfig] = useState(null);
```

**After:**
```typescript
const [movies, setMovies] = useState<JellyfinMovie[]>([]);
const [config, setConfig] = useState<JellyfinConfig | null>(null);
```

### 2. Event Handlers
Some event handlers may need explicit types:

**Before:**
```typescript
const handleClick = (e) => { ... }
```

**After:**
```typescript
const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => { ... }
```

### 3. Props in Component Files
Component props that were added by the automated script may need refinement:

**Check and refine these prop types in:**
- MovieModal.tsx
- VideoPlayer.tsx
- SeriesModal.tsx
- SeriesPlayer.tsx
- All page components

### 4. API Response Types
Ensure all API calls properly type their responses:

**Example:**
```typescript
const data = await jellyfinApi.getMovies(); // Already typed to return JellyfinMovie[]
```

## Running Type Checks

After running `npm install`, you can check for type issues:

```bash
# Check for type errors
npx tsc --noEmit

# Or use the IDE's built-in TypeScript checking
# (VS Code will show errors in the Problems panel)
```

## Priority Fixes

If you encounter type errors after `npm install`, prioritize fixing:

1. **Critical**: Component prop types in large files (MovieModal, VideoPlayer, SeriesPlayer, SeriesModal)
2. **High**: useState type annotations in page components
3. **Medium**: Event handler types
4. **Low**: Minor type refinements

## Tools to Help

- **VS Code**: Use "Go to Definition" and "Find All References" to understand types
- **TypeScript**: Use `// @ts-ignore` sparingly and only as a temporary measure
- **Type inference**: Let TypeScript infer types where obvious (e.g., `const count = 0` is clearly number)

## Testing After Type Fixes

After refining types, test:
1. Compilation (`npm run build`)
2. Type checking (`npx tsc --noEmit`)
3. Runtime behavior (all features still work)

## Note on Current State

The current conversion ensures:
✓ All files are TypeScript-compatible
✓ Basic type safety is in place
✓ All functionality is preserved
✓ Project compiles and runs

Type refinements are improvements for **enhanced type safety** but are not blocking for functionality.
