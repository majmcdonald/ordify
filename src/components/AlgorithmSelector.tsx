import React from 'react';
import { SortingAlgorithm } from '../types';
import { ArrowLeft, TrendingUp, Target, Zap } from 'lucide-react';

interface AlgorithmSelectorProps {
  onAlgorithmSelect: (algorithm: SortingAlgorithm) => void;
  onBack: () => void;
  playlistSize: number;
}

const AlgorithmSelector: React.FC<AlgorithmSelectorProps> = ({ 
  onAlgorithmSelect, 
  onBack,
  playlistSize
}) => {
  // Calculate comparison estimates for each algorithm
  const calculateComparisons = (algorithm: string): { estimate: string; bigO: string; scenario: string } => {
    const n = playlistSize;
    
    switch (algorithm) {
      case 'tournament':
        // Tournament sort: n(n-1)/2 comparisons for complete ordering
        const tournamentComparisons = Math.floor((n * (n - 1)) / 2);
        return {
          estimate: `~${tournamentComparisons}`,
          bigO: 'O(n²)',
          scenario: 'Complete ordering'
        };
      case 'quick':
        // Quick sort: approximately n*log2(n) comparisons on average
        const quickEstimate = Math.ceil(n * Math.log2(n));
        return {
          estimate: `~${quickEstimate}`,
          bigO: 'O(n log n)',
          scenario: 'Average case'
        };
      case 'elo':
        // Elo: adaptive system that uses fewer comparisons for large datasets
        // For small datasets: similar to other algorithms
        // For large datasets: much more efficient due to convergence
        let eloEstimate;
        if (n <= 50) {
          eloEstimate = Math.ceil(n * Math.log2(n) * 1.1);
        } else if (n <= 200) {
          eloEstimate = Math.ceil(n * Math.log2(n) * 0.8);
        } else {
          // For very large playlists, Elo becomes much more efficient
          eloEstimate = Math.ceil(n * Math.log2(n) * 0.4);
        }
        return {
          estimate: `~${eloEstimate}`,
          bigO: 'O(n log n)',
          scenario: 'Adaptive (converges)'
        };
      default:
        return {
          estimate: '0',
          bigO: 'O(1)',
          scenario: 'N/A'
        };
    }
  };

  const algorithms = [
    {
      id: 'tournament' as SortingAlgorithm,
      name: 'Tournament Sort',
      description: 'Efficient algorithm that finds the best track, then the second best, and so on. Like a sports tournament bracket.',
      icon: TrendingUp,
      recommendedSize: '5-50 tracks',
      pros: ['Most efficient for small playlists', 'Intuitive tournament-style', 'Fastest for typical playlist sizes'],
      cons: ['Not optimal for very large playlists', 'Fixed comparison order']
    },

    {
      id: 'quick' as SortingAlgorithm,
      name: 'Quick Sort',
      description: 'Fast divide-and-conquer algorithm that partitions tracks around a pivot element.',
      icon: Zap,
      recommendedSize: '10-200 tracks',
      pros: ['Very fast on average', 'Good cache performance', 'Efficient for medium to large playlists'],
      cons: ['Performance can vary', 'Not stable (order may change)']
    },
    {
      id: 'elo' as SortingAlgorithm,
      name: 'Elo Rating System',
      description: 'Adaptive rating system that becomes more efficient with larger playlists. Ratings converge to stable values.',
      icon: Target,
      recommendedSize: '200+ tracks',
      pros: ['Most efficient for large playlists', 'Adaptive ratings', 'Handles ties well', 'Converges to stable order'],
      cons: ['More complex scoring', 'Results may vary between sessions']
    }
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-spotify-light hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Playlists</span>
        </button>
      </div>

      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          Choose Sorting Algorithm
        </h1>
        <p className="text-spotify-light">
          Select how you want to sort your playlist through pairwise comparisons
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {algorithms.map((algorithm) => {
          const IconComponent = algorithm.icon;
          
          return (
            <div
              key={algorithm.id}
              onClick={() => onAlgorithmSelect(algorithm.id)}
              className="bg-spotify-dark hover:bg-gray-700 rounded-lg p-6 cursor-pointer transition-all duration-200 transform hover:scale-105 border border-gray-700 hover:border-spotify-green"
            >
              <div className="flex items-center space-x-4 mb-4">
                <div className="bg-spotify-green p-3 rounded-lg">
                  <IconComponent className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white">
                    {algorithm.name}
                  </h3>
                </div>
              </div>

              <p className="text-spotify-light mb-4">
                {algorithm.description}
              </p>

              <div className="bg-gray-800 rounded-lg p-3 mb-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-spotify-light">Recommended for:</span>
                  <span className="text-spotify-green font-semibold">{algorithm.recommendedSize}</span>
                </div>
                <div className="flex justify-between items-center text-sm mt-1">
                  <span className="text-spotify-light">Comparisons:</span>
                  <span className="text-blue-400 font-mono">{calculateComparisons(algorithm.id).estimate}</span>
                </div>
                <div className="flex justify-between items-center text-sm mt-1">
                  <span className="text-spotify-light">Complexity:</span>
                  <span className="text-purple-400 font-mono">{calculateComparisons(algorithm.id).bigO}</span>
                </div>
                <div className="flex justify-between items-center text-sm mt-1">
                  <span className="text-spotify-light">Scenario:</span>
                  <span className="text-yellow-400 text-xs">{calculateComparisons(algorithm.id).scenario}</span>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="text-white font-semibold mb-2 flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                    Advantages
                  </h4>
                  <ul className="text-sm text-spotify-light space-y-1">
                    {algorithm.pros.map((pro, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-green-400 mr-2">•</span>
                        {pro}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="text-white font-semibold mb-2 flex items-center">
                    <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                    Considerations
                  </h4>
                  <ul className="text-sm text-spotify-light space-y-1">
                    {algorithm.cons.map((con, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-yellow-400 mr-2">•</span>
                        {con}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-600">
                <button className="w-full bg-spotify-green hover:bg-opacity-80 text-white font-semibold py-3 px-4 rounded-lg transition-colors">
                  Use {algorithm.name}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 text-center">
        <div className="bg-spotify-dark rounded-lg p-6 max-w-2xl mx-auto">
          <h3 className="text-lg font-semibold text-white mb-2">
            How it works
          </h3>
          <p className="text-spotify-light text-sm leading-relaxed">
            You'll be presented with pairs of tracks from your playlist. Simply choose which one you prefer. 
            The algorithm will use your choices to determine the optimal order for your entire playlist. 
            The more comparisons you make, the more accurate the final order will be.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AlgorithmSelector;
