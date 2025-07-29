import { LoadingAreaConfig, LoadingAreas, SetLoadingOptions } from "./types";

export class LoadingArea {
  private isLoading: boolean;
  private config: LoadingAreaConfig;
  private loadingStartTime: number | null = null;
  private debounceTimeout: number | null = null;
  private minLoadingTimeout: number | null = null;
  private listeners: Array<(state: boolean) => void> = [];
  private segmentListeners: Map<string, { removeListener: () => void }> =
    new Map();

  private segments: LoadingAreas = {};

  constructor(config: LoadingAreaConfig) {
    this.config = config;
    this.isLoading = !!config.initialLoadingState;
  }

  public addArea(areaName: string, config = this.config): LoadingArea {
    if (this.segments[areaName]) {
      throw new Error(`Segment "${areaName}" already exists!`);
    }
    this.segments[areaName] = new LoadingArea(config);

    const listener = this.segments[areaName].onEmit(() => {
      this.handleSegmentStateChange();
    });
    this.segmentListeners.set(areaName, listener);

    return this.segments[areaName];
  }

  private handleSegmentStateChange(): void {
    const segmentsStates = Object.values(this.segments).map((s) =>
      s.getLoading()
    );
    const allSegmentsFalse = segmentsStates.every((s) => !s);
    const anySegmentTrue = segmentsStates.some((s) => s);

    if (anySegmentTrue) {
      this.setLoading(true);
      return;
    }

    if (this.loadingStartTime === null && allSegmentsFalse) {
      this.isLoading = false;

      return;
    }
    if (allSegmentsFalse) {
      this.scheduleLoadingEnd();

      return;
    }
  }

  public patchConfig(config: Partial<LoadingAreaConfig>): void {
    this.config = { ...this.config, ...config };

    Object.values(this.segments).forEach((segment) => {
      segment.patchConfig(this.config);
    });
  }
  public setLoading(state: boolean, options?: SetLoadingOptions): void {
    if (options?.force) {
      this.cancelPendingUpdates();
      this.loadingStartTime = null;

      Object.values(this.segments).forEach((segment) => {
        segment.setLoading(state, options);
      });

      this.isLoading = state;

      this.notifyListeners();
      return;
    }

    if (state) {
      this.cancelPendingUpdates();
      this.isLoading = true;
      this.loadingStartTime = Date.now();
      this.notifyListeners();
    } else {
      this.scheduleLoadingEnd();
    }
  }

  private scheduleLoadingEnd(): void {
    this.cancelPendingUpdates();

    this.debounceTimeout = setTimeout(() => {
      const elapsed = Date.now() - (this.loadingStartTime || 0);
      const remaining = Math.max(
        0,
        (this.config.minLoadingTimeMs || 0) - elapsed
      );

      if (remaining > 0) {
        this.minLoadingTimeout = setTimeout(() => {
          this.updateLoadingState();
        }, remaining);
      } else {
        this.updateLoadingState();
      }
    }, this.config.debounceTimeMs || 0);
  }

  private updateLoadingState(): void {
    const allSegmentsNotLoading = Object.values(this.segments).every(
      (segment) => !segment.getLoading()
    );

    if (allSegmentsNotLoading) {
      this.isLoading = false;
      this.notifyListeners();
    }
  }

  private cancelPendingUpdates(): void {
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
      this.debounceTimeout = null;
    }
    if (this.minLoadingTimeout) {
      clearTimeout(this.minLoadingTimeout);
      this.minLoadingTimeout = null;
    }
  }

  public getLoading(): boolean {
    if (Object.keys(this.segments).length === 0) {
      return this.isLoading;
    }

    return (
      this.isLoading ||
      Object.values(this.segments).some((segment) => segment.getLoading())
    );
  }

  public onEmit(callback: (state: boolean) => void): {
    removeListener: () => void;
  } {
    this.listeners.push(callback);

    return {
      removeListener: () => {
        this.listeners = this.listeners.filter(
          (listener) => listener !== callback
        );
      },
    };
  }

  private notifyListeners(): void {
    const currentState = this.getLoading();
    this.listeners.forEach((listener) => listener(currentState));
  }

  public removeArea(areaName: string): void {
    if (!this.segments[areaName]) {
      throw new Error(`Segment "${areaName}" not found!`);
    }

    const listener = this.segmentListeners.get(areaName);
    if (listener) {
      listener.removeListener();
      this.segmentListeners.delete(areaName);
    }

    delete this.segments[areaName];

    this.handleSegmentStateChange();
  }
}
