import React, { useState } from 'react';
import { auth, db, googleProvider } from '../lib/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { Gamepad2 } from 'lucide-react';
import { useStore } from '../store/useStore';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { setUserProfile } = useStore();

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    try {
      const userCred = await signInWithPopup(auth, googleProvider);
      const docRef = doc(db, 'users', userCred.user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setUserProfile(docSnap.data() as any);
      } else {
        const profile = {
          username: userCred.user.email?.split('@')[0].toLowerCase() || 'user' + Math.floor(Math.random() * 10000),
          displayName: userCred.user.displayName || 'لاعب',
          bio: 'محب للألعاب',
          photoURL: userCred.user.photoURL || '',
          bannerURL: '',
          profileColor: '#6366f1',
          favoriteGames: [],
          createdAt: new Date().toISOString()
        };
        await setDoc(docRef, profile);
        setUserProfile(profile);
      }
      navigate('/');
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/operation-not-allowed') {
         setError('تسجيل الدخول بواسطة Google معطل. يرجى تفعيله من لوحة تحكم Firebase.');
      } else {
         setError(err.message || 'حدث خطأ أثناء المصادقة بواسطة جوجل');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        const userCred = await signInWithEmailAndPassword(auth, email, password);
        try {
          const docRef = doc(db, 'users', userCred.user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setUserProfile(docSnap.data() as any);
          }
        } catch (e) {
          console.error("Failed to fetch user profile", e);
        }
        navigate('/');
      } else {
        const userCred = await createUserWithEmailAndPassword(auth, email, password);
        const profile = {
          username: username.toLowerCase(),
          displayName: username,
          bio: 'محب للألعاب',
          photoURL: '',
          bannerURL: '',
          profileColor: '#6366f1',
          favoriteGames: [],
          createdAt: new Date().toISOString()
        };
        await setDoc(doc(db, 'users', userCred.user.uid), profile);
        setUserProfile(profile);
        navigate('/');
      }
    } catch (err: any) {
      if (err.code === 'auth/operation-not-allowed') {
        setError('تسجيل الدخول بالبريد الإلكتروني معطل في Firebase. يرجى تفعيله من (Authentication > Sign-in method) أو استخدم جوجل.');
      } else {
        setError(err.message || 'حدث خطأ أثناء المصادقة');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col justify-center max-w-sm mx-auto">
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-500/10 text-indigo-500 mb-4">
          <Gamepad2 size={32} />
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">{isLogin ? 'مرحباً بعودتك' : 'إنشاء حساب جديد'}</h1>
        <p className="text-neutral-400">سجل ألعابك، قيمها، وشاركها مع أصدقائك</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm text-center">
            {error}
          </div>
        )}
        
        {!isLogin && (
          <div>
            <label className="block text-sm font-medium text-neutral-400 mb-1">اسم المستخدم</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
              placeholder="gamer123"
            />
          </div>
        )}
        
        <div>
          <label className="block text-sm font-medium text-neutral-400 mb-1">البريد الإلكتروني</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
            placeholder="name@example.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-400 mb-1">كلمة المرور</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 rounded-xl transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50 mt-4"
        >
          {loading ? 'جاري المعالجة...' : (isLogin ? 'تسجيل الدخول' : 'إنشاء حساب')}
        </button>
      </form>

      <div className="relative mt-6 mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-neutral-800"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-neutral-950 text-neutral-500">أو</span>
        </div>
      </div>

      <button
        onClick={handleGoogleSignIn}
        disabled={loading}
        className="w-full bg-white text-black hover:bg-neutral-200 font-medium py-3 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
        تسجيل الدخول بواسطة Google
      </button>

      <div className="mt-6 text-center">
        <button
          onClick={() => setIsLogin(!isLogin)}
          className="text-neutral-400 hover:text-white transition-colors text-sm"
        >
          {isLogin ? 'ليس لديك حساب؟ أنشئ حساباً جديداً' : 'لديك حساب بالفعل؟ سجل دخولك'}
        </button>
      </div>
    </div>
  );
}
