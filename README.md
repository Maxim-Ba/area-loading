# Area Loading

[![npm version](https://badge.fury.io/js/area-loading.svg)](https://badge.fury.io/js/area-loading)

A lightweight library for managing loading states in different areas of your application.

## Installation

```bash
npm install area-loading
# or
yarn add area-loading

```

## Usage

```typescript
const isLoading$ = new BehaviorSubject<boolean>(false);

const manager = new LoadingManager();
const area = manager.addArea("area-name", {
  initialLoadingState: isLoading$.value,
});

const loadingStateListener = area.onEmit((state) => {
  isLoading$.next(state);
});

area.patchConfig({
  minLoadingTimeMs: 1000,
  debounceTimeMs: 100,
});

const child1 = area.addArea("child1-area-name");
const child2 = area.addArea("child2-area-name");
child2.setLoading(true);
child1.setLoading(true);
//...
child1.setLoading(false);
child2.setLoading(false);

loadingStateListener.removeListener();
```
