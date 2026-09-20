'use client';

import React, { useEffect } from 'react';

interface ShortcutGroup {
  category: string;
  items: { key: string; description: string }[];
}

export function KeyboardShortcutsDialog({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const groups: ShortcutGroup[] = [
    {
      category: 'Global & Navigation',
      items: [
        { key: 'Ctrl / Cmd + K', description: 'Open command palette' },
        { key: 'Shift + ?', description: 'Show keyboard shortcuts' },
        { key: 'Esc', description: 'Close dialog or modal' },
      ],
    },
    {
      category: 'Quick Actions',
      items: [
        { key: 'G P', description: 'Go to Patients' },
        { key: 'G A', description: 'Go to Appointments' },
        { key: 'N P', description: 'Register New Patient' },
      ],
    },
  ];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '?' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        e.preventDefault();
        if (isOpen) onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150"
    >
      <div className="w-full max-w-lg rounded-xl bg-card border border-border p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h2 id="shortcuts-dialog-title" className="text-lg font-bold text-foreground">
            Keyboard Shortcuts
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground text-sm font-medium"
          >
            &times;
          </button>
        </div>

        <div className="space-y-4">
          {groups.map((group) => (
            <div key={group.category} className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {group.category}
              </h3>
              <div className="divide-y divide-border border border-border rounded-lg overflow-hidden">
                {group.items.map((item) => (
                  <div
                    key={item.key}
                    className="flex justify-between items-center p-2.5 text-xs bg-background"
                  >
                    <span className="text-foreground font-medium">{item.description}</span>
                    <kbd className="px-2 py-0.5 font-mono text-[10px] text-muted-foreground bg-muted border border-border rounded shadow-sm">
                      {item.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
