import React, { useState, useEffect } from 'react';
import { searchGames, Game } from '../lib/rawg';
import GameCard from '../components/GameCard';
import { Search as SearchIcon, Loader2, Gamepad2, Users } from 'lucide-react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { collection, query as firestoreQuery, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'games' | 'users'>('games');
  
  const [gameResults, setGameResults] = useState<Game[]>([]);
  const [userResults, setUserResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const q = searchParams.get('q');
    const tab = (searchParams.get('tab') as 'games' | 'users') || 'games';
    setActiveTab(tab);
    
    if (q) {
      setSearchQuery(q);
      handleSearch(q, tab);
    }
  }, [location.search]);

  const handleSearch = async (q: string, tab: 'games' | 'users') => {
    if (!q.trim()) return;
    setLoading(true);
    
    if (tab === 'games') {
      const data = await searchGames(q);
      setGameResults(data);
    } else {
      try {
        const querySnapshot = await getDocs(firestoreQuery(collection(db, 'users')));
        const users: any[] = [];
        querySnapshot.forEach((doc) => {
          const u = doc.data();
          if (u.username?.toLowerCase().includes(q.toLowerCase()) || 
              u.displayName?.toLowerCase().includes(q.toLowerCase())) {
            users.push({ id: doc.id, ...u });
          }
        });
        setUserResults(users);
      } catch (err) {
        console.error(err);
      }
    }
    
    setLoading(false);
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}&tab=${activeTab}`);
    }
  };

  const handleTabChange = (tab: 'games' | 'users') => {
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}&tab=${tab}`);
    } else {
      setActiveTab(tab);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-2 p-1 bg-neutral-900 rounded-xl">
        <button 
          onClick={() => handleTabChange('games')}
          className={`flex-1 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'games' ? 'bg-indigo-600 text-white' : 'text-neutral-400 hover:text-white'}`}
        >
          <Gamepad2 size={20} /> ألعاب
        </button>
        <button 
          onClick={() => handleTabChange('users')}
          className={`flex-1 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'users' ? 'bg-indigo-600 text-white' : 'text-neutral-400 hover:text-white'}`}
        >
          <Users size={20} /> مستخدمين
        </button>
      </div>

      <form onSubmit={onSubmit} className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={activeTab === 'games' ? "ابحث عن لعبة..." : "ابحث عن مستخدم..."}
          className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl py-4 pr-12 pl-4 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-lg"
        />
        <button type="submit" className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white">
          <SearchIcon size={24} />
        </button>
      </form>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin text-indigo-500" size={32} />
        </div>
      ) : (
        <div>
          {activeTab === 'games' ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {gameResults.map(game => (
                  <GameCard key={game.id} game={game} />
                ))}
              </div>
              {gameResults.length === 0 && searchQuery && (
                <div className="text-center py-12 text-neutral-500">
                  لم يتم العثور على ألعاب مطابقة لبحثك
                </div>
              )}
            </>
          ) : (
            <>
              <div className="space-y-3">
                {userResults.map(u => (
                  <Link key={u.id} to={`/user/${u.id}`} className="flex items-center gap-4 bg-neutral-900 border border-neutral-800 p-4 rounded-2xl hover:border-indigo-500/50 transition-colors">
                    <img 
                      src={u.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.id}`} 
                      alt={u.displayName}
                      className="w-12 h-12 rounded-full bg-neutral-800 object-cover"
                    />
                    <div>
                      <div className="font-bold text-white text-lg">{u.displayName}</div>
                      <div className="text-neutral-500 text-sm">@{u.username}</div>
                    </div>
                  </Link>
                ))}
              </div>
              {userResults.length === 0 && searchQuery && (
                <div className="text-center py-12 text-neutral-500">
                  لم يتم العثور على مستخدمين
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
