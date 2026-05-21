import { useState, useEffect } from 'react';
import Navbar from '../../components/layout/Navbar';
import api from '../../config/axios';
import Spinner from '../../components/common/Spinner';
import { useAuth } from '../../context/AuthContext';

const MEDALS = { 1: '🥇', 2: '🥈', 3: '🥉' };

const LeaderboardPage = () => {
  const { user } = useAuth();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/gamification/leaderboard').then((r) => setEntries(r.data.data || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">🏆 Leaderboard</h1>
          <p className="text-gray-500 text-sm mt-2">Top citizens making their city cleaner</p>
        </div>

        {/* Top 3 podium */}
        {!loading && entries.length >= 3 && (
          <div className="flex items-end justify-center gap-4 mb-8">
            {[entries[1], entries[0], entries[2]].map((entry, i) => {
              const heights = ['h-24', 'h-32', 'h-20'];
              const ranks = [2, 1, 3];
              return (
                <div key={entry._id} className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-lg font-bold">
                    {entry.name?.[0]}
                  </div>
                  <div className="text-xs font-medium text-gray-700 text-center w-20 truncate">{entry.name}</div>
                  <div className={`${heights[i]} w-16 rounded-t-xl flex flex-col items-center justify-center ${i === 1 ? 'bg-primary-600' : 'bg-primary-300'}`}>
                    <span className="text-2xl">{MEDALS[ranks[i]]}</span>
                    <span className="text-white text-xs font-bold">{entry.points}pts</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {loading ? <div className="flex justify-center py-16"><Spinner size="lg" /></div> : (
          <div className="card">
            <div className="space-y-3">
              {entries.map((entry, i) => (
                <div key={entry._id} className={`flex items-center gap-4 p-3 rounded-xl transition-colors ${entry._id === user?._id ? 'bg-primary-50 border border-primary-200' : 'hover:bg-gray-50'}`}>
                  <div className="w-8 text-center">
                    {MEDALS[entry.rank] ? <span className="text-xl">{MEDALS[entry.rank]}</span> : <span className="text-sm font-bold text-gray-400">#{entry.rank}</span>}
                  </div>
                  <div className="w-10 h-10 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center font-semibold">
                    {entry.name?.[0]}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 text-sm">{entry.name} {entry._id === user?._id && <span className="text-xs text-primary-600">(you)</span>}</div>
                    <div className="text-xs text-gray-500">Level {entry.level}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-primary-600">{entry.points}</div>
                    <div className="text-xs text-gray-400">points</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeaderboardPage;
