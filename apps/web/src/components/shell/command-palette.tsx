'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface CommandItem {
  id: string;
  title: string;
  category: 'Navigation' | 'Actions';
  href?: string;
  action?: () => void;
  shortcut?: string;
}

export function CommandPalette({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const router = useRouter();
  const [query, setQuery] = useState('');

  const commands: CommandItem[] = [
    {
      id: 'nav-dashboard',
      title: 'Go to Dashboard',
      category: 'Navigation',
      href: '/dashboard',
      shortcut: 'G D',
    },
    {
      id: 'nav-security',
      title: 'Account Security & 2FA',
      category: 'Navigation',
      href: '/security',
      shortcut: 'G S',
    },
    {
      id: 'nav-patients',
      title: 'Patients Directory',
      category: 'Navigation',
      href: '/patients',
      shortcut: 'G P',
    },
    {
      id: 'nav-appointments',
      title: 'Appointments Calendar',
      category: 'Navigation',
      href: '/appointments',
      shortcut: 'G A',
    },
    {
      id: 'action-new-patient',
      title: 'Register New Patient',
      category: 'Actions',
      href: '/patients/new',
      shortcut: 'N P',
    },
    {
      id: 'action-new-appointment',
      title: 'Book New Appointment',
      category: 'Actions',
      href: '/appointments/new',
      shortcut: 'N A',
    },
  ];

  const filtered = commands.filter((c) => c.title.toLowerCase().includes(query.toLowerCase()));

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else setQuery('');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSelect = (cmd: CommandItem) => {
    onClose();
    if (cmd.href) {
      router.push(cmd.href);
    } else if (cmd.action) {
      cmd.action();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="command-palette-title"
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150"
    >
      <div className="w-full max-w-xl rounded-xl bg-card border border-border shadow-2xl overflow-hidden space-y-0">
        <div className="flex items-center px-4 border-b border-border">
          <svg
            className="h-5 w-5 text-muted-foreground mr-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            id="command-palette-title"
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or search..."
            className="w-full py-3.5 text-sm bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono font-medium text-muted-foreground bg-muted border border-border rounded">
            ESC
          </kbd>
        </div>

        <div className="max-h-80 overflow-y-auto p-2 divide-y divide-border/50">
          {filtered.length === 0 ? (
            <p className="p-4 text-center text-xs text-muted-foreground">No commands found.</p>
          ) : (
            filtered.map((cmd) => (
              <button
                key={cmd.id}
                type="button"
                onClick={() => handleSelect(cmd)}
                className="w-full flex items-center justify-between px-3 py-2.5 text-xs text-left rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors group"
              >
                <div className="flex items-center space-x-2.5">
                  <span className="text-[10px] uppercase font-semibold text-muted-foreground group-hover:text-accent-foreground">
                    [{cmd.category}]
                  </span>
                  <span className="font-medium text-foreground group-hover:text-accent-foreground">
                    {cmd.title}
                  </span>
                </div>
                {cmd.shortcut && (
                  <kbd className="px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground bg-muted rounded border border-border">
                    {cmd.shortcut}
                  </kbd>
                )}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
