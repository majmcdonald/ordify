# Ordify - Spotify Playlist Ordering App

Ordify is a web application that helps you order your Spotify playlists through pairwise comparisons. Instead of manually dragging and dropping tracks, you simply choose between two tracks at a time, and the app uses sophisticated algorithms to determine the optimal order for your entire playlist.

## Features

- **Spotify Integration**: Seamless authentication and playlist access
- **Two Sorting Algorithms**:
  - **Merge Sort**: Classic comparison-based algorithm, great for smaller playlists
  - **Elo Rating System**: Chess-like rating system, efficient for larger playlists
- **Beautiful UI**: Modern, responsive design with Spotify-inspired theming
- **Multiple Export Options**:
  - Export directly to Spotify as a new playlist
  - Download as CSV or JSON
  - Copy to clipboard
- **Progress Tracking**: Visual progress indicators during the sorting process
- **Responsive Design**: Works on desktop, tablet, and mobile devices

## How It Works

1. **Import**: Connect your Spotify account and select a playlist
2. **Choose Algorithm**: Select between Merge Sort or Elo Rating System
3. **Compare**: Make pairwise comparisons between tracks
4. **Order**: Get your perfectly ordered playlist
5. **Export**: Save the result to Spotify or download in various formats

## Prerequisites

- Node.js (version 14 or higher)
- npm or yarn
- A Spotify account
- Spotify Developer App (for API access)

## Setup

### 1. Create a Spotify Developer App

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Log in with your Spotify account
3. Click "Create App"
4. Fill in the app details:
   - App name: "Ordify" (or any name you prefer)
   - App description: "A web app for ordering Spotify playlists"
   - Redirect URI: `https://localhost:3000/callback`
   - Website: `https://localhost:3000`
5. Save the app and note your **Client ID**

### 2. Clone and Install

```bash
# Clone the repository
git clone <repository-url>
cd ordify

# Install dependencies
npm install
```

### 3. Environment Configuration

Create a `.env` file in the root directory:

```env
REACT_APP_SPOTIFY_CLIENT_ID=your_spotify_client_id_here
REACT_APP_REDIRECT_URI=https://localhost:3000/callback
```

Replace `your_spotify_client_id_here` with the Client ID from your Spotify Developer App.

### 4. Start the Development Server

```bash
npm start
```

The app will open at `https://localhost:3000` (note: HTTPS is required for Spotify integration)

## Usage

### First Time Setup

1. Open the app in your browser
2. Click "Connect with Spotify"
3. Authorize the app to access your playlists
4. You'll be redirected back to the app

### Ordering a Playlist

1. **Select Playlist**: Choose from your available playlists
2. **Choose Algorithm**:
   - **Merge Sort**: Best for playlists with 50 or fewer tracks
   - **Elo Rating**: Better for larger playlists, more efficient
3. **Start Sorting**: Click "Start Sorting" to begin
4. **Make Comparisons**: For each pair, click on your preferred track
5. **View Results**: See your ordered playlist with export options

### Export Options

- **Spotify**: Creates a new playlist in your Spotify account
- **CSV**: Downloads a spreadsheet with track information
- **JSON**: Downloads structured data for programmatic use
- **Copy**: Copies the track list to your clipboard

## Algorithm Details

### Merge Sort
- Uses a traditional comparison-based sorting approach
- Each comparison directly affects the final order
- Predictable and intuitive results
- Best for smaller playlists (under 50 tracks)

### Elo Rating System
- Inspired by chess rating systems
- Tracks gain or lose points based on comparisons
- More efficient for larger playlists
- Handles ties and edge cases well
- Results may vary slightly between sessions

## Technical Stack

- **Frontend**: React 18 with TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **API**: Spotify Web API
- **Build Tool**: Create React App

## Project Structure

```
src/
├── components/          # React components
│   ├── LoginScreen.tsx
│   ├── PlaylistSelector.tsx
│   ├── AlgorithmSelector.tsx
│   ├── ComparisonView.tsx
│   ├── ResultsView.tsx
│   └── Header.tsx
├── services/           # API services
│   └── spotifyApi.ts
├── utils/             # Utility functions
│   └── sortingAlgorithms.ts
├── types/             # TypeScript interfaces
│   └── index.ts
├── App.tsx            # Main app component
├── index.tsx          # App entry point
└── index.css          # Global styles
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Troubleshooting

### Common Issues

**"Failed to load playlists"**
- Check that your Spotify account has playlists
- Verify your Client ID is correct
- Ensure the redirect URI matches exactly

**"No access token available"**
- Try logging out and logging back in
- Clear your browser's local storage
- Check that the Spotify app has the correct redirect URI

**"Failed to export playlist"**
- Ensure you have permission to create playlists
- Check your internet connection
- Try refreshing the page and exporting again

### Getting Help

If you encounter any issues:
1. Check the browser console for error messages
2. Verify your Spotify Developer App settings
3. Ensure all environment variables are set correctly
4. Try clearing your browser cache and local storage

## Future Enhancements

- [ ] Support for collaborative playlists
- [ ] Batch comparison mode
- [ ] Custom sorting criteria
- [ ] Playlist templates
- [ ] Advanced analytics
- [ ] Mobile app version
- [ ] Integration with other music services

---

Made with ❤️ for music lovers everywhere
