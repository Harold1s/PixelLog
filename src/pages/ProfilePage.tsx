import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, doc, updateDoc, orderBy, limit } from 'firebase/firestore';
import { Game, getGameDetails, searchGames } from '../lib/rawg';
import GameCard from '../components/GameCard';
import { Edit2, Settings, Plus, Gamepad2, Image as ImageIcon, Star, CheckCircle2, ListTodo, X, Search, Loader2 } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { compressImage } from '../lib/imageUtils';

export default function ProfilePage() {
  const { user, userProfile, setUserProfile } = useStore();
  const navigate = useNavigate();
  const [topGamesData, setTopGamesData] = useState<Game[]>([]);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Game[]>([]);
  const [searching, setSearching] = useState(false);
  const [activities, setActivities] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  
  const photoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const [editForm, setEditForm] = useState({
    displayName: userProfile?.displayName || '',
    username: userProfile?.username || '',
    bio: userProfile?.bio || '',
    photoURL: userProfile?.photoURL || '',
    bannerURL: userProfile?.bannerURL || '',
    profileColor: userProfile?.profileColor || '#6366f1',
  });

  const lastChange = userProfile?.lastUsernameChange ? new Date(userProfile.lastUsernameChange).getTime() : 0;
  const daysSinceChange = (Date.now() - lastChange) / (1000 * 60 * 60 * 24);
  const canChangeUsername = daysSinceChange >= 14;
  const remainingDays = Math.ceil(14 - daysSinceChange);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    const fetchFavoritesAndActivities = async () => {
      if (userProfile?.topGames && userProfile.topGames.length > 0) {
        const games = await Promise.all(userProfile.topGames.map((id: number) => getGameDetails(id)));
        setTopGamesData(games.filter((g): g is Game => g !== null));
      } else {
        setTopGamesData([]);
      }
      
      try {
        const q = query(collection(db, 'activities'), where('userId', '==', user.uid));
        const querySnapshot = await getDocs(q);
        const fetchedActivities = querySnapshot.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
        fetchedActivities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setActivities(fetchedActivities.slice(0, 5));
      } catch (err) {
        console.error("Error fetching activities", err);
      }
    };
    fetchFavoritesAndActivities();
  }, [user, userProfile?.topGames, navigate]);

  const handleSaveProfile = async () => {
    if (!user) return;
    try {
      setUploading(true);
      const userRef = doc(db, 'users', user.uid);
      const updatedData: any = { ...editForm };
      
      if (editForm.username !== userProfile?.username) {
        if (!canChangeUsername) {
          alert('لا يمكنك تغيير اسم المستخدم الآن.');
          setUploading(false);
          return;
        }
        updatedData.lastUsernameChange = new Date().toISOString();
      }

      await updateDoc(userRef, updatedData);
      setUserProfile({ ...userProfile, ...updatedData } as any);
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating profile", error);
      alert("حدث خطأ أثناء حفظ الملف الشخصي.");
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: 'photo' | 'banner') => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const compressedDataUrl = await compressImage(file, type === 'banner' ? 1200 : 400);
      setEditForm(prev => ({ ...prev, [type === 'photo' ? 'photoURL' : 'bannerURL']: compressedDataUrl }));
    } catch (error) {
      console.error('Error compressing image:', error);
      alert('حدث خطأ أثناء معالجة الصورة.');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveTopGame = async (gameId: number) => {
    if (!user) return;
    const newTopGames = (userProfile?.topGames || []).filter(id => id !== gameId);
    try {
      await updateDoc(doc(db, 'users', user.uid), { topGames: newTopGames });
      setUserProfile({ ...userProfile, topGames: newTopGames } as any);
      setTopGamesData(prev => prev.filter(g => g.id !== gameId));
    } catch (e) {
      console.error(e);
    }
  };

  const handleSearchTopGames = async (q: string) => {
    setSearchQuery(q);
    if (!q.trim()) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const data = await searchGames(q);
      setSearchResults(data);
    } catch (e) {
      console.error(e);
    } finally {
      setSearching(false);
    }
  };

  const handleAddTopGame = async (game: Game) => {
    if (!user) return;
    const currentTopGames = userProfile?.topGames || [];
    if (currentTopGames.includes(game.id) || currentTopGames.length >= 4) return;
    
    const newTopGames = [...currentTopGames, game.id];
    try {
      await updateDoc(doc(db, 'users', user.uid), { topGames: newTopGames });
      setUserProfile({ ...userProfile, topGames: newTopGames } as any);
      setTopGamesData(prev => [...prev, game]);
      setShowSearchModal(false);
      setSearchQuery('');
      setSearchResults([]);
    } catch (e) {
      console.error(e);
    }
  };

  if (!userProfile) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <input type="file" ref={photoInputRef} onChange={e => handleFileChange(e, 'photo')} accept="image/*" className="hidden" />
      <input type="file" ref={bannerInputRef} onChange={e => handleFileChange(e, 'banner')} accept="image/*" className="hidden" />

      {/* Banner */}
      <div 
        className="h-48 sm:h-64 rounded-b-3xl relative group overflow-hidden"
        style={{ 
          backgroundColor: editForm.profileColor,
          backgroundImage: (isEditing ? editForm.bannerURL : userProfile.bannerURL) ? `url(${isEditing ? editForm.bannerURL : userProfile.bannerURL})` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 to-transparent" />
        {isEditing && (
          <button onClick={() => bannerInputRef.current?.click()} className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
            <ImageIcon size={32} />
          </button>
        )}
      </div>

      {/* Profile Info */}
      <div className="relative px-4 pb-4 -mt-16 sm:-mt-20">
        <div className="flex justify-between items-end mb-4">
          <div className="relative group rounded-full">
            <img 
              src={(isEditing ? editForm.photoURL : userProfile.photoURL) || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + user?.uid} 
              alt="Profile" 
              className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-neutral-950 object-cover bg-neutral-900"
              style={{ borderColor: 'var(--color-neutral-950)' }}
            />
            {isEditing && (
              <button onClick={() => photoInputRef.current?.click()} className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                <ImageIcon size={24} />
              </button>
            )}
          </div>
          <button 
            onClick={() => setIsEditing(!isEditing)}
            className="p-2 bg-neutral-900 border border-neutral-800 rounded-xl text-neutral-300 hover:text-white transition-colors"
          >
            <Edit2 size={20} />
          </button>
        </div>
        
        {isEditing ? (
          <div className="space-y-4 bg-neutral-900 p-4 rounded-2xl border border-neutral-800 mt-4">
            <h3 className="font-bold text-lg mb-2">تعديل الملف الشخصي</h3>
            <input type="text" value={editForm.displayName} onChange={e => setEditForm({...editForm, displayName: e.target.value})} placeholder="الاسم" className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2 text-white" />
            <div className="space-y-1">
              <input 
                type="text" 
                value={editForm.username} 
                onChange={e => setEditForm({...editForm, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '')})} 
                disabled={!canChangeUsername}
                placeholder="اسم المستخدم" 
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2 text-white disabled:opacity-50 disabled:cursor-not-allowed" 
              />
              {!canChangeUsername && (
                <p className="text-xs text-red-400 px-1">متبقي {remainingDays} يوماً لتتمكن من تغيير اسم المستخدم مجدداً.</p>
              )}
            </div>
            <textarea value={editForm.bio} onChange={e => setEditForm({...editForm, bio: e.target.value})} placeholder="السيرة الذاتية" className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2 text-white resize-none" rows={3}></textarea>
            <div className="flex items-center gap-2">
              <label className="text-sm text-neutral-400">لون البروفايل:</label>
              <input type="color" value={editForm.profileColor} onChange={e => setEditForm({...editForm, profileColor: e.target.value})} className="bg-transparent rounded cursor-pointer" />
            </div>
            <button onClick={handleSaveProfile} disabled={uploading} className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium py-2 rounded-xl transition-all">
              {uploading ? 'جاري الرفع...' : 'حفظ التغييرات'}
            </button>
          </div>
        ) : (
          <div>
            <h1 className="text-2xl font-bold text-white">{userProfile.displayName}</h1>
            <p className="text-neutral-400 mb-4">@{userProfile.username}</p>
            <p className="text-neutral-300 text-sm whitespace-pre-wrap leading-relaxed">{userProfile.bio}</p>
          </div>
        )}
      </div>

      {/* Favorite Games */}
      <section className="pt-4 border-t border-neutral-900">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Gamepad2 className="text-pink-500" />
          أفضل 4 ألعاب (Top 4)
        </h2>
        <div className="grid grid-cols-4 gap-2 sm:gap-4">
          {[0, 1, 2, 3].map((index) => {
            const game = topGamesData[index];
            if (game) {
              return (
                <div key={game.id} className="aspect-[3/4] rounded-xl overflow-hidden relative group">
                   <img src={game.background_image} alt={game.name} className="w-full h-full object-cover" />
                   <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2 text-xs">
                     <span className="font-bold line-clamp-2">{game.name}</span>
                   </div>
                   {isEditing && (
                     <button 
                       onClick={() => handleRemoveTopGame(game.id)}
                       className="absolute top-1 left-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:scale-110"
                     >
                       <X size={14} />
                     </button>
                   )}
                </div>
              );
            }
            return (
              <div 
                key={index} 
                className="aspect-[3/4] rounded-xl border-2 border-neutral-800 border-dashed flex items-center justify-center text-neutral-600 hover:border-indigo-500 hover:text-indigo-500 hover:bg-indigo-500/10 transition-colors cursor-pointer bg-neutral-900/50" 
                onClick={() => {
                  if (isEditing) {
                    setShowSearchModal(true);
                  }
                }}
              >
                {isEditing ? <Plus size={24} /> : null}
              </div>
            );
          })}
        </div>
      </section>

      {/* Recent Activity */}
      <section className="pt-4 border-t border-neutral-900">
        <h2 className="text-lg font-bold mb-4">آخر النشاطات</h2>
        {activities.length === 0 ? (
          <div className="text-center py-8 text-neutral-500 bg-neutral-900/50 rounded-2xl border border-neutral-800">
            لا توجد نشاطات حتى الآن. ابحث عن ألعاب وقم بإضافتها!
          </div>
        ) : (
          <div className="space-y-3">
            {activities.map(activity => (
              <div key={activity.id} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 flex gap-4 items-center">
                <Link to={`/game/${activity.gameId}`} className="shrink-0">
                  <img src={activity.gameImage} alt={activity.gameName} className="w-16 h-16 rounded-xl object-cover" />
                </Link>
                <div className="flex-1">
                  <div className="text-sm text-neutral-400 mb-1">
                    {activity.type === 'review' ? (
                      <span className="flex items-center gap-1"><Star size={14} className="text-yellow-500" /> كتب مراجعة للعبة</span>
                    ) : (
                      <span className="flex items-center gap-1">
                        {activity.status === 'played' ? <CheckCircle2 size={14} className="text-green-500"/> : 
                         activity.status === 'playing' ? <Gamepad2 size={14} className="text-indigo-500"/> : 
                         <ListTodo size={14} className="text-blue-500"/>}
                        أضاف اللعبة إلى قائمة {activity.status === 'played' ? 'لعبتها' : activity.status === 'playing' ? 'ألعبها حالياً' : 'ألعبها لاحقاً'}
                      </span>
                    )}
                  </div>
                  <Link to={`/game/${activity.gameId}`} className="font-bold text-white hover:text-indigo-400 transition-colors">
                    {activity.gameName}
                  </Link>
                  {activity.type === 'review' && (
                    <div className="flex items-center gap-1 text-yellow-500 text-xs font-bold mt-1">
                      <Star size={12} className="fill-current" /> {activity.rating}
                    </div>
                  )}
                  <div className="text-xs text-neutral-500 mt-2">{new Date(activity.createdAt).toLocaleDateString('ar-SA')}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {showSearchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setShowSearchModal(false)}>
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 w-full max-w-lg h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">اختر لعبة</h3>
              <button onClick={() => setShowSearchModal(false)} className="p-1 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>
            <div className="relative mb-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchTopGames(e.target.value)}
                placeholder="ابحث عن لعبة..."
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-3 pr-10 pl-4 text-white focus:outline-none focus:border-indigo-500"
              />
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500" size={18} />
            </div>
            <div className="flex-1 overflow-y-auto min-h-0 space-y-2 pr-1">
              {searching ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="animate-spin text-indigo-500" size={32} />
                </div>
              ) : (
                searchResults.map(game => (
                  <button
                    key={game.id}
                    onClick={() => handleAddTopGame(game)}
                    className="w-full flex items-center gap-4 p-2 rounded-xl hover:bg-neutral-800 transition-colors text-right"
                  >
                    <img src={game.background_image} alt={game.name} className="w-16 h-16 rounded-lg object-cover" />
                    <div className="font-bold text-white line-clamp-1">{game.name}</div>
                  </button>
                ))
              )}
              {!searching && searchQuery && searchResults.length === 0 && (
                <div className="text-center py-10 text-neutral-500">لم يتم العثور على نتائج</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
