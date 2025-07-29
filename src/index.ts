import { LoadingArea } from "./LoadingArea";
import {
  LoadingAreaConfig,
  LoadingAreas,
  SetLoadingOptions,
  ILoadingManager,
} from "./types";

export class LoadingManager implements ILoadingManager {
  private areas: LoadingAreas = {};

  constructor() {}

  public getAreas(): LoadingAreas {
    return { ...this.areas };
  }

  public addArea(
    areaName: string,
    config: LoadingAreaConfig = {}
  ): LoadingArea {
    if (this.areas[areaName]) {
      throw new Error(`LoadingArea "${areaName}" already exists!`);
    }
    this.areas[areaName] = new LoadingArea(config);
    return this.areas[areaName];
  }

  public removeArea(areaName: string): void {
    if (!this.areas[areaName]) {
      throw new Error(`LoadingArea "${areaName}" not found!`);
    }
    delete this.areas[areaName];
  }
}

// For backward compatibility
export function createLoadingManager() {
  const manager = new LoadingManager();
  return {
    areas: manager.getAreas(),
    createArea: (name: string, config: LoadingAreaConfig) =>
      manager.addArea(name, config),
    getLoadingState: (name: string) => {
      const area = manager.getAreas()[name];
      if (!area) {
        throw new Error(`LoadingArea "${name}" not found!`);
      }
      return area.getLoading();
    },
    setLoadingState: (
      name: string,
      state: boolean,
      options?: SetLoadingOptions
    ) => {
      const area = manager.getAreas()[name];
      if (!area) {
        throw new Error(`LoadingArea "${name}" not found!`);
      }
      area.setLoading(state, options);
    },
  };
}
