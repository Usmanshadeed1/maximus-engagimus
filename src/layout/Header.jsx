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

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle sign out
  const handleSignOut = async () => {
    setUserMenuOpen(false);
    await signOut();
    navigate('/login');
  };

  // Get user initials for avatar
  const getInitials = () => {
    if (profile?.full_name) {
      return profile.full_name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return user?.email?.[0]?.toUpperCase() || 'U';
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-200">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6">
        {/* Left side */}
        <div className="flex items-center gap-4">
          {/* Mobile menu button */}
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 -ml-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Page title */}
          {pageTitle && (
            <h1 className="text-xl font-semibold text-gray-900">
              {pageTitle}
            </h1>
          )}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* Notifications (placeholder) */}
          <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md relative">
            <Bell className="h-5 w-5" />
            {/* Notification dot */}
            {/* <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-error-500 rounded-full"></span> */}
          </button>

          {/* User menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {/* Avatar */}
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.full_name || 'User'}
                  className="h-8 w-8 rounded-full object-cover"
                />
              ) : (
                <div className="h-8 w-8 rounded-full bg-primary-500 flex items-center justify-center">
                  <span className="text-sm font-medium text-white">
                    {getInitials()}
                  </span>
                </div>
              )}

              {/* Name and org (hidden on mobile) */}
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium text-gray-900 leading-tight">
                  {profile?.full_name || 'User'}
                </p>
                <p className="text-xs text-gray-500 leading-tight">
                  {organization?.name || 'Organization'}
                </p>
              </div>

              <ChevronDown className="h-4 w-4 text-gray-400 hidden sm:block" />
            </button>

            {/* Dropdown menu */}
            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                {/* User info */}
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900">
                    {profile?.full_name || 'User'}
                  </p>
                  <p className="text-sm text-gray-500 truncate">
                    {user?.email}
                  </p>
                </div>

                {/* Menu items */}
                <div className="py-1">
                  <Link
                    to="/settings/profile"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <User className="h-4 w-4" />
                    Your Profile
                  </Link>
                  <Link
                    to="/settings"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <Settings className="h-4 w-4" />
                    Settings
                  </Link>
                </div>

                {/* Sign out */}
                <div className="border-t border-gray-100 py-1">
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-3 px-4 py-2 text-sm text-error-600 hover:bg-error-50 w-full"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
