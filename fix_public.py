import re

with open('src/pages/PublicProfilePage.tsx', 'w') as f:
    f.write('''import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '../lib/firebase';
import { doc, getDoc, collection, query, where, getDocs, setDoc, deleteDoc } from 'firebase/firestore';
import { Gamepad2, Loader2, Star, CheckCircle2, ListTodo, ChevronDown, UserPlus, UserMinus } from 'lucide-react';
import { getGameDetails, Game } from '../lib/rawg';
import GameCard from '../components/GameCard';
import { useStore } from '../store/useStore';

export default function PublicProfilePage() {
  const { id } = useParams();
  const { user } = useStore();
  const [profile, setProfile] = useState<any>(null);
  const [favorites, setFavorites] = useState<Game[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      if (!id) return;
      try {
        const userDoc = await getDoc(doc(db, 'users', id));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setProfile(userData);

          if (userData.topGames?.length > 0) {
            const games = await Promise.all(userData.topGames.map((gameId: number) => getGameDetails(gameId)));
            setFavorites(games.filter((g): g is Game => g !== null));
          }

          const qReviews = query(collection(db, 'reviews'), where('userId', '==', id));
          const reviewDocs = await getDocs(qReviews);
          const userReviews = reviewDocs.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
          setReviews(userReviews.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
          
          const qActivities = query(collection(db, 'activities'), where('userId', '==', id));
          const activityDocs = await getDocs(qActivities);
          const userActivities = activityDocs.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
          userActivities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setActivities(userActivities.slice(0, 5));
        }

        if (user && user.uid !== id) {
          const followId = `${user.uid}_${id}`;
          const followDoc = await getDoc(doc(db, 'follows', followId));
          setIsFollowing(followDoc.exists());
        }

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [id, user]);

  const handleFollowToggle = async () => {
    if (!user || !id) return;
    setFollowLoading(true);
    const followId = `${user.uid}_${id}`;
    
    try {
      if (isFollowing) {
        await deleteDoc(doc(db, 'follows', followId));
        setIsFollowing(false);
      } else {
        await setDoc(doc(db, 'follows', followId), {
          followerId: user.uid,
          followingId: id,
          createdAt: new Date().toISOString()
        });
        setIsFollowing(true);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-indigo-500" size={32} /></div>;
  if (!profile) return <div className="text-center py-20 text-neutral-400">المستخدم غير موجود</div>;

  const displayedReviews = showAllReviews ? reviews : reviews.slice(0, 5);

  return (
    <div className="space-y-6 pb-24">
      {/* Banner */}
      <div 
        className="h-32 sm:h-48 rounded-2xl relative overflow-hidden bg-neutral-800"
        style={{ 
          backgroundColor: profile.profileColor || '#6366f1',
          backgroundImage: profile.bannerURL ? `url(${profile.bannerURL})` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 to-transparent" />
      </div>

      {/* Profile Info */}
      <div className="relative px-4 pb-4 -mt-16 sm:-mt-20">
        <div className="flex justify-between items-end mb-4">
          <div className="relative group rounded-full inline-block">
            <img 
              src={profile.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${id}`} 
              alt="Profile" 
              className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-neutral-950 object-cover bg-neutral-900"
              style={{ borderColor: 'var(--color-neutral-950)' }}
            />
          </div>
          {user && user.uid !== id && (
            <button 
              onClick={handleFollowToggle}
              disabled={followLoading}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all ${
                isFollowing 
                  ? 'bg-neutral-800 hover:bg-neutral-700 text-white' 
                  : 'bg-white hover:bg-neutral-200 text-neutral-950'
              } disabled:opacity-50`}
            >
              {isFollowing ? (
                <>
                  <UserMinus size={18} />
                  <span>إلغاء المتابعة</span>
                </>
              ) : (
                <>
                  <UserPlus size={18} />
                  <span>متابعة</span>
                </>
              )}
            </button>
          )}
        </div>
        
        <div>
          <h1 className="text-2xl font-bold text-white">{profile.displayName}</h1>
          <p className="text-neutral-400 mb-4">@{profile.username}</p>
          <p className="text-neutral-300 text-sm whitespace-pre-wrap leading-relaxed">{profile.bio}</p>
        </div>
      </div>

      {/* Favorite Games */}
      {favorites.length > 0 && (
        <section className="pt-4 border-t border-neutral-900">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Gamepad2 className="text-pink-500" />
            أفضل 4 ألعاب (Top 4)
          </h2>
          <div className="grid grid-cols-4 gap-2 sm:gap-4">
            {favorites.map(game => (
              <div key={game.id} className="aspect-[3/4] rounded-xl overflow-hidden relative group">
                <img src={game.background_image} alt={game.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2 text-xs">
                  <span className="font-bold line-clamp-2">{game.name}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Reviews */}
      {reviews.length > 0 && (
        <section className="pt-4 border-t border-neutral-900">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Star className="text-yellow-500" />
            المراجعات
          </h2>
          <div className="space-y-4">
             {displayedReviews.map(review => (
                 <div key={review.id} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4">
                     <div className="flex items-start gap-4 mb-3">
                         {review.gameImage && (
                           <Link to={`/game/${review.gameId}`} className="shrink-0">
                             <img src={review.gameImage} alt={review.gameName} className="w-12 h-12 rounded-lg object-cover" />
                           </Link>
                         )}
                         <div className="flex-1">
                           <Link to={`/game/${review.gameId}`} className="font-bold text-white hover:text-indigo-400 transition-colors line-clamp-1 mb-1">
                             {review.gameName || 'لعبة غير معروفة'}
                           </Link>
                           <div className="flex items-center gap-2">
                             <div className="flex items-center gap-1 text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded text-xs font-bold w-fit">
                                 <Star size={12} className="fill-current" />
                                 {review.rating}
                             </div>
                             <div className="text-xs text-neutral-500">{new Date(review.createdAt).toLocaleDateString('ar-SA')}</div>
                           </div>
                         </div>
                     </div>
                     <p className="text-neutral-300 text-sm whitespace-pre-wrap leading-relaxed">{review.content}</p>
                 </div>
             ))}
             {!showAllReviews && reviews.length > 5 && (
               <button 
                 onClick={() => setShowAllReviews(true)}
                 className="w-full py-3 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-xl text-indigo-400 font-bold transition-colors flex items-center justify-center gap-2"
               >
                 إظهار جميع المراجعات ({reviews.length}) <ChevronDown size={18} />
               </button>
             )}
         </div>
        </section>
      )}

      {/* Recent Activity */}
      {activities.length > 0 && (
        <section className="pt-4 border-t border-neutral-900">
          <h2 className="text-lg font-bold mb-4">آخر النشاطات</h2>
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
        </section>
      )}
    </div>
  );
}
''')
