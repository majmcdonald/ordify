import { SpotifyTrack, ComparisonPair, SortState, SortingAlgorithm } from '../types';

// Generate all possible comparison pairs for n tracks
export function generateComparisonPairs(tracks: SpotifyTrack[]): ComparisonPair[] {
  const pairs: ComparisonPair[] = [];
  
  for (let i = 0; i < tracks.length; i++) {
    for (let j = i + 1; j < tracks.length; j++) {
      pairs.push({
        track1: tracks[i],
        track2: tracks[j]
      });
    }
  }
  
  // Shuffle pairs to avoid bias
  return shuffleArray(pairs);
}

// Generate tournament sort comparisons for complete ordering
export function generateTournamentComparisons(tracks: SpotifyTrack[]): ComparisonPair[] {
  const pairs: ComparisonPair[] = [];
  const n = tracks.length;
  
  // Tournament sort for complete ordering:
  // 1. Find 1st place: n-1 comparisons
  // 2. Find 2nd place: n-2 comparisons  
  // 3. Find 3rd place: n-3 comparisons
  // ...and so on
  // Total: (n-1) + (n-2) + ... + 1 = n(n-1)/2 comparisons
  
  // This is equivalent to generating all pairwise comparisons
  for (let i = 0; i < n - 1; i++) {
    for (let j = i + 1; j < n; j++) {
      pairs.push({
        track1: tracks[i],
        track2: tracks[j]
      });
    }
  }
  
  return shuffleArray(pairs);
}

// Generate quick sort style comparisons
export function generateQuickSortComparisons(tracks: SpotifyTrack[]): ComparisonPair[] {
  const pairs: ComparisonPair[] = [];
  
  // Quick sort typically uses n*log(n) comparisons on average
  // But can use up to n² in worst case
  const n = tracks.length;
  const targetComparisons = Math.ceil(n * Math.log2(n));
  
  // Generate comparisons in a way that mimics quick sort partitioning
  // Compare each element with a "pivot" (first element)
  for (let i = 1; i < n; i++) {
    pairs.push({
      track1: tracks[0], // pivot
      track2: tracks[i]
    });
  }
  
  // Add some additional comparisons to reach the target
  while (pairs.length < targetComparisons && pairs.length < (n * (n - 1)) / 2) {
    const i = Math.floor(Math.random() * n);
    const j = Math.floor(Math.random() * n);
    if (i !== j) {
      const pair = {
        track1: tracks[Math.min(i, j)],
        track2: tracks[Math.max(i, j)]
      };
      
      // Check if this pair already exists
      const exists = pairs.some(p => 
        (p.track1.id === pair.track1.id && p.track2.id === pair.track2.id) ||
        (p.track1.id === pair.track2.id && p.track2.id === pair.track1.id)
      );
      
      if (!exists) {
        pairs.push(pair);
      }
    }
  }
  
  return shuffleArray(pairs);
}

// Fisher-Yates shuffle algorithm
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Tournament Sort implementation for pairwise comparisons
export class TournamentSorter {
  private tracks: SpotifyTrack[];
  private comparisons: ComparisonPair[];
  private currentComparisonIndex: number = 0;
  private trackScores: Map<string, number> = new Map();
  private history: Array<{
    comparisonIndex: number;
    trackScores: Map<string, number>;
  }> = [];

  constructor(tracks: SpotifyTrack[]) {
    this.tracks = [...tracks];
    this.comparisons = generateTournamentComparisons(tracks);
    
    // Initialize scores
    tracks.forEach(track => {
      this.trackScores.set(track.id, 0);
    });
  }

  getCurrentComparison(): ComparisonPair | null {
    if (this.currentComparisonIndex >= this.comparisons.length) {
      return null;
    }
    return this.comparisons[this.currentComparisonIndex];
  }

  makeChoice(winner: SpotifyTrack, loser: SpotifyTrack): void {
    const currentPair = this.getCurrentComparison();
    if (!currentPair) return;

    // Save current state to history before making changes
    this.saveToHistory();

    // Update scores based on the comparison
    const winnerScore = this.trackScores.get(winner.id) || 0;
    const loserScore = this.trackScores.get(loser.id) || 0;
    
    this.trackScores.set(winner.id, winnerScore + 1);
    this.trackScores.set(loser.id, loserScore);

    this.currentComparisonIndex++;
  }

  private saveToHistory(): void {
    this.history.push({
      comparisonIndex: this.currentComparisonIndex,
      trackScores: new Map(this.trackScores)
    });
  }

  canUndo(): boolean {
    return this.history.length > 0;
  }

  undo(): boolean {
    if (!this.canUndo()) return false;

    const previousState = this.history.pop();
    if (previousState) {
      this.currentComparisonIndex = previousState.comparisonIndex;
      this.trackScores = new Map(previousState.trackScores);
      return true;
    }
    return false;
  }

  getProgress(): { current: number; total: number } {
    return {
      current: this.currentComparisonIndex,
      total: this.comparisons.length
    };
  }

  isComplete(): boolean {
    return this.currentComparisonIndex >= this.comparisons.length;
  }

  getSortedTracks(): SpotifyTrack[] {
    if (!this.isComplete()) {
      return [];
    }

    // Sort tracks based on their scores (higher score = better rank)
    return [...this.tracks].sort((a, b) => {
      const scoreA = this.trackScores.get(a.id) || 0;
      const scoreB = this.trackScores.get(b.id) || 0;
      return scoreB - scoreA; // Descending order (highest score first)
    });
  }
}

// Quick Sort implementation for pairwise comparisons
export class QuickSortSorter {
  private tracks: SpotifyTrack[];
  private comparisons: ComparisonPair[];
  private currentComparisonIndex: number = 0;
  private trackScores: Map<string, number> = new Map();
  private history: Array<{
    comparisonIndex: number;
    trackScores: Map<string, number>;
  }> = [];

  constructor(tracks: SpotifyTrack[]) {
    this.tracks = [...tracks];
    this.comparisons = generateQuickSortComparisons(tracks);
    
    // Initialize scores
    tracks.forEach(track => {
      this.trackScores.set(track.id, 0);
    });
  }

  getCurrentComparison(): ComparisonPair | null {
    if (this.currentComparisonIndex >= this.comparisons.length) {
      return null;
    }
    return this.comparisons[this.currentComparisonIndex];
  }

  makeChoice(winner: SpotifyTrack, loser: SpotifyTrack): void {
    const currentPair = this.getCurrentComparison();
    if (!currentPair) return;

    // Save current state to history before making changes
    this.saveToHistory();

    // Update scores based on the comparison
    const winnerScore = this.trackScores.get(winner.id) || 0;
    const loserScore = this.trackScores.get(loser.id) || 0;
    
    this.trackScores.set(winner.id, winnerScore + 1);
    this.trackScores.set(loser.id, loserScore);

    this.currentComparisonIndex++;
  }

  private saveToHistory(): void {
    this.history.push({
      comparisonIndex: this.currentComparisonIndex,
      trackScores: new Map(this.trackScores)
    });
  }

  canUndo(): boolean {
    return this.history.length > 0;
  }

  undo(): boolean {
    if (!this.canUndo()) return false;

    const previousState = this.history.pop();
    if (previousState) {
      this.currentComparisonIndex = previousState.comparisonIndex;
      this.trackScores = new Map(previousState.trackScores);
      return true;
    }
    return false;
  }

  getProgress(): { current: number; total: number } {
    return {
      current: this.currentComparisonIndex,
      total: this.comparisons.length
    };
  }

  isComplete(): boolean {
    return this.currentComparisonIndex >= this.comparisons.length;
  }

  getSortedTracks(): SpotifyTrack[] {
    if (!this.isComplete()) {
      return [];
    }

    // Sort tracks based on their scores (higher score = better rank)
    return [...this.tracks].sort((a, b) => {
      const scoreA = this.trackScores.get(a.id) || 0;
      const scoreB = this.trackScores.get(b.id) || 0;
      return scoreB - scoreA; // Descending order (highest score first)
    });
  }
}

// Elo Rating System implementation
export class EloSorter {
  private tracks: SpotifyTrack[];
  private comparisons: ComparisonPair[];
  private currentComparisonIndex: number = 0;
  private ratings: Map<string, number> = new Map();
  private K_FACTOR = 32; // K-factor determines how much ratings change
  private history: Array<{
    comparisonIndex: number;
    ratings: Map<string, number>;
  }> = [];

  constructor(tracks: SpotifyTrack[]) {
    this.tracks = [...tracks];
    this.comparisons = generateComparisonPairs(tracks);
    
    // Initialize all tracks with 1500 rating
    tracks.forEach(track => {
      this.ratings.set(track.id, 1500);
    });
  }

  getCurrentComparison(): ComparisonPair | null {
    if (this.currentComparisonIndex >= this.comparisons.length) {
      return null;
    }
    return this.comparisons[this.currentComparisonIndex];
  }

  makeChoice(winner: SpotifyTrack, loser: SpotifyTrack): void {
    const currentPair = this.getCurrentComparison();
    if (!currentPair) return;

    // Save current state to history before making changes
    this.saveToHistory();

    const winnerId = winner.id;
    const loserId = loser.id;

    const winnerRating = this.ratings.get(winnerId) || 1500;
    const loserRating = this.ratings.get(loserId) || 1500;

    // Calculate expected scores
    const expectedWinner = 1 / (1 + Math.pow(10, (loserRating - winnerRating) / 400));
    const expectedLoser = 1 / (1 + Math.pow(10, (winnerRating - loserRating) / 400));

    // Update ratings
    const newWinnerRating = winnerRating + this.K_FACTOR * (1 - expectedWinner);
    const newLoserRating = loserRating + this.K_FACTOR * (0 - expectedLoser);

    this.ratings.set(winnerId, newWinnerRating);
    this.ratings.set(loserId, newLoserRating);

    this.currentComparisonIndex++;
  }

  private saveToHistory(): void {
    this.history.push({
      comparisonIndex: this.currentComparisonIndex,
      ratings: new Map(this.ratings)
    });
  }

  canUndo(): boolean {
    return this.history.length > 0;
  }

  undo(): boolean {
    if (!this.canUndo()) return false;

    const previousState = this.history.pop();
    if (previousState) {
      this.currentComparisonIndex = previousState.comparisonIndex;
      this.ratings = new Map(previousState.ratings);
      return true;
    }
    return false;
  }

  getProgress(): { current: number; total: number } {
    return {
      current: this.currentComparisonIndex,
      total: this.comparisons.length
    };
  }

  isComplete(): boolean {
    return this.currentComparisonIndex >= this.comparisons.length;
  }

  getSortedTracks(): SpotifyTrack[] {
    if (!this.isComplete()) {
      return [];
    }

    // Sort tracks based on their Elo ratings
    return [...this.tracks].sort((a, b) => {
      const ratingA = this.ratings.get(a.id) || 1500;
      const ratingB = this.ratings.get(b.id) || 1500;
      return ratingB - ratingA; // Descending order (highest rating first)
    });
  }

  getRatings(): Map<string, number> {
    return new Map(this.ratings);
  }
}

// Factory function to create sorter based on algorithm
export function createSorter(algorithm: SortingAlgorithm, tracks: SpotifyTrack[]) {
  switch (algorithm) {
    case 'tournament':
      return new TournamentSorter(tracks);
    case 'quick':
      return new QuickSortSorter(tracks);
    case 'elo':
      return new EloSorter(tracks);
    default:
      throw new Error(`Unknown sorting algorithm: ${algorithm}`);
  }
}
