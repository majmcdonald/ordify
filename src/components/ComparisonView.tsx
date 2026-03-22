import React from 'react';
import { ComparisonPair, SpotifyTrack } from '../types';
import { ArrowLeft, ArrowUp, Play, Pause, ExternalLink, Volume2, SkipBack, SkipForward } from 'lucide-react';
import { spotifyPlayback, PlaybackState } from '../services/spotifyPlayback';

interface ComparisonViewProps {
  comparison: ComparisonPair;
  progress: { current: number; total: number };
  onChoice: (winner: SpotifyTrack, loser: SpotifyTrack) => void;
  onReset: () => void;
  onUndo?: () => void;
  canUndo?: boolean;
  algorithm?: string;
  sorter?: any;
}

const ComparisonView: React.FC<ComparisonViewProps> = ({ 
  comparison, 
  progress, 
  onChoice, 
  onReset,
  onUndo,
  canUndo,
  algorithm,
  sorter
}) => {
  const [selectedTrack, setSelectedTrack] = React.useState<SpotifyTrack | null>(null);
  const [isAnimating, setIsAnimating] = React.useState(false);
  const [playbackState, setPlaybackState] = React.useState<PlaybackState>({
    isPlaying: false,
    currentTrack: null,
    position: 0,
    duration: 0
  });
  const [isPlaybackInitialized, setIsPlaybackInitialized] = React.useState(false);
  const [focusedCard, setFocusedCard] = React.useState<'left' | 'right'>('left');

  // Initialize playback when component mounts
  React.useEffect(() => {
    const initializePlayback = async () => {
      const token = localStorage.getItem('spotify_access_token');
      if (token && !isPlaybackInitialized) {
        const success = await spotifyPlayback.initialize(token);
        if (success) {
          setIsPlaybackInitialized(true);
          spotifyPlayback.setStateChangeCallback(setPlaybackState);
        }
      }
    };

    initializePlayback();

    // Cleanup on unmount
    return () => {
      if (isPlaybackInitialized) {
        spotifyPlayback.disconnect();
      }
    };
  }, [isPlaybackInitialized]);

  // Handle keyboard navigation
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowUp':
          if (onUndo && canUndo) {
            event.preventDefault();
            onUndo();
          }
          break;
        case 'ArrowLeft':
          setFocusedCard('left');
          break;
        case 'ArrowRight':
          setFocusedCard('right');
          break;
        case 'Enter':
          event.preventDefault();
          if (focusedCard === 'left') {
            handleChoice(comparison.track1, comparison.track2);
          } else {
            handleChoice(comparison.track2, comparison.track1);
          }
          break;
        case ' ':
          event.preventDefault();
          const trackToPlay = focusedCard === 'left' ? comparison.track1 : comparison.track2;
          handlePlayTrack(trackToPlay);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [focusedCard, comparison.track1, comparison.track2, playbackState.currentTrack, playbackState.isPlaying, onUndo, canUndo]);

  const handlePlayTrack = async (track: SpotifyTrack) => {
    if (!isPlaybackInitialized) return;
    
    const trackUri = `spotify:track:${track.id}`;
    await spotifyPlayback.togglePlayPause(trackUri);
  };

  const getEloRating = (track: SpotifyTrack): number | null => {
    if (algorithm === 'elo' && sorter && sorter.getRatings) {
      const ratings = sorter.getRatings();
      return ratings.get(track.id) || 1500;
    }
    return null;
  };

  const handleChoice = (winner: SpotifyTrack, loser: SpotifyTrack) => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    setSelectedTrack(winner);
    
    // Add a small delay for visual feedback
    setTimeout(() => {
      onChoice(winner, loser);
      setIsAnimating(false);
      setSelectedTrack(null);
    }, 300);
  };

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const TrackCard: React.FC<{ 
    track: SpotifyTrack; 
    isWinner?: boolean; 
    onClick: () => void;
    isSelected?: boolean;
    isPlaying?: boolean;
    isFocused?: boolean;
  }> = ({ track, isWinner, onClick, isSelected, isPlaying, isFocused }) => {
    const eloRating = getEloRating(track);
    const trackUri = `spotify:track:${track.id}`;
    const isCurrentlyPlaying = playbackState.currentTrack === trackUri && playbackState.isPlaying;
    
    return (
    <div
      onClick={onClick}
      className={`
        relative bg-spotify-dark rounded-lg p-6 cursor-pointer transition-all duration-300 transform
        ${isSelected 
          ? 'scale-105 border-2 border-spotify-green bg-green-900 bg-opacity-20' 
          : isPlaying
          ? 'border-2 border-spotify-green'
          : isFocused
          ? 'border-2 border-blue-400 shadow-lg shadow-blue-400/20'
          : 'hover:scale-102 border border-gray-700 hover:border-spotify-green'
        }
        ${isAnimating && isSelected ? 'animate-pulse' : ''}
      `}
    >
      {isWinner && (
        <div className="absolute top-4 right-4 bg-spotify-green text-white px-3 py-1 rounded-full text-sm font-semibold">
          Winner!
        </div>
      )}
      
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          {track.album.images && track.album.images.length > 0 ? (
            <img
              src={track.album.images[0].url}
              alt={track.album.name}
              className="w-20 h-20 rounded-lg object-cover"
            />
          ) : (
            <div className="w-20 h-20 bg-gray-600 rounded-lg flex items-center justify-center">
              <Play className="h-8 w-8 text-spotify-light" />
            </div>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xl font-semibold text-white truncate">
              {track.name}
            </h3>
            {eloRating !== null && (
              <div className="flex items-center space-x-1 bg-spotify-green bg-opacity-20 px-2 py-1 rounded text-xs">
                <span className="text-spotify-green font-mono font-semibold">
                  {Math.round(eloRating)}
                </span>
                <span className="text-spotify-green text-xs">ELO</span>
              </div>
            )}
          </div>
          
                      <p className="text-spotify-light mb-1">
            {track.artists.map(artist => artist.name).join(', ')}
          </p>
          
                      <p className="text-spotify-light text-sm mb-3">
            {track.album.name}
          </p>
          
          <div className="flex items-center justify-between">
                          <span className="text-spotify-light text-sm">
              {formatDuration(track.duration_ms)}
            </span>
            
            <div className="flex items-center space-x-2">
              {/* Playback Controls */}
              {isPlaybackInitialized && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePlayTrack(track);
                  }}
                  className="text-spotify-green hover:text-opacity-80 transition-colors p-1"
                  title={isCurrentlyPlaying ? 'Pause' : 'Play'}
                >
                  {isCurrentlyPlaying ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                </button>
              )}
              
              <a
                href={track.external_urls.spotify}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-spotify-green hover:text-opacity-80 transition-colors"
                title="Open in Spotify"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

  const progressPercentage = (progress.current / progress.total) * 100;

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={onReset}
            className="flex items-center space-x-2 text-spotify-light hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Algorithm Selection</span>
          </button>
          
          {canUndo && onUndo && (
            <button
              onClick={onUndo}
              className="flex items-center space-x-2 text-spotify-light hover:text-white transition-colors"
              title="Undo last choice (↑ Arrow Up)"
            >
              <ArrowUp className="h-4 w-4" />
              <span>Undo</span>
            </button>
          )}
        </div>
        
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-2">
            Choose Your Preference
          </h1>
          <p className="text-spotify-light mb-4">
            Which track do you prefer? Click on your choice or use keyboard controls.
          </p>
          
          {/* Progress Bar */}
          <div className="max-w-md mx-auto">
            <div className="flex justify-between text-sm text-spotify-light mb-2">
              <span>Progress</span>
              <span>{progress.current} / {progress.total}</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-spotify-green h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
            <div className="text-center text-spotify-light text-sm mt-2">
              {Math.round(progressPercentage)}% complete
            </div>
          </div>
        </div>
      </div>

      {/* Comparison Cards */}
      <div className="flex items-center justify-center gap-8 mb-8">
        <TrackCard
          track={comparison.track1}
          isWinner={selectedTrack?.id === comparison.track1.id}
          onClick={() => handleChoice(comparison.track1, comparison.track2)}
          isSelected={selectedTrack?.id === comparison.track1.id}
          isPlaying={playbackState.currentTrack === `spotify:track:${comparison.track1.id}` && playbackState.isPlaying}
          isFocused={focusedCard === 'left'}
        />
        
        <div className="text-4xl text-spotify-light font-light">VS</div>
        
        <TrackCard
          track={comparison.track2}
          isWinner={selectedTrack?.id === comparison.track2.id}
          onClick={() => handleChoice(comparison.track2, comparison.track1)}
          isSelected={selectedTrack?.id === comparison.track2.id}
          isPlaying={playbackState.currentTrack === `spotify:track:${comparison.track2.id}` && playbackState.isPlaying}
          isFocused={focusedCard === 'right'}
        />
      </div>

      {/* Instructions */}
      <div className="text-center">
        <div className="bg-spotify-dark rounded-lg p-6 max-w-2xl mx-auto">
          <h3 className="text-lg font-semibold text-white mb-2">
            How to choose
          </h3>
          <p className="text-spotify-light text-sm leading-relaxed mb-4">
            Consider factors like melody, rhythm, mood, or simply which one you enjoy more. 
            There are no wrong answers - just go with your gut feeling!
          </p>
          <div className="text-center text-spotify-light text-xs">
            <p><strong>Keyboard Controls:</strong> ← → Arrow keys to navigate, Enter to select, Space to play/pause, ↑ to undo</p>
            <p><strong>Playback:</strong> Click the play button or press Space to preview tracks</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComparisonView;
