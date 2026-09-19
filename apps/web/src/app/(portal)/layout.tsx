import React from 'react';

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-card p-4 flex items-center justify-between">
        <div className="font-bold text-primary">💙 ClinicOS Patient Portal</div>
        <div className="text-sm font-medium text-muted-foreground">Welcome, John Doe</div>
      </header>
      <main className="flex-1 p-4 max-w-4xl mx-auto w-full">{children}</main>
    </div>
  );
}
