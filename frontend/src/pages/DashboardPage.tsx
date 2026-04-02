import { useMemo } from 'react';
import { useGetLogs, useGetStreak } from '@/hooks/useLogs';
import { getStatusEmoji, getFeedback, getStatus, SCORE_MAX } from '@/lib/scoring';
import { Flame, Brain, Moon, CheckCircle2 } from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { DailyLog } from '@/types';

function HeroScore({ score, maxScore, status, feedback }: {
  score: number; maxScore: number; status: string; feedback: string;
}) {
  const scoreClass = status === 'Elite' ? 'score-elite' : status === 'Good' ? 'score-good' : 'score-missed';
  const cardClass = status === 'Elite' ? 'glass-card-success' : status === 'Good' ? 'glass-card-warning' : 'glass-card-destructive';

  return (
    <div className={cn(cardClass, 'p-8 text-center opacity-0 animate-fade-in-up')}>
      <p className="stat-label mb-3">Today's Discipline Score</p>
      <div className="flex items-baseline justify-center gap-1">
        <span className={cn('text-7xl font-extrabold tracking-tighter animate-score-pop', scoreClass)}>
          {score}
        </span>
        <span className="text-2xl font-semibold text-muted-foreground">/{maxScore}</span>
      </div>
      <div className="flex items-center justify-center gap-2 mt-4">
        <span className="text-xl">{getStatusEmoji(status)}</span>
        <span className={cn('text-lg font-bold', scoreClass)}>{status}</span>
      </div>
      <p className="text-sm text-muted-foreground mt-3 max-w-md mx-auto">{feedback}</p>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, delay }: {
  icon: React.ElementType; label: string; value: string; delay: number;
}) {
  return (
    <div
      className="glass-card-hover p-5 opacity-0 animate-fade-in"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center gap-2.5 mb-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <span className="stat-label">{label}</span>
      </div>
      <p className="stat-value">{value}</p>
    </div>
  );
}

const ChartTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ dataKey: string; color: string; value: number; name: string }>; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card px-3 py-2 text-xs">
      <p className="text-muted-foreground mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.color }}>{p.name}: {p.value}</p>
      ))}
    </div>
  );
};

function DashboardContent({ logs, streakData }: { logs: DailyLog[]; streakData: { currentStreak: number } | undefined }) {
  const today = useMemo(() => {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    return logs.find((c) => c.date === todayStr);
  }, [logs]);

  const weeklyData = useMemo(() => {
    return [...logs]
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-7)
      .map((c) => ({
        day: new Date(c.date).toLocaleDateString('en', { weekday: 'short' }),
        score: c.score,
        hours: c.deepWorkHours,
      }));
  }, [logs]);

  const monthlyData = useMemo(() => {
    const sorted = [...logs].sort((a, b) => a.date.localeCompare(b.date)).slice(-28);
    const weeks: { week: string; avg: number }[] = [];
    for (let i = 0; i < sorted.length; i += 7) {
      const chunk = sorted.slice(i, i + 7);
      weeks.push({
        week: `W${weeks.length + 1}`,
        avg: Math.round(chunk.reduce((s, c) => s + c.score, 0) / chunk.length * 10) / 10,
      });
    }
    return weeks;
  }, [logs]);

  const score = today?.score ?? 0;
  const status = today?.status ?? 'Missed';
  const feedback = today ? getFeedback(score, today) : 'No check-in yet today. Go fill it in.';

  return (
    <>
      <HeroScore score={score} maxScore={SCORE_MAX} status={status} feedback={feedback} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Flame} label="Streak" value={`${streakData?.currentStreak ?? 0} days`} delay={100} />
        <StatCard icon={Brain} label="Deep Work" value={today ? `${today.deepWorkHours}h` : '—'} delay={150} />
        <StatCard icon={Moon} label="Sleep Schedule" value={today?.sleepFollowed ? '✓' : '—'} delay={200} />
        <StatCard icon={CheckCircle2} label="Tasks" value={today ? `${[today.backendDone, today.dsaDone, today.githubCommit].filter(Boolean).length}/3` : '—'} delay={250} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="glass-card p-5 opacity-0 animate-fade-in" style={{ animationDelay: '300ms' }}>
          <h2 className="section-title mb-4">Weekly Score Trend</h2>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(225 12% 14%)" />
              <XAxis dataKey="day" tick={{ fill: 'hsl(215 10% 46%)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'hsl(215 10% 46%)', fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, SCORE_MAX]} />
              <Tooltip content={<ChartTooltip />} />
              <Line type="monotone" dataKey="score" stroke="hsl(145 65% 42%)" strokeWidth={2.5} dot={{ r: 4, fill: 'hsl(145 65% 42%)', strokeWidth: 0 }} name="Score" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card p-5 opacity-0 animate-fade-in" style={{ animationDelay: '400ms' }}>
          <h2 className="section-title mb-4">Monthly Consistency</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(225 12% 14%)" />
              <XAxis dataKey="week" tick={{ fill: 'hsl(215 10% 46%)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'hsl(215 10% 46%)', fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, SCORE_MAX]} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="avg" fill="hsl(145 65% 42%)" radius={[6, 6, 0, 0]} name="Avg Score" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="glass-card p-5 opacity-0 animate-fade-in" style={{ animationDelay: '500ms' }}>
        <h2 className="section-title mb-3">Last 14 Days</h2>
        <div className="flex gap-2 flex-wrap">
          {[...logs]
            .sort((a, b) => a.date.localeCompare(b.date))
            .slice(-14)
            .map((c) => (
              <div
                key={c.id}
                title={`${c.date}: ${c.score}/${SCORE_MAX} (${c.status})`}
                className={cn(
                  'h-8 w-8 rounded-lg flex items-center justify-center text-xs font-mono font-semibold transition-transform hover:scale-110',
                  c.status === 'Elite' ? 'bg-success/20 text-success' :
                  c.status === 'Good' ? 'bg-warning/20 text-warning' :
                  'bg-destructive/20 text-destructive'
                )}
              >
                {c.score}
              </div>
            ))}
        </div>
      </div>
    </>
  );
}

export default function DashboardPage() {
  const { data: logsData, isLoading: logsLoading } = useGetLogs(1, 100);
  const { data: streakData, isLoading: streakLoading } = useGetStreak();

  const isLoading = logsLoading || streakLoading;

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-5xl">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Am I winning today?</p>
        </div>
        <div className="glass-card p-8 text-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const logs = logsData?.data ?? [];

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Am I winning today?</p>
      </div>

      <DashboardContent logs={logs} streakData={streakData} />
    </div>
  );
}
