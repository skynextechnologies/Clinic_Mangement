import React from 'react';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex bg-background">
      <aside className="w-64 border-r border-border bg-card p-4 hidden md:block">
        <div className="font-bold text-lg mb-6 text-primary">🏥 ClinicOS Staff</div>
        <nav className="space-y-1 text-sm font-medium text-muted-foreground">
          <div className="px-3 py-2 rounded-md bg-accent text-accent-foreground font-semibold">
            📊 Dashboard
          </div>
          <div className="px-3 py-2 rounded-md hover:bg-muted/50 cursor-pointer">👥 Patients</div>
          <div className="px-3 py-2 rounded-md hover:bg-muted/50 cursor-pointer">
            📅 Appointments
          </div>
          <div className="px-3 py-2 rounded-md hover:bg-muted/50 cursor-pointer">🩺 Encounters</div>
          <div className="px-3 py-2 rounded-md hover:bg-muted/50 cursor-pointer">🧪 Lab Orders</div>
          <div className="px-3 py-2 rounded-md hover:bg-muted/50 cursor-pointer">💊 Pharmacy</div>
          <div className="px-3 py-2 rounded-md hover:bg-muted/50 cursor-pointer">💳 Billing</div>
        </nav>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
