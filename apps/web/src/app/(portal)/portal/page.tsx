export default function PatientPortalHomePage() {
  return (
    <div className="space-y-6">
      <div className="p-6 rounded-xl bg-primary/10 border border-primary/20 space-y-2">
        <h1 className="text-xl font-bold text-primary">Your Health Overview</h1>
        <p className="text-sm text-muted-foreground">
          View upcoming appointments, lab results, prescriptions, and invoices safely online.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-lg border border-border bg-card shadow-sm space-y-2">
          <h2 className="font-semibold text-sm">📅 Next Appointment</h2>
          <p className="text-xs text-muted-foreground">Tomorrow at 10:00 AM - Dr. Smith</p>
        </div>
        <div className="p-4 rounded-lg border border-border bg-card shadow-sm space-y-2">
          <h2 className="font-semibold text-sm">💊 Active Prescriptions</h2>
          <p className="text-xs text-muted-foreground">Amoxicillin 500mg - 2 active</p>
        </div>
        <div className="p-4 rounded-lg border border-border bg-card shadow-sm space-y-2">
          <h2 className="font-semibold text-sm">🧪 Latest Lab Report</h2>
          <p className="text-xs text-muted-foreground">Complete Blood Count (CBC) - Normal</p>
        </div>
      </div>
    </div>
  );
}
