import React, { useState } from 'react';
import { SpotifyPlaylist } from '../types';
import { RefreshCw, Search, Music } from 'lucide-react';

interface PlaylistSelectorProps {
  playlists: SpotifyPlaylist[];
  onPlaylistSelect: (playlist: SpotifyPlaylist) => void;
  onRefresh: () => void;
}

const PlaylistSelector: React.FC<PlaylistSelectorProps> = ({ 
  playlists, 
  onPlaylistSelect, 
  onRefresh 
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPlaylists = playlists.filter(playlist =>
    playlist.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    playlist.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatTrackCount = (count: number) => {
    if (count === 1) return '1 track';
    return `${count} tracks`;
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          Choose a Playlist
        </h1>
        <p className="text-spotify-light">
          Select a playlist to start organizing through pairwise comparisons
        </p>
      </div>

      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-spotify-light" />
          <input
            type="text"
            placeholder="Search playlists..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-spotify-dark border border-gray-600 rounded-lg text-white placeholder-spotify-light focus:outline-none focus:border-spotify-green"
          />
        </div>
        
        <button
          onClick={onRefresh}
          className="flex items-center space-x-2 bg-spotify-dark hover:bg-gray-700 text-white px-4 py-3 rounded-lg transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Refresh</span>
        </button>
      </div>

      {filteredPlaylists.length === 0 ? (
        <div className="text-center py-12">
          <Music className="h-16 w-16 text-spotify-light mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">
            {searchTerm ? 'No playlists found' : 'No playlists available'}
          </h3>
          <p className="text-spotify-light">
            {searchTerm 
              ? 'Try adjusting your search terms' 
              : 'Make sure you have playlists in your Spotify account'
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPlaylists.map((playlist) => (
            <div
              key={playlist.id}
              onClick={() => onPlaylistSelect(playlist)}
              className="bg-spotify-dark hover:bg-gray-700 rounded-lg p-6 cursor-pointer transition-all duration-200 transform hover:scale-105 border border-gray-700 hover:border-spotify-green"
            >
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  {playlist.images && playlist.images.length > 0 ? (
                    <img
                      src={playlist.images[0].url}
                      alt={playlist.name}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gray-600 rounded-lg flex items-center justify-center">
                      <Music className="h-8 w-8 text-spotify-light" />
                    </div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-white truncate">
                    {playlist.name}
                  </h3>
                  
                  {playlist.description && (
                    <p className="text-spotify-light text-sm mt-1 line-clamp-2">
                      {playlist.description}
                    </p>
                  )}
                  
                  <div className="mt-3 text-spotify-light text-sm">
                    {formatTrackCount(playlist.tracks.total)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 text-center text-spotify-light text-sm">
        <p>
          Showing {filteredPlaylists.length} of {playlists.length} playlists
        </p>
      </div>
    </div>
  );
};

export default PlaylistSelector;
