import { Heart } from "lucide-react";
import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { getGameDetails, Game } from '../lib/rawg';
import GameCard from '../components/GameCard';
import { Loader2, ListTodo, CheckCircle2, Gamepad2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ListsPage() {
  const { user, userProfile } = useStore();
  const navigate = useNavigate();
  const [games, setGames] = useState<{ [key: string]: Game[] }>({ played: [], playing: [], backlog: [], favorites: [] });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'played' | 'playing' | 'backlog' | 'favorites'>('played');

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    const fetchGames = async () => {
      const statusMap = userProfile?.gameStatus || {};
      const gameIds = Array.from(new Set([...Object.keys(statusMap).map(Number), ...(userProfile?.favoriteGames || [])]));
      
      if (gameIds.length === 0) {
        setLoading(false);
        return;
      }

      try {
        const fetchedGames = await Promise.all(gameIds.map(id => getGameDetails(id)));
        const newGames: { [key: string]: Game[] } = { played: [], playing: [], backlog: [], favorites: [] };
        
        fetchedGames.forEach(game => {
          if (game) {
            const status = statusMap[game.id];
            if (status && newGames[status]) {
              newGames[status].push(game);
            }
            if (userProfile?.favoriteGames?.includes(game.id)) {
              newGames['favorites'].push(game);
            }
          }
        });
        
        setGames(newGames);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchGames();
  }, [user, userProfile?.gameStatus, userProfile?.favoriteGames, navigate]);

  const tabs = [
    { id: 'played', label: 'لعبتها', icon: CheckCircle2 },
    { id: 'playing', label: 'ألعبها حالياً', icon: Gamepad2 },
    { id: 'backlog', label: 'ألعبها لاحقاً', icon: ListTodo },
    { id: 'favorites', label: 'المفضلات', icon: Heart },
  ] as const;

  const currentTab = tabs.find(t => t.id === activeTab) || tabs[0];

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-indigo-500" size={32} /></div>;

  return (
    <div className="space-y-6 pb-24">
      <h1 className="text-2xl font-bold text-white mb-6">قوائمي</h1>
      
      <div className="flex gap-2 p-1 bg-neutral-900 rounded-xl overflow-x-auto">
        {tabs.map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 min-w-[100px] py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === tab.id ? 'bg-indigo-600 text-white' : 'text-neutral-400 hover:text-white'}`}
          >
            <tab.icon size={18} /> <span className="hidden sm:inline">{tab.label}</span><span className="sm:hidden">{tab.label.split(' ')[0]}</span>
          </button>
        ))}
      </div>

      <div className="pt-4">
        {games[activeTab].length === 0 ? (
          <div className="text-center py-16 bg-neutral-900/50 rounded-2xl border border-neutral-800 border-dashed">
            <currentTab.icon className="mx-auto h-12 w-12 text-neutral-600 mb-4" />
            <p className="text-neutral-400">لا توجد ألعاب في هذه القائمة بعد.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {games[activeTab].map(game => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
