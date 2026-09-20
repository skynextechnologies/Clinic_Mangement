'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';

import { useAuth } from '../../providers/auth-provider';

export function TopBar({
  onOpenCommandPalette,
  onOpenShortcuts,
  onToggleSidebar,
}: {
  onOpenCommandPalette: () => void;
  onOpenShortcuts: () => void;
  onToggleSidebar: () => void;
}) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // Compute breadcrumbs from pathname
  const pathSegments = pathname.split('/').filter(Boolean);

  return (
    <header className="h-16 bg-card border-b border-border flex items-center justify-between px-4 sm:px-6 shadow-sm sticky top-0 z-30">
      <div className="flex items-center space-x-3">
        {/* Toggle Sidebar Button */}
        <button
          type="button"
          onClick={onToggleSidebar}
          className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-accent transition-colors"
          aria-label="Toggle sidebar"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>

        {/* Breadcrumbs */}
        <nav
          aria-label="Breadcrumb"
          className="hidden sm:flex items-center space-x-2 text-xs text-muted-foreground"
        >
          <Link href="/dashboard" className="hover:text-foreground">
            ClinicOS
          </Link>
          {pathSegments.map((segment, index) => (
            <React.Fragment key={index}>
              <span>/</span>
              <span className="capitalize font-medium text-foreground">
                {segment.replace(/-/g, ' ')}
              </span>
            </React.Fragment>
          ))}
        </nav>
      </div>

      <div className="flex items-center space-x-3">
        {/* Command Palette Trigger */}
        <button
          type="button"
          onClick={onOpenCommandPalette}
          className="flex items-center space-x-2 px-3 py-1.5 text-xs text-muted-foreground bg-background border border-input rounded-lg hover:border-ring transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <span className="hidden md:inline">Search or command...</span>
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground bg-muted border border-border rounded">
            Ctrl+K
          </kbd>
        </button>

        {/* Keyboard Shortcuts Trigger */}
        <button
          type="button"
          onClick={onOpenShortcuts}
          className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-accent transition-colors hidden sm:block"
          title="Keyboard Shortcuts (?)"
        >
          <span className="text-xs font-mono font-bold">?</span>
        </button>

        {/* Theme Toggle */}
        <button
          type="button"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-accent transition-colors"
          title="Toggle Theme"
        >
          {theme === 'dark' ? (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
          ) : (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
              />
            </svg>
          )}
        </button>

        {/* Notifications Bell */}
        <div className="relative">
          <button
            type="button"
            className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-accent transition-colors relative"
            title="Notifications"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary ring-2 ring-card" />
          </button>
        </div>

        {/* User Menu */}
        {user && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center space-x-2 p-1 rounded-full hover:bg-accent transition-colors"
            >
              <div className="h-8 w-8 rounded-full bg-primary/20 text-primary font-bold text-xs flex items-center justify-center">
                {user.firstName[0]}
                {user.lastName[0]}
              </div>
            </button>

            {userMenuOpen && (
              <div
                className="absolute right-0 mt-2 w-56 rounded-xl bg-card border border-border shadow-xl p-2 space-y-1 z-50 animate-in fade-in duration-100"
                onClick={() => setUserMenuOpen(false)}
              >
                <div className="px-3 py-2 border-b border-border text-xs">
                  <p className="font-semibold text-foreground">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-muted-foreground truncate">{user.email}</p>
                </div>
                <Link
                  href="/security"
                  className="block px-3 py-2 text-xs font-medium text-foreground hover:bg-accent rounded-lg transition-colors"
                >
                  Account Security & 2FA
                </Link>
                <button
                  type="button"
                  onClick={logout}
                  className="w-full text-left px-3 py-2 text-xs font-medium text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
