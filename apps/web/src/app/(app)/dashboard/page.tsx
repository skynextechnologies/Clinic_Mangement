'use client';

import React from 'react';
import { PageHeader } from '../../../components/shell/page-header';
import { useAuth } from '../../../providers/auth-provider';

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome back, ${user?.firstName || 'Staff'}!`}
        subtitle="ClinicOS operational dashboard & daily queue summary."
        actions={
          <button
            type="button"
            className="px-4 py-2 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg shadow transition-colors"
          >
            + Quick Action
          </button>
        }
      />

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl p-4 shadow-sm space-y-1">
          <p className="text-xs text-muted-foreground font-medium">Today's Revenue</p>
          <p className="text-2xl font-bold text-foreground font-mono">$0.00</p>
          <p className="text-[10px] text-muted-foreground">0 invoices issued today</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 shadow-sm space-y-1">
          <p className="text-xs text-muted-foreground font-medium">Appointments Today</p>
          <p className="text-2xl font-bold text-foreground font-mono">0</p>
          <p className="text-[10px] text-muted-foreground">0 scheduled, 0 checked in</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 shadow-sm space-y-1">
          <p className="text-xs text-muted-foreground font-medium">Patients in Queue</p>
          <p className="text-2xl font-bold text-foreground font-mono">0</p>
          <p className="text-[10px] text-muted-foreground">Average wait: 0 mins</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 shadow-sm space-y-1">
          <p className="text-xs text-muted-foreground font-medium">Stock Alerts</p>
          <p className="text-2xl font-bold text-foreground font-mono">0</p>
          <p className="text-[10px] text-success">All items healthy</p>
        </div>
      </div>

      {/* Empty State Banner */}
      <div className="bg-card border border-border rounded-xl p-8 text-center space-y-3">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-foreground">No appointments scheduled today</h3>
        <p className="text-xs text-muted-foreground max-w-sm mx-auto">
          Your daily queue is clear. Use the global search (Ctrl+K) or Register Patient to get
          started.
        </p>
      </div>
    </div>
  );
}
