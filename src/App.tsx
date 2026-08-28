import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { auth, db } from './lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useStore } from './store/useStore';
import { Menu, X, Home, Search, User, LogOut, Gamepad2, Settings, ListVideo, Flame, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

import HomePage from './pages/HomePage';
import PopularGamesPage from './pages/PopularGamesPage';
import UpcomingGamesPage from './pages/UpcomingGamesPage';
import SearchPage from './pages/SearchPage';
import ProfilePage from './pages/ProfilePage';
import GameDetailsPage from './pages/GameDetailsPage';
import AuthPage from './pages/AuthPage';
import PublicProfilePage from './pages/PublicProfilePage';
import ListsPage from './pages/ListsPage';
import FriendsActivityPage from './pages/FriendsActivityPage';

export function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

function NavigationDrawer({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { user, userProfile } = useStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await signOut(auth);
    onClose();
  };

  const navItems = [
    { name: 'الرئيسية', path: '/', icon: Home },
    { name: 'البحث', path: '/search', icon: Search },
    { name: 'الألعاب القادمة', path: '/upcoming', icon: Flame },
    { name: 'الملف الشخصي', path: '/profile', icon: User, requiresAuth: true },
    { name: 'قوائمي', path: '/lists', icon: ListVideo, requiresAuth: true },
    { name: 'نشاطات الأصدقاء', path: '/friends-activity', icon: Users, requiresAuth: true },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
            className="fixed top-0 right-0 h-full w-72 bg-neutral-900 border-l border-neutral-800 z-50 p-6 flex flex-col shadow-2xl"
          >
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-2 text-indigo-500">
                <Gamepad2 size={28} />
                <span className="text-xl font-bold text-white">PixelLog</span>
              </div>
              <button onClick={onClose} className="p-2 bg-neutral-800 rounded-full text-neutral-400 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            {user && userProfile && (
              <div className="flex items-center gap-4 mb-8 p-4 bg-neutral-800/50 rounded-2xl border border-neutral-800">
                <img src={userProfile.photoURL || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + user.uid} alt="Profile" className="w-12 h-12 rounded-full object-cover border-2 border-indigo-500" />
                <div className="flex flex-col">
                  <span className="text-white font-semibold">{userProfile.displayName || 'لاعب'}</span>
                  <span className="text-neutral-400 text-sm">@{userProfile.username || 'user'}</span>
                </div>
              </div>
            )}

            <nav className="flex-1 flex flex-col gap-2">
              {navItems.map((item) => {
                if (item.requiresAuth && !user) return null;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={onClose}
                    className={cn(
                      "flex items-center gap-4 p-4 rounded-xl transition-all font-medium",
                      isActive ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20" : "text-neutral-400 hover:bg-neutral-800 hover:text-white"
                    )}
                  >
                    <item.icon size={20} />
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            <div className="mt-auto pt-6 border-t border-neutral-800">
              {user ? (
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-4 p-4 w-full text-red-400 hover:bg-red-500/10 rounded-xl transition-colors font-medium"
                >
                  <LogOut size={20} />
                  تسجيل الخروج
                </button>
              ) : (
                <Link
                  to="/auth"
                  onClick={onClose}
                  className="flex items-center justify-center gap-2 p-4 w-full bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/20"
                >
                  <User size={20} />
                  تسجيل الدخول
                </Link>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function Layout({ children }: { children: React.ReactNode }) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-50 flex flex-col font-sans" dir="rtl">
      <header className="sticky top-0 z-30 bg-neutral-950/80 backdrop-blur-md border-b border-neutral-800">
        <div className="flex items-center justify-between p-4 max-w-md mx-auto w-full">
          <Link to="/" className="flex items-center gap-2 text-indigo-500">
            <Gamepad2 size={28} />
            <span className="text-xl font-bold text-white tracking-tight">PixelLog</span>
          </Link>
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="p-2 bg-neutral-900 rounded-full text-neutral-300 hover:text-white transition-colors border border-neutral-800"
          >
            <Menu size={24} />
          </button>
        </div>
      </header>

      <NavigationDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />

      <main className="flex-1 w-full max-w-md mx-auto p-4 pb-24">
        {children}
      </main>
      
      {/* Optional mobile bottom nav for quicker access, but sidebar handles it. Let's keep it simple with just sidebar as requested. */}
    </div>
  );
}

export default function App() {
  const { setUser, setUserProfile } = useStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        try {
          const docRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setUserProfile(docSnap.data() as any);
          } else {
              // Wait for profile creation in auth page
              setUserProfile(null);
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
          setUserProfile(null);
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [setUser, setUserProfile]);

  if (loading) {
    return <div className="min-h-screen bg-neutral-950 flex items-center justify-center text-indigo-500"><Gamepad2 className="animate-spin" size={48} /></div>;
  }

  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/popular" element={<PopularGamesPage />} />
          <Route path="/upcoming" element={<UpcomingGamesPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/lists" element={<ListsPage />} />
          <Route path="/friends-activity" element={<FriendsActivityPage />} />
          <Route path="/user/:id" element={<PublicProfilePage />} />
          <Route path="/game/:id" element={<GameDetailsPage />} />
          <Route path="*" element={<div className="text-center py-20">الصفحة غير موجودة</div>} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
