import { createLoadingManager } from "../src";
import { LoadingAreaConfig } from "../src/types";
import { LoadingArea } from "./LoadingArea";

describe("LoadingManager", () => {
  const TEST_AREA_NAME = "testArea";
  const TEST_CONFIG = {
    minLoadingTimeMs: 1000,
    initialLoadingState: false,
    debounceTimeMs: 0,
  } as const;

  let loadingManager: ReturnType<typeof createLoadingManager>;

  beforeEach(() => {
    loadingManager = createLoadingManager();
    loadingManager.createArea(TEST_AREA_NAME, TEST_CONFIG);
  });

  it("should initialize with correct state", () => {
    const { getLoadingState } = loadingManager;

    expect(getLoadingState(TEST_AREA_NAME)).toBe(false);
  });

  it("should set loading state correctly (without min time)", () => {
    const { setLoadingState, getLoadingState } = loadingManager;

    setLoadingState(TEST_AREA_NAME, true);
    expect(getLoadingState(TEST_AREA_NAME)).toBe(true);
  });

  it("should enforce minimum loading time", (done) => {
    const { setLoadingState, getLoadingState } = loadingManager;

    setLoadingState(TEST_AREA_NAME, true);
    setLoadingState(TEST_AREA_NAME, false);

    expect(getLoadingState(TEST_AREA_NAME)).toBe(true);

    setTimeout(() => {
      expect(getLoadingState(TEST_AREA_NAME)).toBe(false);
      done();
    }, TEST_CONFIG.minLoadingTimeMs + 100);
  });
});
describe("LoadingManager (Iteration 2)", () => {
  const TEST_AREA_NAME = "testArea";
  const TEST_CONFIG: LoadingAreaConfig = {
    minLoadingTimeMs: 1000,
    debounceTimeMs: 300,
    initialLoadingState: false,
  };

  let loadingManager: ReturnType<typeof createLoadingManager>;

  beforeEach(() => {
    loadingManager = createLoadingManager();
    loadingManager.createArea(TEST_AREA_NAME, TEST_CONFIG);
  });
  it("should apply debounce", (done) => {
    const { setLoadingState, getLoadingState } = loadingManager;

    const startTime = Date.now();
    setLoadingState(TEST_AREA_NAME, true);

    setTimeout(() => {
      setLoadingState(TEST_AREA_NAME, false);

      setTimeout(() => {
        expect(getLoadingState(TEST_AREA_NAME)).toBe(true);
      }, 200);

      setTimeout(() => {
        expect(getLoadingState(TEST_AREA_NAME)).toBe(true);
      }, 400);

      setTimeout(() => {
        try {
          expect(getLoadingState(TEST_AREA_NAME)).toBe(false);
          done();
        } catch (error) {
          done(error);
        }
      }, 1100);
    }, 100);
  });

  it("should force state change", () => {
    const { setLoadingState, getLoadingState } = loadingManager;

    setLoadingState(TEST_AREA_NAME, true);
    setLoadingState(TEST_AREA_NAME, false, { force: true });
    expect(getLoadingState(TEST_AREA_NAME)).toBe(false);
  });
});

describe("LoadingArea segments behavior", () => {
  const BASE_CONFIG = {
    minLoadingTimeMs: 100,
    debounceTimeMs: 50,
    initialLoadingState: false,
  } as const;

  let parentArea: LoadingArea;
  let child1: LoadingArea;
  let child2: LoadingArea;

  beforeEach(() => {
    jest.useFakeTimers();
    parentArea = new LoadingArea(BASE_CONFIG);
    child1 = parentArea.addArea("child1");
    child2 = parentArea.addArea("child2");
  });
  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllTimers();
  });

  it("should become true when any segment becomes true (from all false)", (done) => {
    expect(parentArea.getLoading()).toBe(false);

    child1.setLoading(true);
    expect(parentArea.getLoading()).toBe(true);
    done();
  });

  it("should become false when all segments become false (from true)", (done) => {
    child1.setLoading(true);
    expect(parentArea.getLoading()).toBe(true);

    child1.setLoading(false);
    jest.advanceTimersByTime(
      BASE_CONFIG.debounceTimeMs + BASE_CONFIG.minLoadingTimeMs + 10
    );
    expect(parentArea.getLoading()).toBe(false);
    done();
  });

  it("should not change state when some segments change but not all become false", (done) => {
    child1.setLoading(true);
    expect(parentArea.getLoading()).toBe(true);

    child2.setLoading(true);
    expect(parentArea.getLoading()).toBe(true);

    child1.setLoading(false);
    jest.advanceTimersByTime(BASE_CONFIG.debounceTimeMs + 10);
    expect(parentArea.getLoading()).toBe(true); // child2 still loading
    done();
  });

  it("should apply debounce when all segments become false", (done) => {
    child1.setLoading(true);
    child2.setLoading(true);
    expect(parentArea.getLoading()).toBe(true);

    const startTime = Date.now();
    child1.setLoading(false);
    child2.setLoading(false);

    jest.advanceTimersByTime(BASE_CONFIG.debounceTimeMs - 10);
    expect(parentArea.getLoading()).toBe(true);

    jest.advanceTimersByTime(BASE_CONFIG.debounceTimeMs + 10);
    expect(parentArea.getLoading()).toBe(true);

    jest.advanceTimersByTime(
      BASE_CONFIG.debounceTimeMs + BASE_CONFIG.minLoadingTimeMs + 1000
    );
    expect(parentArea.getLoading()).toBe(false);
    done();
  });

  it("should force state change in all segments", () => {
    child1.setLoading(true);
    child2.setLoading(true);
    expect(parentArea.getLoading()).toBe(true);
    expect(child1.getLoading()).toBe(true);
    expect(child2.getLoading()).toBe(true);

    parentArea.setLoading(false, { force: true });
    expect(parentArea.getLoading()).toBe(false);
    expect(child1.getLoading()).toBe(false);
    expect(child2.getLoading()).toBe(false);
  });

  it("should handle segment removal correctly", (done) => {
    const child3 = parentArea.addArea("child3");
    child1.setLoading(true);
    child3.setLoading(true);
    expect(parentArea.getLoading()).toBe(true);

    parentArea.removeArea("child3");
    expect(parentArea.getLoading()).toBe(true); // child1 still loading

    child1.setLoading(false);

    jest.advanceTimersByTime(
      BASE_CONFIG.debounceTimeMs + BASE_CONFIG.minLoadingTimeMs + 10
    );
    expect(parentArea.getLoading()).toBe(false);
    done();
  });

  it("should notify listeners on segment state changes", (done) => {
    const mockListener = jest.fn();
    const unsubscribe = parentArea.onEmit(mockListener);

    // Initial call
    expect(mockListener).toHaveBeenCalledTimes(0);

    child1.setLoading(true);
    expect(mockListener).toHaveBeenCalledTimes(1);
    expect(mockListener).toHaveBeenLastCalledWith(true);

    child1.setLoading(false);

    jest.advanceTimersByTime(
      BASE_CONFIG.debounceTimeMs + BASE_CONFIG.minLoadingTimeMs + 10
    );
    expect(mockListener).toHaveBeenCalledTimes(2);
    expect(mockListener).toHaveBeenLastCalledWith(false);
    unsubscribe.removeListener();
    done();
  });

  it("should maintain state when new segments are added", () => {
    child1.setLoading(true);
    expect(parentArea.getLoading()).toBe(true);

    const child3 = parentArea.addArea("child3");
    expect(parentArea.getLoading()).toBe(true);

    child3.setLoading(true);
    expect(parentArea.getLoading()).toBe(true);
  });
});
