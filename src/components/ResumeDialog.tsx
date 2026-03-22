import React from 'react';
import { SavedState } from '../services/statePersistence';
import { Play, RotateCcw, Music } from 'lucide-react';

interface ResumeDialogProps {
  savedState: SavedState;
  onResume: () => void;
  onStartOver: () => void;
}

const ResumeDialog: React.FC<ResumeDialogProps> = ({ savedState, onResume, onStartOver }) => {
  const formatProgress = () => {
    if (!savedState.sortState) return '';
    
    const { currentComparisonIndex, tracks } = savedState.sortState;
    const totalComparisons = tracks.length * (tracks.length - 1) / 2; // n choose 2
    const percentage = Math.round((currentComparisonIndex / totalComparisons) * 100);
    
    return `${currentComparisonIndex} / ${totalComparisons} comparisons (${percentage}%)`;
  };

  const formatTimeAgo = (timestamp: number) => {
    const now = Date.now();
    const diffMs = now - timestamp;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else if (diffMinutes > 0) {
      return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-spotify-dark rounded-lg p-8 max-w-md mx-4 shadow-xl">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center mb-4">
            <Music className="h-12 w-12 text-spotify-green" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Continue Previous Session?
          </h2>
          <p className="text-spotify-light">
            We found an unfinished playlist ranking session.
          </p>
        </div>

        <div className="bg-gray-800 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-white mb-2">
            {savedState.selectedPlaylist?.name}
          </h3>
          <p className="text-spotify-light text-sm mb-2">
            Algorithm: {savedState.sortState?.algorithm || 'Unknown'}
          </p>
          <p className="text-spotify-light text-sm mb-2">
            Progress: {formatProgress()}
          </p>
          <p className="text-spotify-light text-sm">
            Last active: {formatTimeAgo(savedState.timestamp)}
          </p>
        </div>

        <div className="flex flex-col space-y-3">
          <button
            onClick={onResume}
            className="flex items-center justify-center space-x-2 bg-spotify-green hover:bg-opacity-80 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
          >
            <Play className="h-4 w-4" />
            <span>Continue Where I Left Off</span>
          </button>
          
          <button
            onClick={onStartOver}
            className="flex items-center justify-center space-x-2 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Start Over</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResumeDialog;
