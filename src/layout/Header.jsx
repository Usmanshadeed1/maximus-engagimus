/**
 * Header Component
 * 
 * Top header bar with user menu and quick actions.
 */

import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  User,
  LogOut,
  Settings,
  ChevronDown,
  Bell,
  Menu,
} from 'lucide-react';

export default function Header({ onMenuClick, pageTitle }) {
  const { user, profile, organization, signOut } = useAuth();
  const navigate = useNavigate();

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  const handleSignOut = async () => {
    setUserMenuOpen(false);
    await signOut();
    navigate('/login');
  };

  const getInitials = () => {
    if (profile?.full_name) {
      return profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2);
    }
    return user?.email?.[0]?.toUpperCase() || 'U';
  };

  return (
    <header className="sticky top-0 z-30 bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto flex items-center justify-between h-16 px-4 sm:px-6">
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            aria-label="Open main menu"
            title="Open menu"
            className="lg:hidden p-2 -ml-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500/50"
          >
            <Menu className="h-6 w-6" />
          </button>

          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-md bg-primary-500 flex items-center justify-center text-white font-bold">⚡</div>
            <div className="hidden sm:block">
              <div className="text-lg font-semibold text-gray-900 dark:text-white">Maximus Engagimus</div>
              {pageTitle && <div className="text-sm text-gray-500 dark:text-gray-300">{pageTitle}</div>}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setTheme(t => t === 'light' ? 'dark' : 'light')}
            className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
            aria-label="Toggle theme"
            title="Toggle theme"
          >
            {theme === 'light' ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v2m0 14v2m9-9h-2M5 12H3m15.36 6.36l-1.42-1.42M7.05 7.05 5.64 5.64m12.02 0L19.36 5.64M7.05 16.95l-1.41 1.41" /></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3C9.243 3 7 5.243 7 8c0 1.657.895 3.106 2.235 3.913A5 5 0 1012 3z" /></svg>
            )}
          </button>

          <button
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md relative focus:outline-none focus:ring-2 focus:ring-primary-500/50"
            aria-label="Notifications"
            title="Notifications"
          >
            <Bell className="h-5 w-5" />
          </button>

          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setUserMenuOpen(u => !u)}
              aria-haspopup="true"
              aria-expanded={userMenuOpen}
              title="User menu"
              className="flex items-center gap-2 p-1.5 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500/50"
            >
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.full_name || 'User'} className="h-9 w-9 rounded-full object-cover" />
              ) : (
                <div className="h-9 w-9 rounded-full bg-primary-500 flex items-center justify-center text-white font-medium">{getInitials()}</div>
              )}
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
                <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{profile?.full_name || 'User'}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-300 truncate">{user?.email}</p>
                </div>
                <div className="py-1">
                  <Link to="/settings/profile" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700">Profile</Link>
                  <Link to="/settings" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700">Settings</Link>
                </div>
                <div className="border-t border-gray-100 dark:border-gray-700 py-1">
                  <button onClick={handleSignOut} className="flex items-center gap-3 px-4 py-2 text-sm text-error-600 hover:bg-error-50 w-full">Sign out</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
