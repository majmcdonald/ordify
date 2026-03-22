// Spotify Web Playback SDK types
declare global {
  interface Window {
    onSpotifyWebPlaybackSDKReady: () => void;
    Spotify: {
      Player: new (config: SpotifyPlayerConfig) => SpotifyPlayer;
    };
  }
}

interface SpotifyPlayerConfig {
  name: string;
  getOAuthToken: (callback: (token: string) => void) => void;
}

interface SpotifyPlayer {
  addListener(event: string, callback: (data: any) => void): void;
  connect(): Promise<boolean>;
  disconnect(): void;
  getCurrentState(): Promise<any>;
  setName(name: string): Promise<void>;
}

interface SpotifyPlayerState {
  paused: boolean;
  position: number;
  duration: number;
  track_window: {
    current_track: {
      uri: string;
    };
  };
}

export interface PlaybackState {
  isPlaying: boolean;
  currentTrack: string | null;
  position: number;
  duration: number;
}

class SpotifyPlaybackService {
  private player: SpotifyPlayer | null = null;
  private deviceId: string | null = null;
  private accessToken: string | null = null;
  private onStateChange: ((state: PlaybackState) => void) | null = null;
  private currentState: any = null;

  async initialize(token: string): Promise<boolean> {
    this.accessToken = token;
    
    return new Promise((resolve) => {
      // Load the Spotify Web Playback SDK
      const script = document.createElement('script');
      script.src = 'https://sdk.scdn.co/spotify-player.js';
      script.async = true;
      
      document.body.appendChild(script);
      
      window.onSpotifyWebPlaybackSDKReady = () => {
        this.player = new window.Spotify.Player({
          name: 'Ordify Web Player',
          getOAuthToken: cb => { cb(token); }
        });

        // Error handling
        this.player.addListener('initialization_error', ({ message }: any) => {
          console.error('Failed to initialize:', message);
          resolve(false);
        });

        this.player.addListener('authentication_error', ({ message }: any) => {
          console.error('Failed to authenticate:', message);
          resolve(false);
        });

        this.player.addListener('account_error', ({ message }: any) => {
          console.error('Failed to validate Spotify account:', message);
          resolve(false);
        });

        this.player.addListener('playback_error', ({ message }: any) => {
          console.error('Failed to perform playback:', message);
        });

        // Playback status updates
        this.player.addListener('player_state_changed', (state: SpotifyPlayerState) => {
          this.currentState = state;
          if (this.onStateChange) {
            this.onStateChange({
              isPlaying: !state?.paused,
              currentTrack: state?.track_window?.current_track?.uri || null,
              position: state?.position || 0,
              duration: state?.duration || 0
            });
          }
        });

        // Ready
        this.player.addListener('ready', ({ device_id }: any) => {
          console.log('Ready with Device ID', device_id);
          this.deviceId = device_id;
          resolve(true);
        });

        // Not Ready
        this.player.addListener('not_ready', ({ device_id }: any) => {
          console.log('Device ID has gone offline', device_id);
        });

        // Connect to the player
        this.player.connect();
      };
    });
  }

  async playTrack(trackUri: string): Promise<boolean> {
    if (!this.deviceId || !this.accessToken) {
      console.error('Player not initialized');
      return false;
    }

    try {
      const response = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${this.deviceId}`, {
        method: 'PUT',
        body: JSON.stringify({ uris: [trackUri] }),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.accessToken}`
        },
      });

      if (response.ok) {
        return true;
      } else {
        console.error('Failed to play track:', response.statusText);
        return false;
      }
    } catch (error) {
      console.error('Error playing track:', error);
      return false;
    }
  }

  async pause(): Promise<boolean> {
    if (!this.deviceId || !this.accessToken) {
      return false;
    }

    try {
      const response = await fetch(`https://api.spotify.com/v1/me/player/pause?device_id=${this.deviceId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        },
      });

      return response.ok;
    } catch (error) {
      console.error('Error pausing playback:', error);
      return false;
    }
  }

  async resume(): Promise<boolean> {
    if (!this.deviceId || !this.accessToken) {
      return false;
    }

    try {
      const response = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${this.deviceId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        },
      });

      return response.ok;
    } catch (error) {
      console.error('Error resuming playback:', error);
      return false;
    }
  }

  async togglePlayPause(trackUri?: string): Promise<boolean> {
    if (!this.player || !this.deviceId || !this.accessToken) {
      return false;
    }

    try {
      // Use the Web Playback SDK's current state instead of making API calls
      const state = this.currentState;
      const isCurrentlyPlaying = state && !state.paused;
      const currentTrackUri = state?.track_window?.current_track?.uri;

      console.log('Current state from SDK:', {
        isCurrentlyPlaying,
        currentTrackUri,
        requestedTrackUri: trackUri,
        state: state
      });

      // If the same track is currently playing, pause it
      if (isCurrentlyPlaying && currentTrackUri === trackUri) {
        console.log('Pausing current track');
        return await this.pause();
      }
      // If the same track is paused, resume it
      else if (!isCurrentlyPlaying && currentTrackUri === trackUri) {
        console.log('Resuming current track');
        return await this.resume();
      }
      // If a different track is playing or nothing is playing, start the requested track
      else if (trackUri) {
        console.log('Starting new track');
        return await this.playTrack(trackUri);
      }

      return false;
    } catch (error) {
      console.error('Error toggling play/pause:', error);
      // Fallback: if there's an error, just play the track
      if (trackUri) {
        return await this.playTrack(trackUri);
      }
      return false;
    }
  }

  async seekTo(position: number): Promise<boolean> {
    if (!this.deviceId || !this.accessToken) {
      return false;
    }

    try {
      const response = await fetch(`https://api.spotify.com/v1/me/player/seek?position_ms=${position}&device_id=${this.deviceId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        },
      });

      return response.ok;
    } catch (error) {
      console.error('Error seeking:', error);
      return false;
    }
  }

  setStateChangeCallback(callback: (state: PlaybackState) => void) {
    this.onStateChange = callback;
  }

  isInitialized(): boolean {
    return this.player !== null && this.deviceId !== null;
  }

  disconnect() {
    if (this.player) {
      this.player.disconnect();
      this.player = null;
      this.deviceId = null;
    }
  }
}

export const spotifyPlayback = new SpotifyPlaybackService();
