import Link from 'next/link';

export default function PublicHomePage() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-gradient-to-b from-background to-muted/30">
      <div className="max-w-3xl space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
          🏥 ClinicOS Multi-Role Healthcare System
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground">
          Modern, Production-Grade Clinic Management
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Streamlining patient care, appointment scheduling, electronic medical records, laboratory
          workflow, pharmacy inventory, and billing.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <Link
            href="/dev/design-system"
            className="px-6 py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition shadow-md"
          >
            🎨 View Interactive Design System
          </Link>
          <Link
            href="/login"
            className="px-6 py-3 rounded-lg bg-secondary text-secondary-foreground font-semibold hover:bg-secondary/80 transition border border-border"
          >
            🔐 Staff Login
          </Link>
        </div>
      </div>
    </main>
  );
}
