export default function SettingsPage() {
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Configure your discipline system</p>
      </div>

      <div className="glass-card p-6 space-y-4 animate-fade-in">
        <h2 className="section-title">About</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Discipline is a behavioral tracking system designed to measure daily execution
          and consistency. It calculates a discipline score based on your routine adherence,
          deep work execution, learning output, and health habits.
        </p>
        <div className="flex items-center gap-3 text-xs text-muted-foreground font-mono">
          <span className="topbar-badge">v1.0</span>
          <span>React + TypeScript + Tailwind</span>
        </div>
      </div>

      <div className="glass-card p-6 space-y-3 animate-fade-in" style={{ animationDelay: '100ms' }}>
        <h2 className="section-title">Scoring System</h2>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>Each completed task earns <span className="text-foreground font-mono">+1</span> point.</p>
          <p><span className="text-success font-semibold">🔥 Elite</span> — 85%+ completion</p>
          <p><span className="text-warning font-semibold">⚡ Good</span> — 50–84% completion</p>
          <p><span className="text-destructive font-semibold">❌ Missed</span> — Below 50%</p>
        </div>
      </div>
    </div>
  );
}
