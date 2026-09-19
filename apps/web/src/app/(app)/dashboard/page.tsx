export default function StaffDashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Clinic Overview</h1>
          <p className="text-sm text-muted-foreground">Welcome to ClinicOS Staff Dashboard</p>
        </div>
        <div className="px-3 py-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
          🟢 Main Branch Active
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-border bg-card shadow-sm space-y-2">
          <span className="text-xs font-medium text-muted-foreground">Appointments Today</span>
          <div className="text-2xl font-bold">24</div>
        </div>
        <div className="p-4 rounded-xl border border-border bg-card shadow-sm space-y-2">
          <span className="text-xs font-medium text-muted-foreground">Patients Checked In</span>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">8</div>
        </div>
        <div className="p-4 rounded-xl border border-border bg-card shadow-sm space-y-2">
          <span className="text-xs font-medium text-muted-foreground">Pending Lab Orders</span>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">5</div>
        </div>
        <div className="p-4 rounded-xl border border-border bg-card shadow-sm space-y-2">
          <span className="text-xs font-medium text-muted-foreground">Total Revenue Today</span>
          <div className="text-2xl font-bold text-primary">$1,850.00</div>
        </div>
      </div>
    </div>
  );
}
