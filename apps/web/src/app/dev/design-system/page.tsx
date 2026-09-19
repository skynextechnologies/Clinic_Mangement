'use client';

import {
  AlertTriangle,
  Calendar,
  CheckCircle,
  Clock,
  Heart,
  Moon,
  Plus,
  Search,
  Sun,
  User,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';

export default function DesignSystemPage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground p-4 sm:p-8 max-w-7xl mx-auto space-y-12">
      {/* Top Header */}
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-border">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-2">
            🎨 Phase 0 · T-006 Deliverable
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">ClinicOS Design System</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Core tokens, typography, primitives, interactive controls, and domain patterns.
          </p>
        </div>

        {mounted && (
          <button
            type="button"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-card text-card-foreground font-medium text-sm hover:bg-accent transition shadow-sm"
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-4 h-4 text-amber-400" /> Light Mode
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-indigo-600" /> Dark Mode
              </>
            )}
          </button>
        )}
      </header>

      {/* 1. Color Palettes & Tokens */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight border-b border-border pb-2">
          1. Color System & Tokens
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
          <div className="p-4 rounded-xl border border-border bg-primary text-primary-foreground space-y-1 shadow-sm">
            <div className="font-semibold text-sm">Primary</div>
            <div className="text-xs opacity-80">hsl(215 85% 45%)</div>
          </div>
          <div className="p-4 rounded-xl border border-border bg-secondary text-secondary-foreground space-y-1 shadow-sm">
            <div className="font-semibold text-sm">Secondary</div>
            <div className="text-xs opacity-80">hsl(210 40% 94%)</div>
          </div>
          <div className="p-4 rounded-xl border border-border bg-destructive text-destructive-foreground space-y-1 shadow-sm">
            <div className="font-semibold text-sm">Destructive</div>
            <div className="text-xs opacity-80">hsl(0 84% 60%)</div>
          </div>
          <div className="p-4 rounded-xl border border-border bg-emerald-500 text-white space-y-1 shadow-sm">
            <div className="font-semibold text-sm">Success</div>
            <div className="text-xs opacity-80">Emerald 500</div>
          </div>
          <div className="p-4 rounded-xl border border-border bg-amber-500 text-white space-y-1 shadow-sm">
            <div className="font-semibold text-sm">Warning</div>
            <div className="text-xs opacity-80">Amber 500</div>
          </div>
          <div className="p-4 rounded-xl border border-border bg-card text-card-foreground space-y-1 shadow-sm">
            <div className="font-semibold text-sm">Card Surface</div>
            <div className="text-xs text-muted-foreground">var(--card)</div>
          </div>
        </div>
      </section>

      {/* 2. Typography Scale */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight border-b border-border pb-2">
          2. Typography Scale
        </h2>
        <div className="space-y-3 p-6 rounded-xl border border-border bg-card">
          <div className="text-4xl font-extrabold">H1 Heading - 36px Extra Bold</div>
          <div className="text-2xl font-bold">H2 Heading - 24px Bold</div>
          <div className="text-lg font-semibold">H3 Heading - 18px Semibold</div>
          <div className="text-base font-normal">
            Body Regular - 16px Inter font rendering patient health records cleanly.
          </div>
          <div className="text-sm text-muted-foreground">
            Small Muted Text - 14px Secondary metadata information.
          </div>
          <div className="text-xs font-mono bg-muted p-2 rounded max-w-md">
            Monospace Code - 12px `MRN-2026-88491`
          </div>
        </div>
      </section>

      {/* 3. Interactive Controls */}
      <section className="space-y-6">
        <h2 className="text-xl font-bold tracking-tight border-b border-border pb-2">
          3. Button Variants & States
        </h2>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            className="px-4 py-2 rounded-md bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition"
          >
            Primary Action
          </button>
          <button
            type="button"
            className="px-4 py-2 rounded-md bg-secondary text-secondary-foreground font-medium text-sm hover:bg-secondary/80 transition border border-border"
          >
            Secondary Action
          </button>
          <button
            type="button"
            className="px-4 py-2 rounded-md border border-input bg-background font-medium text-sm hover:bg-accent transition"
          >
            Outline Button
          </button>
          <button
            type="button"
            className="px-4 py-2 rounded-md bg-destructive text-destructive-foreground font-medium text-sm hover:bg-destructive/90 transition"
          >
            Destructive Action
          </button>
          <button
            type="button"
            disabled
            className="px-4 py-2 rounded-md bg-muted text-muted-foreground font-medium text-sm opacity-50 cursor-not-allowed"
          >
            Disabled Button
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground font-medium text-sm"
          >
            <Plus className="w-4 h-4" /> New Patient
          </button>
        </div>
      </section>

      {/* 4. Clinical Status Badges */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight border-b border-border pb-2">
          4. Appointment & Queue Status Badges
        </h2>
        <div className="flex flex-wrap items-center gap-3">
          <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-semibold">
            🗓 Scheduled
          </span>
          <span className="px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-semibold">
            ✓ Confirmed
          </span>
          <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
            🟢 Checked In
          </span>
          <span className="px-3 py-1 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs font-semibold">
            🩺 In Consultation
          </span>
          <span className="px-3 py-1 rounded-full bg-gray-500/10 text-gray-600 dark:text-gray-400 text-xs font-semibold">
            ✨ Completed
          </span>
          <span className="px-3 py-1 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-semibold">
            ❌ Cancelled
          </span>
          <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-semibold">
            ⚠️ No Show
          </span>
        </div>
      </section>

      {/* 5. Form Primitives */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight border-b border-border pb-2">
          5. Form Inputs & Controls
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 rounded-xl border border-border bg-card">
          <div className="space-y-2">
            <label className="block text-sm font-medium">Standard Text Input</label>
            <input
              type="text"
              placeholder="Enter patient full name..."
              className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium">Input with Icon</label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search MRN or phone..."
                className="w-full pl-9 pr-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium">Select Dropdown</label>
            <select className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring">
              <option>General Practice</option>
              <option>Pediatrics</option>
              <option>Cardiology</option>
              <option>Dermatology</option>
            </select>
          </div>
        </div>
      </section>

      {/* 6. Interactive Toast Notifications */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight border-b border-border pb-2">
          6. Toast Notifications (Sonner)
        </h2>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => toast.success('Patient appointment confirmed successfully!')}
            className="px-4 py-2 rounded-md bg-emerald-600 text-white font-medium text-sm hover:bg-emerald-700 transition"
          >
            Trigger Success Toast
          </button>
          <button
            type="button"
            onClick={() =>
              toast.error('Allergy Conflict Alert: Patient is allergic to Penicillin!')
            }
            className="px-4 py-2 rounded-md bg-rose-600 text-white font-medium text-sm hover:bg-rose-700 transition"
          >
            Trigger Error Toast
          </button>
          <button
            type="button"
            onClick={() =>
              toast.warning('Stock Alert: Amoxicillin on-hand is below reorder level!')
            }
            className="px-4 py-2 rounded-md bg-amber-600 text-white font-medium text-sm hover:bg-amber-700 transition"
          >
            Trigger Warning Toast
          </button>
        </div>
      </section>

      {/* 7. Clinical Domain Patterns */}
      <section className="space-y-6">
        <h2 className="text-xl font-bold tracking-tight border-b border-border pb-2">
          7. Clinical Domain Component Patterns
        </h2>

        {/* Patient Context Bar */}
        <div className="p-4 rounded-xl border border-border bg-card shadow-sm space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                <User className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-lg">Jane Doe</h3>
                  <span className="px-2 py-0.5 rounded text-xs font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-400">
                    ⭐ VIP Break-Glass
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">
                  MRN:{' '}
                  <span className="font-mono text-foreground font-semibold">MRN-2026-0042</span> ·
                  34 yrs / Female · O+ Positive
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                className="px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90"
              >
                + New Consultation
              </button>
            </div>
          </div>

          {/* Allergy Banner */}
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 flex items-center gap-2 text-xs font-semibold">
            <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            <span>CRITICAL ALLERGY: Severe reaction to Penicillin & NSAIDs</span>
          </div>
        </div>

        {/* Vital Signs Card Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl border border-border bg-card shadow-sm space-y-1">
            <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
              <span>Blood Pressure</span>
              <Heart className="w-4 h-4 text-rose-500" />
            </div>
            <div className="text-xl font-bold">
              120/80 <span className="text-xs font-normal text-muted-foreground">mmHg</span>
            </div>
            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              Normal
            </span>
          </div>

          <div className="p-4 rounded-xl border border-border bg-card shadow-sm space-y-1">
            <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
              <span>Pulse Rate</span>
              <Clock className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-xl font-bold">
              72 <span className="text-xs font-normal text-muted-foreground">bpm</span>
            </div>
            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              Normal
            </span>
          </div>

          <div className="p-4 rounded-xl border border-border bg-card shadow-sm space-y-1">
            <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
              <span>Body Temp</span>
              <Calendar className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-xl font-bold">
              38.2 <span className="text-xs font-normal text-muted-foreground">°C</span>
            </div>
            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400">
              High Fever
            </span>
          </div>

          <div className="p-4 rounded-xl border border-border bg-card shadow-sm space-y-1">
            <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
              <span>SpO2 Oxygen</span>
              <CheckCircle className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-xl font-bold">99%</div>
            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              Optimal
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
