# area-loading

Library for control loading state

## Use example

```typescript
const isLoading$ = new BehaviorSubject<boolean>(false);

const manager = new LoadingManager();
const area = manager.addArea("area-name");

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
