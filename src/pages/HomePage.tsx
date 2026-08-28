import React, { useEffect, useState } from 'react';
import { getPopularGames, getUpcomingGames, Game, getGameDetails } from '../lib/rawg';
import GameCard from '../components/GameCard';
import { Flame, Calendar, Newspaper, ArrowLeft, Users } from 'lucide-react';
import { useStore } from '../store/useStore';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Link } from 'react-router-dom';

export default function HomePage() {
  const { user } = useStore();
  const [popularGames, setPopularGames] = useState<Game[]>([]);
  const [upcomingGames, setUpcomingGames] = useState<Game[]>([]);
  const [friendsGames, setFriendsGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGames = async () => {
      try {
        const [popular, upcoming] = await Promise.all([
          getPopularGames(),
          getUpcomingGames()
        ]);
        setPopularGames(popular);
        setUpcomingGames(upcoming);

        // Fetch Friends Trending
        if (user) {
          const followsQuery = query(collection(db, 'follows'), where('followerId', '==', user.uid));
          const followsDocs = await getDocs(followsQuery);
          const followingIds = followsDocs.docs.map(d => d.data().followingId);

          if (followingIds.length > 0) {
            const chunks = [];
            for (let i = 0; i < followingIds.length; i += 10) {
                chunks.push(followingIds.slice(i, i + 10));
            }
            
            const gameCounts: Record<number, number> = {};
            
            for (const chunk of chunks) {
              const activitiesQuery = query(collection(db, 'activities'), where('userId', 'in', chunk));
              const activitiesSnapshot = await getDocs(activitiesQuery);
              activitiesSnapshot.forEach(d => {
                  const data = d.data();
                  if (data.gameId) {
                      gameCounts[data.gameId] = (gameCounts[data.gameId] || 0) + 1;
                  }
              });
            }

            const sortedGameIds = Object.entries(gameCounts)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 10)
              .map(([id]) => Number(id));

            if (sortedGameIds.length > 0) {
                const fGames = await Promise.all(sortedGameIds.map(id => getGameDetails(id)));
                setFriendsGames(fGames.filter((g): g is Game => g !== null));
            }
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchGames();
  }, [user]);

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-8 bg-neutral-800 rounded w-48 mb-4"></div>
        <div className="flex gap-4 overflow-x-hidden">
          {[1,2,3,4].map(i => <div key={i} className="min-w-[140px] sm:min-w-[180px] aspect-[3/4] bg-neutral-800 rounded-2xl"></div>)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {/* Popular Games */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Flame className="text-orange-500" />
            الرائجة
          </h2>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4 snap-x hide-scrollbar">
          {popularGames.map(game => (
            <div key={game.id} className="min-w-[140px] sm:min-w-[180px] snap-start">
              <GameCard game={game} />
            </div>
          ))}
          <div className="min-w-[140px] sm:min-w-[180px] snap-start flex items-center justify-center bg-neutral-900 rounded-2xl border border-neutral-800 hover:bg-neutral-800 transition-colors">
            <Link to="/popular" className="flex flex-col items-center gap-2 text-neutral-400 hover:text-white p-8">
              <ArrowLeft size={32} />
              <span className="font-bold">إظهار الكل</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Friends Trending */}
      {friendsGames.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Users className="text-indigo-500" />
              رائجة بين الأصدقاء
            </h2>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 snap-x hide-scrollbar">
            {friendsGames.map(game => (
              <div key={game.id} className="min-w-[140px] sm:min-w-[180px] snap-start">
                <GameCard game={game} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Upcoming Games */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Calendar className="text-blue-500" />
            الجديدة
          </h2>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4 snap-x hide-scrollbar">
          {upcomingGames.map(game => (
            <div key={game.id} className="min-w-[140px] sm:min-w-[180px] snap-start">
              <GameCard game={game} />
            </div>
          ))}
          <div className="min-w-[140px] sm:min-w-[180px] snap-start flex items-center justify-center bg-neutral-900 rounded-2xl border border-neutral-800 hover:bg-neutral-800 transition-colors">
            <Link to="/upcoming" className="flex flex-col items-center gap-2 text-neutral-400 hover:text-white p-8">
              <ArrowLeft size={32} />
              <span className="font-bold">إظهار الكل</span>
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
