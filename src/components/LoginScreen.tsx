import React from 'react';
import { Music, Play } from 'lucide-react';

interface LoginScreenProps {
  onLogin: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-spotify-black to-gray-900">
      <div className="max-w-md w-full mx-4">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <div className="bg-spotify-green p-4 rounded-full">
              <Music className="h-12 w-12 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Ordify</h1>
          <p className="text-spotify-light text-lg">
            Order your Spotify playlists through pairwise comparisons
          </p>
        </div>

        <div className="bg-spotify-dark rounded-lg p-8 shadow-xl">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-semibold text-white mb-2">
              Welcome to Ordify
            </h2>
            <p className="text-spotify-light">
              Connect your Spotify account to start organizing your playlists
            </p>
          </div>

          <button
            onClick={onLogin}
            className="w-full bg-spotify-green hover:bg-opacity-80 text-white font-semibold py-4 px-6 rounded-lg flex items-center justify-center space-x-3 transition-all duration-200 transform hover:scale-105"
          >
            <Play className="h-5 w-5" />
            <span>Connect with Spotify</span>
          </button>

          <div className="mt-6 text-center">
            <p className="text-sm text-spotify-light">
              We'll need access to your playlists to help you organize them
            </p>
          </div>
        </div>

        <div className="mt-8 text-center">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-spotify-light">
            <div className="bg-spotify-dark p-4 rounded-lg">
              <div className="font-semibold text-white mb-1">1. Import</div>
              <div>Connect your Spotify account</div>
            </div>
            <div className="bg-spotify-dark p-4 rounded-lg">
              <div className="font-semibold text-white mb-1">2. Compare</div>
              <div>Choose between track pairs</div>
            </div>
            <div className="bg-spotify-dark p-4 rounded-lg">
              <div className="font-semibold text-white mb-1">3. Order</div>
              <div>Get your perfectly ordered playlist</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
