import React, { useState } from 'react';
import { SpotifyTrack, SpotifyPlaylist } from '../types';
import { spotifyApi } from '../services/spotifyApi';
import { ArrowLeft, Download, ExternalLink, Check, Copy, Music } from 'lucide-react';

interface ResultsViewProps {
  sortedTracks: SpotifyTrack[];
  originalPlaylist: SpotifyPlaylist;
  onReset: () => void;
}

const ResultsView: React.FC<ResultsViewProps> = ({ 
  sortedTracks, 
  originalPlaylist, 
  onReset 
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getTotalDuration = () => {
    return sortedTracks.reduce((total, track) => total + track.duration_ms, 0);
  };

  const exportToSpotify = async () => {
    setIsExporting(true);
    setExportError(null);
    
    try {
      const trackUris = sortedTracks.map(track => `spotify:track:${track.id}`);
      const playlistName = `${originalPlaylist.name} - Ordered`;
      const description = `Reordered version of "${originalPlaylist.name}" using Ordify`;
      
      const playlistId = await spotifyApi.createPlaylist(playlistName, description, trackUris);
      setExportSuccess(true);
      
      // Open the new playlist in Spotify
      setTimeout(() => {
        window.open(`https://open.spotify.com/playlist/${playlistId}`, '_blank');
      }, 1000);
      
    } catch (error) {
      setExportError('Failed to export playlist to Spotify. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const exportToCSV = () => {
    const csvContent = [
      'Position,Title,Artist,Album,Duration,Spotify URL',
      ...sortedTracks.map((track, index) => [
        index + 1,
        `"${track.name}"`,
        `"${track.artists.map(artist => artist.name).join(', ')}"`,
        `"${track.album.name}"`,
        formatDuration(track.duration_ms),
        track.external_urls.spotify
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${originalPlaylist.name}-ordered.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const exportToJSON = () => {
    const jsonContent = {
      playlistName: originalPlaylist.name,
      orderedAt: new Date().toISOString(),
      tracks: sortedTracks.map((track, index) => ({
        position: index + 1,
        id: track.id,
        name: track.name,
        artists: track.artists,
        album: track.album,
        duration_ms: track.duration_ms,
        external_url: track.external_urls.spotify
      }))
    };

    const blob = new Blob([JSON.stringify(jsonContent, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${originalPlaylist.name}-ordered.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const copyToClipboard = async () => {
    const playlistText = sortedTracks.map((track, index) => 
      `${index + 1}. ${track.name} - ${track.artists.map(artist => artist.name).join(', ')}`
    ).join('\n');

    try {
      await navigator.clipboard.writeText(playlistText);
      setCopiedToClipboard(true);
      setTimeout(() => setCopiedToClipboard(false), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={onReset}
          className="flex items-center space-x-2 text-spotify-light hover:text-white transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Start Over</span>
        </button>
        
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-2">
            Your Ordered Playlist
          </h1>
          <p className="text-spotify-light">
            Here's your perfectly ordered version of "{originalPlaylist.name}"
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-spotify-dark rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-white">{sortedTracks.length}</div>
          <div className="text-spotify-light text-sm">Tracks</div>
        </div>
        <div className="bg-spotify-dark rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-white">{formatDuration(getTotalDuration())}</div>
          <div className="text-spotify-light text-sm">Total Duration</div>
        </div>
        <div className="bg-spotify-dark rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-white">{originalPlaylist.tracks.total}</div>
          <div className="text-spotify-light text-sm">Original Tracks</div>
        </div>
      </div>

      {/* Export Options */}
      <div className="bg-spotify-dark rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold text-white mb-4">Export Options</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={exportToSpotify}
            disabled={isExporting}
            className="flex items-center justify-center space-x-2 bg-spotify-green hover:bg-opacity-80 disabled:opacity-50 text-white px-4 py-3 rounded-lg transition-colors"
          >
            {isExporting ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : exportSuccess ? (
              <Check className="h-4 w-4" />
            ) : (
              <Music className="h-4 w-4" />
            )}
            <span>{exportSuccess ? 'Exported!' : 'Export to Spotify'}</span>
          </button>

          <button
            onClick={exportToCSV}
            className="flex items-center justify-center space-x-2 bg-spotify-dark hover:bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>Download CSV</span>
          </button>

          <button
            onClick={exportToJSON}
            className="flex items-center justify-center space-x-2 bg-spotify-dark hover:bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>Download JSON</span>
          </button>

          <button
            onClick={copyToClipboard}
            className="flex items-center justify-center space-x-2 bg-spotify-dark hover:bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 transition-colors"
          >
            {copiedToClipboard ? (
              <Check className="h-4 w-4 text-green-400" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
            <span>{copiedToClipboard ? 'Copied!' : 'Copy List'}</span>
          </button>
        </div>

        {exportError && (
          <div className="mt-4 text-red-400 text-sm">{exportError}</div>
        )}
      </div>

      {/* Track List */}
      <div className="bg-spotify-dark rounded-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Ordered Tracks</h2>
        
        <div className="space-y-3">
          {sortedTracks.map((track, index) => (
            <div
              key={track.id}
              className="flex items-center space-x-4 p-4 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
            >
              <div className="flex-shrink-0 w-8 text-center">
                <span className="text-spotify-green font-bold">{index + 1}</span>
              </div>
              
              <div className="flex-shrink-0">
                {track.album.images && track.album.images.length > 0 ? (
                  <img
                    src={track.album.images[0].url}
                    alt={track.album.name}
                    className="w-12 h-12 rounded object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 bg-gray-600 rounded flex items-center justify-center">
                    <Music className="h-6 w-6 text-spotify-light" />
                  </div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-semibold truncate">{track.name}</h3>
                <p className="text-spotify-light text-sm truncate">
                  {track.artists.map(artist => artist.name).join(', ')}
                </p>
              </div>
              
              <div className="flex-shrink-0 text-spotify-light text-sm">
                {formatDuration(track.duration_ms)}
              </div>
              
              <div className="flex-shrink-0">
                <a
                  href={track.external_urls.spotify}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-spotify-green hover:text-opacity-80 transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ResultsView;
