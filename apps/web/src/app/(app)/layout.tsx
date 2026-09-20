'use client';

import React, { useState } from 'react';
import { CommandPalette } from '../../components/shell/command-palette';
import { KeyboardShortcutsDialog } from '../../components/shell/keyboard-shortcuts-dialog';
import { SidebarNav } from '../../components/shell/sidebar-nav';
import { TopBar } from '../../components/shell/top-bar';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <SidebarNav isCollapsed={sidebarCollapsed} />
      </div>

      {/* Mobile Drawer Sidebar */}
      {mobileDrawerOpen && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileDrawerOpen(false)}
          />
          <div className="relative z-10 w-64 h-full">
            <SidebarNav onCloseMobile={() => setMobileDrawerOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar
          onToggleSidebar={() => {
            if (window.innerWidth < 1024) {
              setMobileDrawerOpen(!mobileDrawerOpen);
            } else {
              setSidebarCollapsed(!sidebarCollapsed);
            }
          }}
          onOpenCommandPalette={() => setCommandPaletteOpen(true)}
          onOpenShortcuts={() => setShortcutsOpen(true)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>

      {/* Command Palette & Shortcuts Dialogs */}
      <CommandPalette isOpen={commandPaletteOpen} onClose={() => setCommandPaletteOpen(false)} />
      <KeyboardShortcutsDialog isOpen={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
    </div>
  );
}
