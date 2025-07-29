import { LoadingArea } from "./LoadingArea";

export type LoadingAreaConfig = {
  minLoadingTimeMs?: number; // Минимальное время загрузки (чтобы исключить моргание)
  debounceTimeMs?: number; // Задержка перед изменением состояния (новое поле)
  initialLoadingState?: boolean;
};

export type LoadingAreas = Record<string, LoadingArea>;

export type SetLoadingOptions = {
  force?: boolean; // Если true, игнорирует minLoadingTimeMs и debounceTimeMs
};

export interface ILoadingManager {
  getAreas(): LoadingAreas;
  addArea(areaName: string, config?: LoadingAreaConfig): LoadingArea;
  removeArea(areaName: string): void;
}
