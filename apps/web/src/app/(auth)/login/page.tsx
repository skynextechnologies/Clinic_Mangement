import Link from 'next/link';

export default function LoginPage() {
  return (
    <div className="w-full max-w-md p-8 rounded-xl bg-card border border-border shadow-lg space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight">Staff Login</h1>
        <p className="text-sm text-muted-foreground">Sign in to your ClinicOS account</p>
      </div>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Email Address</label>
          <input
            type="email"
            placeholder="owner@clinicos.local"
            className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Password</label>
          <input
            type="password"
            placeholder="••••••••••••"
            className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <button
          type="button"
          className="w-full py-2.5 rounded-md bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition"
        >
          Sign In
        </button>
      </div>
      <div className="text-center text-xs text-muted-foreground">
        Need help? Contact system administrator or return to{' '}
        <Link href="/" className="text-primary hover:underline">
          Home
        </Link>
      </div>
    </div>
  );
}
