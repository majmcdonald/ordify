import { AppState, SpotifyPlaylist, SortingAlgorithm } from '../types';

export interface SavedState {
  selectedPlaylist: SpotifyPlaylist | null;
  sortState: {
    algorithm: SortingAlgorithm;
    tracks: any[];
    currentComparisonIndex: number;
    results: Record<string, number>;
    isComplete: boolean;
  } | null;
  timestamp: number;
}

export class StatePersistenceService {
  private static readonly STORAGE_KEY = 'ordify-saved-state';
  private static readonly MAX_AGE_HOURS = 24; // State expires after 24 hours

  static saveState(appState: AppState): void {
    if (!appState.selectedPlaylist) {
      return; // Don't save if no playlist is selected
    }

    const savedState: SavedState = {
      selectedPlaylist: appState.selectedPlaylist,
      sortState: appState.sortState ? {
        algorithm: appState.sortState.algorithm,
        tracks: appState.sortState.tracks,
        currentComparisonIndex: appState.sortState.currentComparisonIndex,
        results: Object.fromEntries(appState.sortState.results),
        isComplete: appState.sortState.isComplete
      } : null,
      timestamp: Date.now()
    };

    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(savedState));
    } catch (error) {
      console.error('Failed to save state:', error);
    }
  }

  static loadState(): SavedState | null {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (!saved) return null;

      const savedState: SavedState = JSON.parse(saved);
      
      // Check if state is expired
      const ageHours = (Date.now() - savedState.timestamp) / (1000 * 60 * 60);
      if (ageHours > this.MAX_AGE_HOURS) {
        this.clearState();
        return null;
      }

      return savedState;
    } catch (error) {
      console.error('Failed to load state:', error);
      return null;
    }
  }

  static clearState(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear state:', error);
    }
  }

  static hasSavedState(): boolean {
    return this.loadState() !== null;
  }

  static isInProgress(): boolean {
    const state = this.loadState();
    return state !== null && 
           state.sortState !== null && 
           !state.sortState.isComplete && 
           state.sortState.currentComparisonIndex > 0;
  }
}

