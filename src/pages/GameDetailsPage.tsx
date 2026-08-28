import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getGameDetails, Game } from '../lib/rawg';
import { Star, ArrowRight, Heart, Share2, Plus, List, Check, MessageSquare } from 'lucide-react';
import { useStore } from '../store/useStore';
import { doc, updateDoc, collection, addDoc, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface Review {
  id: string;
  userId: string;
  gameId: number;
  rating: number;
  content: string;
  createdAt: string;
  userDisplayName?: string;
  userPhotoURL?: string;
}

export default function GameDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, userProfile, setUserProfile } = useStore();
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  
  const [reviewForm, setReviewForm] = useState({ rating: 5, content: '' });
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    if (id) {
      getGameDetails(Number(id)).then(data => {
        setGame(data);
        setLoading(false);
      });
      fetchReviews(Number(id));
    }
  }, [id]);

  const fetchReviews = async (gameId: number) => {
    try {
      const q = query(collection(db, 'reviews'), where('gameId', '==', gameId));
      const querySnapshot = await getDocs(q);
      const fetchedReviews: Review[] = [];
      
      for (const d of querySnapshot.docs) {
        const reviewData = d.data() as Review;
        // Fetch user data for the review
        const userDoc = await getDocs(query(collection(db, 'users'), where('__name__', '==', reviewData.userId)));
        if (!userDoc.empty) {
            const uData = userDoc.docs[0].data();
            reviewData.userDisplayName = uData.displayName;
            reviewData.userPhotoURL = uData.photoURL;
        }
        fetchedReviews.push({ ...reviewData, id: d.id });
      }
      // sort by date descending
      fetchedReviews.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setReviews(fetchedReviews);
    } catch (error) {
      console.error("Error fetching reviews", error);
    }
  };

  const handleToggleFavorite = async () => {
    if (!user || !userProfile || !game) {
        navigate('/auth');
        return;
    }

    let newFavorites = [...(userProfile.favoriteGames || [])];
    const isFavorite = newFavorites.includes(game.id);

    if (isFavorite) {
      newFavorites = newFavorites.filter(favId => favId !== game.id);
    } else {
      newFavorites.push(game.id);
    }

    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { favoriteGames: newFavorites });
      setUserProfile({ ...userProfile, favoriteGames: newFavorites });
    } catch (error) {
      console.error("Error updating favorites", error);
    }
  };

  const handleUpdateStatus = async (status: 'played' | 'playing' | 'backlog' | null) => {
    if (!user || !userProfile || !game) {
        navigate('/auth');
        return;
    }

    const currentStatuses = userProfile.gameStatus || {};
    const newStatuses = { ...currentStatuses };
    
    if (status) {
        newStatuses[game.id] = status;
    } else {
        delete newStatuses[game.id];
    }

    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { gameStatus: newStatuses });
      setUserProfile({ ...userProfile, gameStatus: newStatuses });
      
      if (status) {
        await addDoc(collection(db, 'activities'), {
          userId: user.uid,
          type: 'status',
          gameId: game.id,
          gameName: game.name,
          gameImage: game.background_image || '',
          status: status,
          rating: 0,
          createdAt: new Date().toISOString()
        });
      }
      
      setShowStatusModal(false);
    } catch (error) {
      console.error("Error updating status", error);
      alert('حدث خطأ أثناء تحديث القائمة.');
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!user || !game) {
          navigate('/auth');
          return;
      }
      if (!reviewForm.content.trim()) return;

      setSubmittingReview(true);
      try {
          const newReview = {
              gameId: game.id,
              userId: user.uid,
              rating: reviewForm.rating,
              content: reviewForm.content,
              gameName: game.name,
              gameImage: game.background_image || '',
              createdAt: new Date().toISOString()
          };
          const docRef = await addDoc(collection(db, 'reviews'), newReview);
          
          await addDoc(collection(db, 'activities'), {
              userId: user.uid,
              type: 'review',
              gameId: game.id,
              gameName: game.name,
              gameImage: game.background_image || '',
              status: '',
              rating: reviewForm.rating,
              createdAt: new Date().toISOString()
          });

          setReviews([{ 
              ...newReview, 
              id: docRef.id, 
              userDisplayName: userProfile?.displayName, 
              userPhotoURL: userProfile?.photoURL 
          }, ...reviews]);
          setShowReviewModal(false);
          setReviewForm({ rating: 5, content: '' });
      } catch (error) {
          console.error("Error submitting review", error);
          alert('حدث خطأ أثناء إرسال المراجعة.');
      } finally {
          setSubmittingReview(false);
      }
  };

  const handleShare = () => {
      if (navigator.share) {
          navigator.share({
              title: game?.name,
              url: window.location.href,
          });
      }
  }

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin text-indigo-500 w-8 h-8 border-4 border-current border-t-transparent rounded-full" /></div>;
  if (!game) return <div className="text-center py-20">اللعبة غير موجودة</div>;

  const isFavorite = userProfile?.favoriteGames?.includes(game.id);
  const currentStatus = userProfile?.gameStatus?.[game.id];

  const statusLabels = {
      played: 'لعبتها',
      playing: 'ألعبها حالياً',
      backlog: 'ألعبها لاحقاً'
  };

  return (
    <div className="pb-24">
      {/* Header Image */}
      <div className="relative h-64 sm:h-80 -mx-4 -mt-4 mb-4">
        <img src={game.background_image} alt={game.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/60 to-transparent" />
        <button onClick={() => navigate(-1)} className="absolute top-4 right-4 p-2 bg-black/40 backdrop-blur-md rounded-full text-white hover:bg-black/60 transition-colors">
          <ArrowRight size={20} />
        </button>
      </div>

      <div className="relative -mt-20 sm:-mt-24 z-10 flex gap-4 px-2">
        <div className="w-32 sm:w-40 shrink-0">
          <div className="aspect-[3/4] rounded-xl overflow-hidden border-4 border-neutral-950 shadow-2xl bg-neutral-900">
             <img src={game.background_image} alt={game.name} className="w-full h-full object-cover" />
          </div>
        </div>
        
        <div className="flex flex-col justify-end pb-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2 leading-tight">{game.name}</h1>
          <div className="flex flex-wrap items-center gap-3 text-sm text-neutral-300">
            {game.released && <span>{new Date(game.released).getFullYear()}</span>}
            <div className="flex items-center gap-1 text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded text-xs font-bold">
              <Star size={14} className="fill-current" />
              {game.rating ? game.rating.toFixed(1) : 'N/A'}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex gap-2">
        <button onClick={() => setShowStatusModal(true)} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2">
          {currentStatus ? (
              <>
                  <List size={20} />
                  {statusLabels[currentStatus]}
              </>
          ) : (
              <>
                <Plus size={20} />
                إضافة لقائمة
              </>
          )}
        </button>
        <button onClick={handleToggleFavorite} className={`p-3 rounded-xl border transition-colors flex items-center justify-center ${isFavorite ? 'border-pink-500 text-pink-500 bg-pink-500/10' : 'border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-white bg-neutral-900'}`}>
          <Heart size={24} className={isFavorite ? 'fill-current' : ''} />
        </button>
        <button onClick={handleShare} className="p-3 bg-neutral-900 border border-neutral-800 rounded-xl text-neutral-400 hover:text-white hover:border-neutral-700 transition-colors flex items-center justify-center">
          <Share2 size={24} />
        </button>
      </div>

      <div className="mt-8 space-y-6">
         <section>
             <h2 className="text-lg font-bold text-white mb-2">التصنيفات</h2>
             <div className="flex flex-wrap gap-2">
                 {game.genres?.map(genre => (
                     <span key={genre.id} className="px-3 py-1 bg-neutral-900 border border-neutral-800 rounded-full text-sm text-neutral-300">
                         {genre.name}
                     </span>
                 ))}
             </div>
         </section>

         <section>
             <h2 className="text-lg font-bold text-white mb-2">المنصات</h2>
             <div className="flex flex-wrap gap-2">
                 {game.platforms?.map(p => (
                     <span key={p.platform.id} className="px-3 py-1 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-neutral-400">
                         {p.platform.name}
                     </span>
                 ))}
             </div>
         </section>

         <section>
             <div className="flex items-center justify-between mb-4">
                 <h2 className="text-lg font-bold text-white">المراجعات</h2>
                 <button onClick={() => setShowReviewModal(true)} className="text-sm font-bold text-indigo-400 flex items-center gap-1">
                     <Plus size={16} /> أضف مراجعة
                 </button>
             </div>
             
             {reviews.length === 0 ? (
                 <div className="text-center py-8 border border-neutral-800 border-dashed rounded-2xl bg-neutral-900/50">
                     <p className="text-neutral-500 mb-4">لا توجد مراجعات بعد. كن أول من يكتب مراجعة!</p>
                     <button onClick={() => setShowReviewModal(true)} className="text-indigo-400 hover:text-indigo-300 font-medium">اكتب مراجعة</button>
                 </div>
             ) : (
                 <div className="space-y-4">
                     {reviews.map(review => (
                         <div key={review.id} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4">
                             <div className="flex items-center gap-3 mb-3">
                                 <img src={review.userPhotoURL || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + review.userId} alt={review.userDisplayName} className="w-10 h-10 rounded-full object-cover bg-neutral-800" />
                                 <div>
                                     <div className="font-bold text-white text-sm">{review.userDisplayName}</div>
                                     <div className="text-xs text-neutral-500">{new Date(review.createdAt).toLocaleDateString('ar-SA')}</div>
                                 </div>
                                 <div className="mr-auto flex items-center gap-1 text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded text-xs font-bold">
                                     <Star size={12} className="fill-current" />
                                     {review.rating}
                                 </div>
                             </div>
                             <p className="text-neutral-300 text-sm whitespace-pre-wrap leading-relaxed">{review.content}</p>
                         </div>
                     ))}
                 </div>
             )}
         </section>
      </div>

      {/* Modals */}
      {showStatusModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setShowStatusModal(false)}>
              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 w-full max-w-sm" onClick={e => e.stopPropagation()}>
                  <h3 className="font-bold text-lg mb-4 text-center">إضافة إلى قائمة</h3>
                  <div className="space-y-2">
                      {(['played', 'playing', 'backlog'] as const).map(status => (
                          <button 
                              key={status} 
                              onClick={() => handleUpdateStatus(status)}
                              className={`w-full p-3 rounded-xl flex items-center justify-between transition-colors ${currentStatus === status ? 'bg-indigo-600 text-white' : 'bg-neutral-950 text-neutral-300 hover:bg-neutral-800'}`}
                          >
                              <span>{statusLabels[status]}</span>
                              {currentStatus === status && <Check size={18} />}
                          </button>
                      ))}
                      {currentStatus && (
                          <button onClick={() => handleUpdateStatus(null)} className="w-full p-3 mt-4 rounded-xl text-red-400 bg-red-400/10 hover:bg-red-400/20 transition-colors">
                              إزالة من القوائم
                          </button>
                      )}
                  </div>
              </div>
          </div>
      )}

      {showReviewModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setShowReviewModal(false)}>
              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 w-full max-w-md" onClick={e => e.stopPropagation()}>
                  <h3 className="font-bold text-lg mb-4">كتابة مراجعة</h3>
                  <form onSubmit={handleSubmitReview}>
                      <div className="mb-4">
                          <label className="block text-sm text-neutral-400 mb-2">التقييم</label>
                          <div className="flex gap-2">
                              {[1, 2, 3, 4, 5].map(rating => (
                                  <button 
                                      type="button" 
                                      key={rating} 
                                      onClick={() => setReviewForm({ ...reviewForm, rating })}
                                      className={`p-2 flex-1 rounded-lg flex justify-center transition-colors ${reviewForm.rating >= rating ? 'bg-yellow-500/10 text-yellow-500' : 'bg-neutral-950 text-neutral-600'}`}
                                  >
                                      <Star size={24} className={reviewForm.rating >= rating ? 'fill-current' : ''} />
                                  </button>
                              ))}
                          </div>
                      </div>
                      <div className="mb-4">
                          <label className="block text-sm text-neutral-400 mb-2">المراجعة</label>
                          <textarea 
                              required
                              value={reviewForm.content}
                              onChange={e => setReviewForm({ ...reviewForm, content: e.target.value })}
                              placeholder="ما رأيك في اللعبة؟"
                              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white resize-none focus:outline-none focus:border-indigo-500"
                              rows={4}
                          />
                      </div>
                      <div className="flex gap-2 mt-6">
                          <button type="button" onClick={() => setShowReviewModal(false)} className="flex-1 py-3 text-neutral-400 font-medium">إلغاء</button>
                          <button type="submit" disabled={submittingReview} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl disabled:opacity-50">
                              {submittingReview ? 'جاري الإرسال...' : 'نشر المراجعة'}
                          </button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
}
