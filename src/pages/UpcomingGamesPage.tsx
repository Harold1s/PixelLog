import React, { useEffect, useState } from 'react';
import { getUpcomingGames, Game } from '../lib/rawg';
import GameCard from '../components/GameCard';
import { Calendar, Loader2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function UpcomingGamesPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGames = async () => {
      try {
        const upcoming = await getUpcomingGames();
        setGames(upcoming);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchGames();
  }, []);

  return (
    <div className="space-y-6 pb-24">
      <div className="flex items-center gap-4 mb-6">
        <Link to="/" className="p-2 bg-neutral-900 rounded-full hover:bg-neutral-800 transition-colors">
          <ArrowRight size={24} className="text-neutral-400" />
        </Link>
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-500/10 rounded-xl">
            <Calendar className="text-blue-500" size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">الألعاب القادمة</h1>
            <p className="text-neutral-400">أبرز الإصدارات القادمة</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-blue-500" size={32} />
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {games.map(game => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      )}
    </div>
  );
}
