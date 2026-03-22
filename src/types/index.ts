export interface SpotifyTrack {
  id: string;
  name: string;
  artists: Array<{
    id: string;
    name: string;
  }>;
  album: {
    id: string;
    name: string;
    images: Array<{
      url: string;
      height: number;
      width: number;
    }>;
  };
  duration_ms: number;
  external_urls: {
    spotify: string;
  };
}

export interface SpotifyPlaylist {
  id: string;
  name: string;
  description: string;
  images: Array<{
    url: string;
    height: number;
    width: number;
  }>;
  tracks: {
    items: Array<{
      track: SpotifyTrack;
    }>;
    total: number;
  };
}

export interface ComparisonPair {
  track1: SpotifyTrack;
  track2: SpotifyTrack;
}

export type SortingAlgorithm = 'tournament' | 'quick' | 'elo';

export interface SortState {
  algorithm: SortingAlgorithm;
  tracks: SpotifyTrack[];
  comparisons: ComparisonPair[];
  currentComparisonIndex: number;
  results: Map<string, number>; // trackId -> score/position
  isComplete: boolean;
}

export interface AppState {
  isAuthenticated: boolean;
  playlists: SpotifyPlaylist[];
  selectedPlaylist: SpotifyPlaylist | null;
  sortState: SortState | null;
  isLoading: boolean;
  error: string | null;
}
