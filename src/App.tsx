import React, { useState, useEffect } from 'react';
import { spotifyApi } from './services/spotifyApi';
import { AppState, SpotifyPlaylist, SortingAlgorithm, SpotifyTrack } from './types';
import { createSorter } from './utils/sortingAlgorithms';
import { ThemeProvider } from './contexts/ThemeContext';
import { StatePersistenceService } from './services/statePersistence';
import LoginScreen from './components/LoginScreen';
import PlaylistSelector from './components/PlaylistSelector';
import AlgorithmSelector from './components/AlgorithmSelector';
import ComparisonView from './components/ComparisonView';
import ResultsView from './components/ResultsView';
import ResumeDialog from './components/ResumeDialog';
import Header from './components/Header';

function App() {
  const [appState, setAppState] = useState<AppState>({
    isAuthenticated: false,
    playlists: [],
    selectedPlaylist: null,
    sortState: null,
    isLoading: false,
    error: null,
  });

  const [sorter, setSorter] = useState<any>(null);
  const [sorterState, setSorterState] = useState(0); // Force re-renders when sorter state changes
  const [showResumeDialog, setShowResumeDialog] = useState(false);
  const [savedState, setSavedState] = useState<any>(null);

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = await spotifyApi.handleCallback();
      if (token || spotifyApi.isAuthenticated()) {
        setAppState(prev => ({ ...prev, isAuthenticated: true }));
        await loadPlaylists();
        
        // Check for saved state after loading playlists
        if (StatePersistenceService.isInProgress()) {
          const saved = StatePersistenceService.loadState();
          if (saved) {
            setSavedState(saved);
            setShowResumeDialog(true);
          }
        }
      }
    };
    checkAuth();
  }, []);

  const loadPlaylists = async () => {
    setAppState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const playlists = await spotifyApi.getPlaylists();
      setAppState(prev => ({ 
        ...prev, 
        playlists, 
        isLoading: false 
      }));
    } catch (error) {
      setAppState(prev => ({ 
        ...prev, 
        error: 'Failed to load playlists', 
        isLoading: false 
      }));
    }
  };

  const handleLogin = async () => {
    await spotifyApi.authenticate();
  };

  const handleLogout = () => {
    spotifyApi.logout();
    setAppState({
      isAuthenticated: false,
      playlists: [],
      selectedPlaylist: null,
      sortState: null,
      isLoading: false,
      error: null,
    });
    setSorter(null);
  };

  const handlePlaylistSelect = async (playlist: SpotifyPlaylist) => {
    setAppState(prev => ({ 
      ...prev, 
      selectedPlaylist: playlist,
      isLoading: true,
      error: null 
    }));

    try {
      await spotifyApi.getPlaylistTracks(playlist.id);
      setAppState(prev => ({ 
        ...prev, 
        isLoading: false 
      }));
    } catch (error) {
      setAppState(prev => ({ 
        ...prev, 
        error: 'Failed to load playlist tracks', 
        isLoading: false 
      }));
    }
  };

  const handleAlgorithmSelect = (algorithm: SortingAlgorithm) => {
    if (!appState.selectedPlaylist) return;

    // Create sorter instance
    const newSorter = createSorter(algorithm, []);
    setSorter(newSorter);

    setAppState(prev => ({
      ...prev,
      sortState: {
        algorithm,
        tracks: [],
        comparisons: [],
        currentComparisonIndex: 0,
        results: new Map(),
        isComplete: false,
      }
    }));
  };

  const handleStartSorting = async () => {
    if (!appState.selectedPlaylist || !sorter) return;

    setAppState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const tracks = await spotifyApi.getPlaylistTracks(appState.selectedPlaylist.id);
      
      // Recreate sorter with actual tracks
      const newSorter = createSorter(appState.sortState!.algorithm, tracks);
      setSorter(newSorter);

      setAppState(prev => ({
        ...prev,
        sortState: {
          ...prev.sortState!,
          tracks,
          comparisons: [],
          currentComparisonIndex: 0,
          results: new Map(),
          isComplete: false,
        },
        isLoading: false
      }));
    } catch (error) {
      setAppState(prev => ({ 
        ...prev, 
        error: 'Failed to load tracks', 
        isLoading: false 
      }));
    }
  };

  const handleComparisonChoice = (winner: any, loser: any) => {
    if (!sorter) return;

    sorter.makeChoice(winner, loser);
    
    // Force re-render by updating sorter state
    setSorterState(prev => prev + 1);
    
    if (sorter.isComplete()) {
      const sortedTracks = sorter.getSortedTracks() as SpotifyTrack[];
      setAppState(prev => ({
        ...prev,
        sortState: {
          ...prev.sortState!,
          isComplete: true,
          results: new Map(sortedTracks.map((track: SpotifyTrack, index: number) => [track.id, index + 1]))
        }
      }));
      
      // Clear saved state when complete
      StatePersistenceService.clearState();
    } else {
      // Update progress and save state
      setAppState(prev => ({
        ...prev,
        sortState: prev.sortState ? {
          ...prev.sortState,
          currentComparisonIndex: sorter.getProgress().current
        } : null
      }));
      
      // Save state after each comparison
      setTimeout(() => {
        StatePersistenceService.saveState(appState);
      }, 0);
    }
  };

  const handleUndo = () => {
    if (!sorter || !sorter.canUndo || !sorter.canUndo()) return;

    const success = sorter.undo();
    if (success) {
      // Force re-render by updating sorter state
      setSorterState(prev => prev + 1);
      
      // Update progress and save state
      setAppState(prev => ({
        ...prev,
        sortState: prev.sortState ? {
          ...prev.sortState,
          currentComparisonIndex: sorter.getProgress().current
        } : null
      }));
      
      // Save state after undo
      setTimeout(() => {
        StatePersistenceService.saveState(appState);
      }, 0);
    }
  };

  const handleReset = () => {
    setAppState(prev => ({
      ...prev,
      selectedPlaylist: null,
      sortState: null,
    }));
    setSorter(null);
    StatePersistenceService.clearState();
  };

  const handleResume = () => {
    if (!savedState) return;
    
    setAppState(prev => ({
      ...prev,
      selectedPlaylist: savedState.selectedPlaylist,
      sortState: savedState.sortState ? {
        ...savedState.sortState,
        results: new Map(Object.entries(savedState.sortState.results))
      } : null
    }));
    
    if (savedState.sortState) {
      const newSorter = createSorter(savedState.sortState.algorithm, savedState.sortState.tracks);
      // Restore the sorter's internal state
      for (let i = 0; i < savedState.sortState.currentComparisonIndex; i++) {
        const comparison = newSorter.getCurrentComparison();
        if (comparison) {
          // We need to restore the choice that was made
          // For now, we'll just advance the index
          newSorter.makeChoice(comparison.track1, comparison.track2);
        }
      }
      setSorter(newSorter);
    }
    
    setShowResumeDialog(false);
    setSavedState(null);
  };

  const handleStartOver = () => {
    StatePersistenceService.clearState();
    setShowResumeDialog(false);
    setSavedState(null);
  };

  const handleBackToAlgorithmSelection = () => {
    setAppState(prev => ({
      ...prev,
      sortState: null,
    }));
    setSorter(null);
  };

  const renderCurrentView = () => {
    if (!appState.isAuthenticated) {
      return <LoginScreen onLogin={handleLogin} />;
    }

    if (appState.isLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-spotify-green"></div>
        </div>
      );
    }

    if (appState.error) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="text-red-500 text-xl mb-4">{appState.error}</div>
            <button 
              onClick={loadPlaylists}
              className="bg-spotify-green text-white px-6 py-2 rounded-lg hover:bg-opacity-80"
            >
              Retry
            </button>
          </div>
        </div>
      );
    }

    if (appState.sortState?.isComplete) {
      return (
        <ResultsView 
          sortedTracks={sorter?.getSortedTracks() || []}
          originalPlaylist={appState.selectedPlaylist!}
          onReset={handleReset}
        />
      );
    }

    if (sorter && appState.sortState) {
      // Use sorterState to force re-renders
      const currentComparison = sorter.getCurrentComparison();
      if (currentComparison) {
        return (
          <ComparisonView 
            key={sorterState} // Force re-render when sorter state changes
            comparison={currentComparison}
            progress={sorter.getProgress()}
            onChoice={handleComparisonChoice}
            onReset={handleBackToAlgorithmSelection}
            onUndo={handleUndo}
            canUndo={sorter.canUndo ? sorter.canUndo() : false}
            algorithm={appState.sortState?.algorithm}
            sorter={sorter}
          />
        );
      } else {
        return (
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <h2 className="text-2xl mb-4">Ready to Start Sorting!</h2>
              <button 
                onClick={handleStartSorting}
                className="bg-spotify-green text-white px-6 py-3 rounded-lg hover:bg-opacity-80"
              >
                Start Sorting
              </button>
            </div>
          </div>
        );
      }
    }

    if (appState.selectedPlaylist) {
      return (
        <AlgorithmSelector 
          onAlgorithmSelect={handleAlgorithmSelect}
          onBack={() => setAppState(prev => ({ ...prev, selectedPlaylist: null }))}
          playlistSize={appState.selectedPlaylist.tracks.total}
        />
      );
    }

    return (
      <PlaylistSelector 
        playlists={appState.playlists}
        onPlaylistSelect={handlePlaylistSelect}
        onRefresh={loadPlaylists}
      />
    );
  };

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-spotify-black text-white">
        {appState.isAuthenticated && (
          <Header onLogout={handleLogout} />
        )}
        <main className="container mx-auto px-4 py-8">
          {renderCurrentView()}
        </main>
        
        {/* Resume Dialog */}
        {showResumeDialog && savedState && (
          <ResumeDialog
            savedState={savedState}
            onResume={handleResume}
            onStartOver={handleStartOver}
          />
        )}
      </div>
    </ThemeProvider>
  );
}

export default App;
