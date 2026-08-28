import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { Link, useNavigate } from 'react-router-dom';
import { Star, CheckCircle2, Gamepad2, ListTodo, Loader2, Users } from 'lucide-react';

export default function FriendsActivityPage() {
  const { user } = useStore();
  const navigate = useNavigate();
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [followingUsers, setFollowingUsers] = useState<Record<string, any>>({});

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    const fetchFriendsActivity = async () => {
      try {
        const followsQuery = query(collection(db, 'follows'), where('followerId', '==', user.uid));
        const followsDocs = await getDocs(followsQuery);
        const followingIds = followsDocs.docs.map(d => d.data().followingId);

        if (followingIds.length === 0) {
          setLoading(false);
          return;
        }

        // Fetch users details
        const usersData: Record<string, any> = {};
        // Chunk followingIds into arrays of 10 for Firestore 'in' query limitation, or just fetch individually if small
        const chunks = [];
        for (let i = 0; i < followingIds.length; i += 10) {
            chunks.push(followingIds.slice(i, i + 10));
        }
        
        let allActivities: any[] = [];
        
        for (const chunk of chunks) {
            const usersQuery = query(collection(db, 'users'), where('__name__', 'in', chunk));
            const usersSnapshot = await getDocs(usersQuery);
            usersSnapshot.forEach(d => {
                usersData[d.id] = { id: d.id, ...d.data() };
            });

            const activitiesQuery = query(collection(db, 'activities'), where('userId', 'in', chunk));
            const activitiesSnapshot = await getDocs(activitiesQuery);
            activitiesSnapshot.forEach(d => {
                allActivities.push({ id: d.id, ...d.data() });
            });
        }
        
        setFollowingUsers(usersData);
        allActivities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setActivities(allActivities.slice(0, 50));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchFriendsActivity();
  }, [user, navigate]);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-indigo-500" size={32} /></div>;

  return (
    <div className="space-y-6 pb-24 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-indigo-500/10 rounded-xl">
          <Users className="text-indigo-500" size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">نشاطات الأصدقاء</h1>
          <p className="text-neutral-400">آخر التحديثات من الأشخاص الذين تتابعهم</p>
        </div>
      </div>

      {activities.length === 0 ? (
        <div className="text-center py-20 bg-neutral-900/50 rounded-3xl border border-neutral-800 border-dashed">
          <Users className="mx-auto h-16 w-16 text-neutral-700 mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">لا يوجد نشاط</h2>
          <p className="text-neutral-400 mb-6 max-w-sm mx-auto">تابع المزيد من الأشخاص لرؤية نشاطاتهم ومراجعاتهم للألعاب هنا.</p>
          <Link to="/search" className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold transition-all">
            البحث عن مستخدمين
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {activities.map(activity => {
            const profile = followingUsers[activity.userId];
            if (!profile) return null;

            return (
              <div key={activity.id} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 sm:p-6 flex flex-col sm:flex-row gap-4 sm:gap-6">
                <Link to={`/user/${profile.id}`} className="flex items-center gap-3 sm:hidden mb-2">
                   <img src={profile.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.id}`} alt="Profile" className="w-10 h-10 rounded-full object-cover" />
                   <span className="font-bold text-white">{profile.displayName}</span>
                </Link>

                <Link to={`/game/${activity.gameId}`} className="shrink-0 mx-auto sm:mx-0">
                  <img src={activity.gameImage} alt={activity.gameName} className="w-32 h-32 sm:w-24 sm:h-24 rounded-xl object-cover shadow-lg" />
                </Link>
                
                <div className="flex-1">
                  <div className="hidden sm:flex items-center gap-2 mb-3">
                    <Link to={`/user/${profile.id}`}>
                      <img src={profile.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.id}`} alt="Profile" className="w-8 h-8 rounded-full object-cover" />
                    </Link>
                    <Link to={`/user/${profile.id}`} className="font-bold text-white hover:text-indigo-400 transition-colors">
                      {profile.displayName}
                    </Link>
                    <span className="text-neutral-500 text-sm">
                      • {new Date(activity.createdAt).toLocaleDateString('ar-SA')}
                    </span>
                  </div>

                  <div className="text-sm text-neutral-400 mb-2">
                    {activity.type === 'review' ? (
                      <span className="flex items-center gap-1"><Star size={16} className="text-yellow-500" /> كتب مراجعة للعبة</span>
                    ) : (
                      <span className="flex items-center gap-1">
                        {activity.status === 'played' ? <CheckCircle2 size={16} className="text-green-500"/> : 
                         activity.status === 'playing' ? <Gamepad2 size={16} className="text-indigo-500"/> : 
                         <ListTodo size={16} className="text-blue-500"/>}
                        أضاف اللعبة إلى قائمة {activity.status === 'played' ? 'لعبتها' : activity.status === 'playing' ? 'ألعبها حالياً' : 'ألعبها لاحقاً'}
                      </span>
                    )}
                  </div>
                  
                  <Link to={`/game/${activity.gameId}`} className="text-xl font-bold text-white hover:text-indigo-400 transition-colors block mb-2">
                    {activity.gameName}
                  </Link>

                  {activity.type === 'review' && (
                    <div className="flex items-center gap-2 text-yellow-500 font-bold bg-yellow-500/10 w-fit px-2 py-1 rounded-lg">
                      <Star size={14} className="fill-current" /> {activity.rating} / 5
                    </div>
                  )}

                  <div className="sm:hidden text-xs text-neutral-500 mt-4 text-left">
                    {new Date(activity.createdAt).toLocaleDateString('ar-SA')}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
