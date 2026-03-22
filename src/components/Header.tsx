import React from 'react';
import { LogOut, Music } from 'lucide-react';

interface HeaderProps {
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ onLogout }) => {
  return (
    <header className="bg-spotify-dark border-b border-gray-700">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Music className="h-8 w-8 text-spotify-green" />
            <h1 className="text-2xl font-bold text-white">Ordify</h1>
            <span className="text-spotify-light text-sm">Order Your Playlists</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={onLogout}
              className="flex items-center space-x-2 bg-spotify-dark hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
