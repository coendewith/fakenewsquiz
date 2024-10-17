import React, { useEffect, useState } from 'react';
import { fetchLeaderboard } from '../services/leaderboardService';
import TagSelector from './TagSelector';

function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState('');

  const getLeaderboard = async (subject) => {
    setLoading(true);
    try {
      const data = await fetchLeaderboard(10, subject); // Fetch top 10 scores
      setLeaderboard(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
      setError('Failed to load leaderboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getLeaderboard(selectedSubject);

    // Refresh leaderboard every 30 seconds
    const intervalId = setInterval(() => getLeaderboard(selectedSubject), 30000);

    return () => clearInterval(intervalId);
  }, [selectedSubject]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const time = date.toLocaleTimeString('en-GB', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false
    });
    const formattedDate = date.toLocaleDateString('en-GB', { 
      day: '2-digit', 
      month: 'short', 
      year: '2-digit'
    });
    return `${time} - ${formattedDate}`;
  };

  const getRankEmoji = (rank) => {
    switch (rank) {
      case 1:
        return '🏆';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return '';
    }
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-6 w-full max-w-md mt-8">
      <h2 className="text-2xl font-bold mb-4 text-center">Leaderboard</h2>
      <TagSelector selectedTag={selectedSubject} setSelectedTag={setSelectedSubject} />
      {loading ? (
        <p className="text-center mt-4">Loading...</p>
      ) : error ? (
        <p className="text-center text-red-500 mt-4">{error}</p>
      ) : leaderboard.length === 0 ? (
        <p className="text-center mt-4">No scores submitted yet.</p>
      ) : (
        <table className="w-full mt-4">
          <thead>
            <tr className="text-left">
              <th className="pb-2">Rank</th>
              <th className="pb-2">Player</th>
              <th className="pb-2 text-right">Score</th>
              <th className="pb-2 text-right">Date</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((player, index) => (
              <tr key={player.id} className="border-t">
                <td className="py-2">
                  {getRankEmoji(index + 1)}{' '}
                  {index + 1}
                </td>
                <td className="py-2">{player.username}</td>
                <td className="py-2 text-right">{player.score}</td>
                <td className="py-2 text-right text-sm text-gray-600">
                  {formatDate(player.created_at)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default Leaderboard;
