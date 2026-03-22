import { SpotifyPlaylist, SpotifyTrack } from '../types';

const CLIENT_ID = process.env.REACT_APP_SPOTIFY_CLIENT_ID || 'your-client-id-here';
const REDIRECT_URI = process.env.REACT_APP_REDIRECT_URI || 'http://127.0.0.1:3000/callback';
const SCOPES = [
  'playlist-read-private',
  'playlist-read-collaborative',
  'playlist-modify-public',
  'playlist-modify-private',
  'streaming',
  'user-read-email',
  'user-read-private'
];

class SpotifyApiService {
  private accessToken: string | null = null;
  private codeVerifier: string | null = null;

  // Generate PKCE code verifier
  private generateCodeVerifier(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return btoa(Array.from(array, byte => String.fromCharCode(byte)).join(''))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  // Generate PKCE code challenge
  private async generateCodeChallenge(verifier: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return btoa(Array.from(new Uint8Array(digest), byte => String.fromCharCode(byte)).join(''))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  // Initialize Spotify authentication
  async authenticate(): Promise<void> {
    this.codeVerifier = this.generateCodeVerifier();
    const codeChallenge = await this.generateCodeChallenge(this.codeVerifier);
    
    // Store code verifier for later use
    sessionStorage.setItem('code_verifier', this.codeVerifier);
    
    const authUrl = `https://accounts.spotify.com/authorize?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${encodeURIComponent(SCOPES.join(' '))}&code_challenge=${codeChallenge}&code_challenge_method=S256&show_dialog=true`;
    window.location.href = authUrl;
  }

  // Handle authentication callback
  async handleCallback(): Promise<string | null> {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    
    if (code) {
      const codeVerifier = sessionStorage.getItem('code_verifier');
      if (codeVerifier) {
        try {
          const response = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              grant_type: 'authorization_code',
              code: code,
              redirect_uri: REDIRECT_URI,
              client_id: CLIENT_ID,
              code_verifier: codeVerifier,
            }),
          });

          if (response.ok) {
            const data = await response.json();
            this.accessToken = data.access_token;
            localStorage.setItem('spotify_access_token', data.access_token);
            sessionStorage.removeItem('code_verifier'); // Clean up
            return data.access_token;
          }
        } catch (error) {
          console.error('Token exchange failed:', error);
        }
      }
    }
    
    return null;
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    const token = localStorage.getItem('spotify_access_token');
    if (token) {
      this.accessToken = token;
      return true;
    }
    return false;
  }

  // Clear authentication (for logout or token refresh)
  clearAuth(): void {
    this.accessToken = null;
    localStorage.removeItem('spotify_access_token');
  }

  // Get access token
  getAccessToken(): string | null {
    return this.accessToken || localStorage.getItem('spotify_access_token');
  }

  // Logout
  logout(): void {
    this.clearAuth();
  }

  // Make authenticated request to Spotify API
  private async makeRequest(endpoint: string): Promise<any> {
    const token = this.getAccessToken();
    if (!token) {
      throw new Error('No access token available');
    }

    const response = await fetch(`https://api.spotify.com/v1${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Token expired or invalid - clear it
        this.clearAuth();
        throw new Error('Authentication expired. Please log in again.');
      }
      throw new Error(`Spotify API error: ${response.status}`);
    }

    return response.json();
  }

  // Get user's playlists
  async getPlaylists(): Promise<SpotifyPlaylist[]> {
    const playlists: SpotifyPlaylist[] = [];
    let offset = 0;
    const limit = 50;

    while (true) {
      const data = await this.makeRequest(`/me/playlists?limit=${limit}&offset=${offset}`);
      
      playlists.push(...data.items);

      if (data.items.length < limit) {
        break;
      }

      offset += limit;
    }

    return playlists;
  }

  // Get playlist with tracks
  async getPlaylist(playlistId: string): Promise<SpotifyPlaylist> {
    const data = await this.makeRequest(`/playlists/${playlistId}`);
    return data;
  }

  // Get all tracks from a playlist
  async getPlaylistTracks(playlistId: string): Promise<SpotifyTrack[]> {
    const tracks: SpotifyTrack[] = [];
    let offset = 0;
    const limit = 100;

    while (true) {
      const data = await this.makeRequest(`/playlists/${playlistId}/tracks?limit=${limit}&offset=${offset}`);
      
      const playlistTracks = data.items
        .map((item: any) => item.track)
        .filter((track: SpotifyTrack) => track !== null); // Filter out null tracks

      tracks.push(...playlistTracks);

      if (data.items.length < limit) {
        break;
      }

      offset += limit;
    }

    return tracks;
  }

  // Create a new playlist
  async createPlaylist(name: string, description: string, trackUris: string[]): Promise<string> {
    const token = this.getAccessToken();
    if (!token) {
      throw new Error('No access token available');
    }

    // First, get user ID
    const userData = await this.makeRequest('/me');
    const userId = userData.id;

    // Create playlist
    const createResponse = await fetch(`https://api.spotify.com/v1/users/${userId}/playlists`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        description,
        public: false,
      }),
    });

    if (!createResponse.ok) {
      throw new Error(`Failed to create playlist: ${createResponse.status}`);
    }

    const playlist = await createResponse.json();

    // Add tracks to playlist (in batches of 100)
    const batchSize = 100;
    for (let i = 0; i < trackUris.length; i += batchSize) {
      const batch = trackUris.slice(i, i + batchSize);
      
      const addResponse = await fetch(`https://api.spotify.com/v1/playlists/${playlist.id}/tracks`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uris: batch,
        }),
      });

      if (!addResponse.ok) {
        throw new Error(`Failed to add tracks to playlist: ${addResponse.status}`);
      }
    }

    return playlist.id;
  }
}

export const spotifyApi = new SpotifyApiService();
