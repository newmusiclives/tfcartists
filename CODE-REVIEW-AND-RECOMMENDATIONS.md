# Code Review & Recommendations
**TrueFans RADIO Network - Three-Team System**
**Review Date:** December 4, 2025
**Reviewer:** Claude Code

---

## Executive Summary

The TrueFans RADIO application is well-structured with clear separation of concerns across three teams (Riley, Harper, Elliot). The pipeline functionality works correctly after recent fixes. However, there are opportunities for improvement in code reusability, type safety, performance, and maintainability.

---

## 1. Code Duplication & Reusability

### Issue: Repeated Pipeline Logic
**Severity:** Medium
**Files Affected:**
- `/src/app/riley/pipeline/page.tsx`
- `/src/app/harper/pipeline/page.tsx`

**Problem:**
Both Riley and Harper pipelines have nearly identical filtering logic, state management, and UI patterns:
```typescript
// Duplicated in both files:
const [selectedStage, setSelectedStage] = useState<PipelineStage | 'all'>('all');
const [selectedPriority, setSelectedPriority] = useState<Priority | 'all'>('all');

const filteredItems = items.filter(item => {
  const matchesStage = selectedStage === 'all' || item.stage === selectedStage;
  const matchesPriority = selectedPriority === 'all' || item.priority === selectedPriority;
  return matchesStage && matchesPriority;
});
```

**Recommendation:**
Create shared hooks and components:

```typescript
// src/hooks/usePipelineFilter.ts
export function usePipelineFilter<T extends { stage: string; priority: string }>(
  items: T[],
  stages: string[]
) {
  const [selectedStage, setSelectedStage] = useState<string | 'all'>('all');
  const [selectedPriority, setSelectedPriority] = useState<'high' | 'medium' | 'low' | 'all'>('all');

  const filteredItems = useMemo(() =>
    items.filter(item => {
      const matchesStage = selectedStage === 'all' || item.stage === selectedStage;
      const matchesPriority = selectedPriority === 'all' || item.priority === selectedPriority;
      return matchesStage && matchesPriority;
    }),
    [items, selectedStage, selectedPriority]
  );

  const handleViewAll = useCallback(() => {
    setSelectedStage('all');
    setSelectedPriority('all');
  }, []);

  return {
    selectedStage,
    setSelectedStage,
    selectedPriority,
    setSelectedPriority,
    filteredItems,
    handleViewAll,
  };
}
```

```typescript
// src/components/PipelineOverview.tsx
interface PipelineOverviewProps<T> {
  stages: Array<{ key: string; label: string; color: string }>;
  items: T[];
  selectedStage: string | 'all';
  onStageSelect: (stage: string) => void;
  onViewAll: () => void;
  getAssignedTo: (stage: string) => string;
  primaryColor?: string;
}

export function PipelineOverview<T>({ /* props */ }: PipelineOverviewProps<T>) {
  // Reusable pipeline overview component
}
```

**Benefits:**
- Reduces code duplication by ~200 lines
- Single source of truth for pipeline logic
- Easier to maintain and test
- Consistent behavior across teams

---

## 2. Type Safety Improvements

### Issue: Type Assertions and Any Types
**Severity:** Medium
**Files Affected:** Multiple pipeline and form pages

**Problem:**
```typescript
// Unsafe type assertions
onChange={(e) => setSelectedPriority(e.target.value as any)}
onChange={(e) => setSelectedStage(e.target.value as PipelineStage | 'all')}
```

**Recommendation:**
Use proper type guards and validation:

```typescript
// src/types/pipeline.ts
export type Priority = 'high' | 'medium' | 'low';
export type PriorityFilter = Priority | 'all';

function isPriority(value: string): value is Priority {
  return ['high', 'medium', 'low'].includes(value);
}

function isPriorityFilter(value: string): value is PriorityFilter {
  return value === 'all' || isPriority(value);
}

// Usage:
onChange={(e) => {
  const value = e.target.value;
  if (isPriorityFilter(value)) {
    setSelectedPriority(value);
  }
}}
```

**Benefits:**
- Runtime type safety
- Prevents invalid state
- Better IDE autocomplete
- Catches bugs at compile time

---

## 3. Performance Optimizations

### Issue: Unnecessary Re-renders
**Severity:** Low-Medium
**Files Affected:** All pipeline pages

**Problem:**
- Filter calculations run on every render
- No memoization for expensive computations
- Event handlers recreated on each render

**Recommendation:**

```typescript
// Memoize filtered results
const filteredArtists = useMemo(() => {
  return artists.filter(artist => {
    const matchesStage = selectedStage === 'all' || artist.stage === selectedStage;
    const matchesPriority = selectedPriority === 'all' || artist.priority === selectedPriority;
    return matchesStage && matchesPriority;
  });
}, [artists, selectedStage, selectedPriority]);

// Memoize stats calculations
const stats = useMemo(() => ({
  totalInPipeline: artists.length,
  highPriority: artists.filter(a => a.priority === 'high').length,
  needsAction: artists.filter(a => a.daysInStage > 3).length,
  conversionRate: Math.round((artists.filter(a => a.stage === 'activated').length / artists.length) * 100),
}), [artists]);

// Memoize callbacks
const handleViewAllStages = useCallback(() => {
  setSelectedStage('all');
  setSelectedPriority('all');
}, []);

const handleStageClick = useCallback((stage: PipelineStage) => {
  setSelectedStage(stage);
}, []);
```

**Benefits:**
- Reduces unnecessary re-renders
- Improves performance with large datasets
- Better user experience

---

## 4. Database Integration

### Issue: Mock Data Everywhere
**Severity:** High
**Files Affected:** All pipeline and dashboard pages

**Current State:**
```typescript
const [artists, setArtists] = useState<Artist[]>([
  { id: 1, name: "Sarah Martinez", ... },
  { id: 2, name: "Jake Rivers", ... },
  // ...mock data
]);
```

**Recommendation:**
Implement proper data fetching with React Server Components and Server Actions:

```typescript
// src/app/riley/pipeline/page.tsx (Server Component)
import { getArtists } from '@/server/actions/artists';

export default async function PipelinePage() {
  const artists = await getArtists();

  return <PipelineClient initialArtists={artists} />;
}

// src/app/riley/pipeline/PipelineClient.tsx ('use client')
'use client';

export function PipelineClient({ initialArtists }: { initialArtists: Artist[] }) {
  const [artists, setArtists] = useState(initialArtists);
  // ... rest of client logic
}

// src/server/actions/artists.ts
'use server';

import { prisma } from '@/lib/prisma';

export async function getArtists() {
  return await prisma.artist.findMany({
    orderBy: { createdAt: 'desc' },
  });
}

export async function updateArtistStage(artistId: number, newStage: string) {
  return await prisma.artist.update({
    where: { id: artistId },
    data: { stage: newStage },
  });
}
```

**Benefits:**
- Real data persistence
- Server-side rendering for better SEO
- Reduced client bundle size
- Better separation of concerns

---

## 5. State Management

### Issue: Prop Drilling and Local State
**Severity:** Medium
**Files Affected:** Pipeline pages with modals and nested components

**Problem:**
```typescript
// Deep prop drilling
<Modal
  artist={selectedArtist}
  onUpdate={(updated) => {
    setArtists(artists.map(a => a.id === updated.id ? updated : a));
    setSelectedArtist(null);
  }}
/>
```

**Recommendation:**
Use Context API or Zustand for shared state:

```typescript
// src/stores/useRileyStore.ts
import { create } from 'zustand';

interface RileyStore {
  artists: Artist[];
  selectedArtist: Artist | null;
  selectedStage: PipelineStage | 'all';
  selectedPriority: Priority | 'all';

  setArtists: (artists: Artist[]) => void;
  setSelectedArtist: (artist: Artist | null) => void;
  setSelectedStage: (stage: PipelineStage | 'all') => void;
  updateArtist: (id: number, updates: Partial<Artist>) => void;
  moveArtistToStage: (id: number, stage: PipelineStage) => void;
}

export const useRileyStore = create<RileyStore>((set) => ({
  artists: [],
  selectedArtist: null,
  selectedStage: 'all',
  selectedPriority: 'all',

  setArtists: (artists) => set({ artists }),
  setSelectedArtist: (artist) => set({ selectedArtist: artist }),
  setSelectedStage: (stage) => set({ selectedStage: stage }),

  updateArtist: (id, updates) => set((state) => ({
    artists: state.artists.map(a => a.id === id ? { ...a, ...updates } : a)
  })),

  moveArtistToStage: (id, stage) => set((state) => ({
    artists: state.artists.map(a =>
      a.id === id ? { ...a, stage, daysInStage: 0 } : a
    )
  })),
}));

// Usage:
function PipelinePage() {
  const { artists, selectedStage, setSelectedStage } = useRileyStore();
  // No more prop drilling!
}
```

**Benefits:**
- Eliminates prop drilling
- Centralized state management
- Easier testing
- Better developer experience

---

## 6. Error Handling

### Issue: No Error Boundaries or Error States
**Severity:** Medium
**Files Affected:** All pages

**Current State:**
No error handling for:
- Failed data fetches
- Invalid state transitions
- Network errors

**Recommendation:**

```typescript
// src/components/ErrorBoundary.tsx
'use client';

import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h1>
            <p className="text-gray-600 mb-4">{this.state.error?.message}</p>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// src/hooks/useAsync.ts
import { useState, useEffect } from 'react';

export function useAsync<T>(
  asyncFunction: () => Promise<T>,
  immediate = true
) {
  const [status, setStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [value, setValue] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(async () => {
    setStatus('pending');
    setValue(null);
    setError(null);

    try {
      const response = await asyncFunction();
      setValue(response);
      setStatus('success');
    } catch (error) {
      setError(error as Error);
      setStatus('error');
    }
  }, [asyncFunction]);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [execute, immediate]);

  return { execute, status, value, error };
}

// Usage:
function PipelinePage() {
  const { value: artists, status, error } = useAsync(getArtists);

  if (status === 'pending') return <LoadingSpinner />;
  if (status === 'error') return <ErrorMessage error={error} />;
  if (status === 'success' && artists) return <PipelineView artists={artists} />;
}
```

**Benefits:**
- Graceful error handling
- Better user experience
- Easier debugging
- Prevents app crashes

---

## 7. Accessibility (a11y)

### Issue: Missing ARIA Labels and Keyboard Navigation
**Severity:** Medium
**Files Affected:** All interactive components

**Problems:**
- Buttons without accessible labels
- Modals without proper ARIA attributes
- No keyboard shortcuts for common actions
- Poor screen reader support

**Recommendation:**

```typescript
// Add ARIA labels
<button
  type="button"
  onClick={handleViewAllStages}
  aria-label="View all pipeline stages"
  aria-pressed={selectedStage === "all"}
  className="..."
>
  {selectedStage === "all" ? "✓ Viewing All Stages" : "View All Stages"}
</button>

// Modal accessibility
<div
  className="fixed inset-0 bg-black bg-opacity-50 z-50"
  role="dialog"
  aria-modal="true"
  aria-labelledby="modal-title"
  onClick={onClose}
>
  <div className="bg-white rounded-lg" onClick={(e) => e.stopPropagation()}>
    <h2 id="modal-title" className="text-2xl font-bold">
      {artist.name}
    </h2>
    {/* ... */}
  </div>
</div>

// Keyboard navigation
useEffect(() => {
  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && showModal) {
      setShowModal(false);
    }
    if (e.metaKey && e.key === 'k') {
      // Quick search
      e.preventDefault();
      searchInputRef.current?.focus();
    }
  };

  window.addEventListener('keydown', handleKeyPress);
  return () => window.removeEventListener('keydown', handleKeyPress);
}, [showModal]);
```

**Benefits:**
- Compliance with WCAG 2.1
- Better keyboard navigation
- Screen reader compatible
- Improved UX for all users

---

## 8. Testing

### Issue: No Tests
**Severity:** High
**Files Affected:** All

**Recommendation:**
Implement comprehensive testing:

```typescript
// src/__tests__/hooks/usePipelineFilter.test.ts
import { renderHook, act } from '@testing/library/react';
import { usePipelineFilter } from '@/hooks/usePipelineFilter';

describe('usePipelineFilter', () => {
  const mockArtists = [
    { id: 1, stage: 'discovered', priority: 'high', name: 'Artist 1' },
    { id: 2, stage: 'contacted', priority: 'low', name: 'Artist 2' },
  ];

  it('should filter by stage', () => {
    const { result } = renderHook(() => usePipelineFilter(mockArtists, stages));

    act(() => {
      result.current.setSelectedStage('discovered');
    });

    expect(result.current.filteredItems).toHaveLength(1);
    expect(result.current.filteredItems[0].name).toBe('Artist 1');
  });

  it('should reset filters when handleViewAll is called', () => {
    const { result } = renderHook(() => usePipelineFilter(mockArtists, stages));

    act(() => {
      result.current.setSelectedStage('discovered');
      result.current.setSelectedPriority('high');
    });

    act(() => {
      result.current.handleViewAll();
    });

    expect(result.current.selectedStage).toBe('all');
    expect(result.current.selectedPriority).toBe('all');
  });
});

// src/__tests__/components/PipelineOverview.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { PipelineOverview } from '@/components/PipelineOverview';

describe('PipelineOverview', () => {
  it('should render all stages', () => {
    render(<PipelineOverview {...props} />);
    expect(screen.getByText('Discovered')).toBeInTheDocument();
    expect(screen.getByText('Contacted')).toBeInTheDocument();
  });

  it('should call onStageSelect when stage is clicked', () => {
    const mockOnSelect = jest.fn();
    render(<PipelineOverview {...props} onStageSelect={mockOnSelect} />);

    fireEvent.click(screen.getByText('Discovered'));
    expect(mockOnSelect).toHaveBeenCalledWith('discovered');
  });
});
```

**Testing Stack:**
- Jest for unit tests
- React Testing Library for component tests
- Playwright/Cypress for E2E tests

---

## 9. Code Organization

### Issue: Large Component Files
**Severity:** Low-Medium
**Files Affected:** Pipeline pages (500+ lines)

**Recommendation:**
Break down large components:

```
src/
├── app/
│   └── riley/
│       └── pipeline/
│           ├── page.tsx (50 lines - composition only)
│           ├── PipelineOverview.tsx
│           ├── ArtistList.tsx
│           ├── ArtistCard.tsx
│           ├── ArtistModal.tsx
│           └── Filters.tsx
├── components/
│   ├── shared/
│   │   ├── PipelineStageButton.tsx
│   │   ├── StatsCard.tsx
│   │   └── SearchBar.tsx
├── hooks/
│   ├── usePipelineFilter.ts
│   └── useArtistActions.ts
└── types/
    └── pipeline.ts
```

**Benefits:**
- Easier to maintain
- Better testability
- Improved code reuse
- Clearer separation of concerns

---

## 10. Documentation

### Issue: Minimal Code Comments and Documentation
**Severity:** Low
**Files Affected:** All

**Recommendation:**

```typescript
/**
 * Riley Team Pipeline - Artist Acquisition Journey
 *
 * This component manages the complete artist pipeline from discovery to activation.
 *
 * Pipeline Stages:
 * 1. Discovered - New artists identified through various sources
 * 2. Contacted - Initial outreach sent
 * 3. Responded - Artist showed interest
 * 4. Invited - Sent track submission invitation
 * 5. Submitted - Artist submitted a track
 * 6. Approved - Track approved by quality team
 * 7. Activated - Artist is live on the station
 *
 * @see {@link https://docs.truefansradio.com/riley-team} for detailed documentation
 */

/**
 * Filters artists based on selected stage and priority
 * @param artists - Array of artists to filter
 * @param selectedStage - Current stage filter ('all' or specific stage)
 * @param selectedPriority - Current priority filter
 * @returns Filtered array of artists
 */
function filterArtists(/* ... */) { /* ... */ }
```

Add documentation files:
- `docs/ARCHITECTURE.md` - System architecture
- `docs/API.md` - API documentation
- `docs/DEPLOYMENT.md` - Deployment guide
- `docs/CONTRIBUTING.md` - Contribution guidelines

---

## Priority Recommendations

### High Priority (Do First)
1. ✅ **Fix "View All Stages" button** (COMPLETED)
2. **Add database integration** - Replace mock data
3. **Implement error handling** - Add error boundaries
4. **Add basic tests** - Start with critical paths

### Medium Priority (Do Next)
5. **Extract shared components** - Reduce duplication
6. **Improve type safety** - Remove 'any' types
7. **Add state management** - Zustand or Context
8. **Performance optimizations** - Add memoization

### Low Priority (Nice to Have)
9. **Accessibility improvements** - ARIA labels, keyboard nav
10. **Documentation** - Add code comments and guides
11. **Code organization** - Split large files
12. **Advanced testing** - E2E tests, visual regression

---

## Estimated Impact

| Recommendation | Effort | Impact | Priority |
|---------------|--------|--------|----------|
| Database Integration | High | High | 🔴 Critical |
| Error Handling | Medium | High | 🔴 Critical |
| Extract Shared Components | Medium | Medium | 🟡 Important |
| Type Safety | Low | Medium | 🟡 Important |
| Performance Optimization | Low | Medium | 🟡 Important |
| State Management | Medium | Medium | 🟢 Nice to Have |
| Testing | High | High | 🔴 Critical |
| Accessibility | Medium | Medium | 🟡 Important |
| Code Organization | Medium | Low | 🟢 Nice to Have |
| Documentation | Low | Low | 🟢 Nice to Have |

---

## Next Steps

1. **Review this document** with the team
2. **Prioritize recommendations** based on business needs
3. **Create GitHub issues** for each recommendation
4. **Implement in sprints** - Start with high-priority items
5. **Measure impact** - Track improvements

---

## Conclusion

The TrueFans RADIO application has a solid foundation with clear business logic and good UX patterns. By implementing these recommendations, the codebase will become:

- More maintainable
- More scalable
- More performant
- More reliable
- More accessible
- Easier to test
- Better documented

The priority should be on database integration, error handling, and testing to ensure a production-ready application.
