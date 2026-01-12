/**
 * Layout Component
 * 
 * Main layout wrapper that includes sidebar, header, and content area.
 * Handles responsive behavior for mobile and desktop.
 */

import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { X } from 'lucide-react';

// Page title mapping based on route
const pageTitles = {
  '/': 'Dashboard',
  '/clients': 'Clients',
  '/generator': 'Comment Generator',
  '/analyzer': 'Content Analyzer',
  '/competitors': 'Competitor Tracking',
  '/history': 'Comment History',
  '/settings': 'Settings',
};

export default function Layout() {
  const location = useLocation();
  
  // Sidebar state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Get page title based on current route
  const getPageTitle = () => {
    // Check for exact match first
    if (pageTitles[location.pathname]) {
      return pageTitles[location.pathname];
    }
    
    // Check for partial matches (e.g., /clients/123)
    for (const [path, title] of Object.entries(pageTitles)) {
      if (location.pathname.startsWith(path) && path !== '/') {
        // Special case for client detail
        if (path === '/clients' && location.pathname !== '/clients') {
          return 'Client Details';
        }
        // Special case for settings tabs
        if (path === '/settings') {
          return 'Settings';
        }
        return title;
      }
    }
    
    return '';
  };

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Close mobile menu on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  // Load sidebar collapsed state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    if (saved !== null) {
      setSidebarCollapsed(JSON.parse(saved));
    }
  }, []);

  // Save sidebar collapsed state to localStorage
  const toggleSidebar = () => {
    const newState = !sidebarCollapsed;
    setSidebarCollapsed(newState);
    localStorage.setItem('sidebarCollapsed', JSON.stringify(newState));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Skip link for keyboard users */}
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:bg-white dark:focus:bg-[var(--card-soft)] focus:px-3 focus:py-2 focus:rounded-md focus:ring-2 focus:ring-primary-500">Skip to main content</a>
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={toggleSidebar}
        />
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Sidebar */}
          <div className="fixed inset-y-0 left-0 w-64 bg-white dark:bg-[var(--card)] shadow-xl border-r border-gray-200 dark:border-gray-800">
            {/* Close button */}
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="absolute top-4 right-4 p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md"
            >
              <X className="h-5 w-5" />
            </button>

            <Sidebar
              collapsed={false}
              onToggle={() => setMobileMenuOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Main content area */}
      <div
        className="transition-all duration-300 ease-in-out"
        style={{
          marginLeft: typeof window !== 'undefined' && window.innerWidth >= 1024
            ? sidebarCollapsed ? '4rem' : '16rem'
            : '0',
        }}
      >
        {/* Header */}
        <Header
          onMenuClick={() => setMobileMenuOpen(true)}
          pageTitle={getPageTitle()}
        />

        {/* Page content */}
        <main id="main-content" className="pt-6 p-4 sm:p-6 lg:p-8" tabIndex={-1}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
