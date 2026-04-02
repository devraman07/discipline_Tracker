import { useMemo } from 'react';
import { useGetLogs, useGetAnalytics, useGetScoreTrend } from '@/hooks/useLogs';
import { SCORE_MAX } from '@/lib/constants';
import { getStatusEmoji } from '@/lib/scoring';
import { cn } from '@/lib/utils';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';

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

export default function AnalyticsPage() {
  const { data: logsData, isLoading: logsLoading } = useGetLogs(1, 100);
  const { data: analyticsData, isLoading: analyticsLoading } = useGetAnalytics();
  const { data: trendData, isLoading: trendLoading } = useGetScoreTrend(14);

  const isLoading = logsLoading || analyticsLoading || trendLoading;

  const checkins = logsData?.data ?? [];

  const weeklyTrend = useMemo(() => {
    if (!trendData) return [];
    return trendData.map((c) => ({
      day: new Date(c.date).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
      score: c.score,
    }));
  }, [trendData]);

  const monthlyBars = useMemo(() => {
    const sorted = [...checkins].sort((a, b) => a.date.localeCompare(b.date)).slice(-28);
    const weeks: { week: string; avg: number }[] = [];
    for (let i = 0; i < sorted.length; i += 7) {
      const chunk = sorted.slice(i, i + 7);
      weeks.push({
        week: `W${weeks.length + 1}`,
        avg: Math.round(chunk.reduce((s, c) => s + c.score, 0) / chunk.length * 10) / 10,
      });
    }
    return weeks;
  }, [checkins]);

  const completionRate = analyticsData?.completionRate ?? 0;
  const eliteRate = analyticsData?.eliteRate ?? 0;
  const averageScore = analyticsData?.averageScore ?? 0;

  // Heatmap: last 12 weeks (84 days)
  const heatmapData = useMemo(() => {
    const days: { date: string; score: number; status: string }[] = [];
    const map = new Map(checkins.map((c) => [c.date, c]));
    for (let i = 83; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const c = map.get(dateStr);
      days.push({
        date: dateStr,
        score: c?.score ?? 0,
        status: c?.status ?? 'none',
      });
    }
    return days;
  }, [checkins]);

  const heatColor = (score: number) => {
    if (score === 0) return 'bg-secondary';
    const pct = score / SCORE_MAX;
    if (pct >= 0.85) return 'bg-success/80';
    if (pct >= 0.7) return 'bg-success/50';
    if (pct >= 0.5) return 'bg-warning/50';
    if (pct >= 0.3) return 'bg-warning/30';
    return 'bg-destructive/30';
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-5xl">
        <div>
          <h1 className="page-title">Analytics</h1>
          <p className="page-subtitle">Your discipline data, visualized</p>
        </div>
        <div className="glass-card p-8 text-center">
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="page-title">Analytics</h1>
        <p className="page-subtitle">Your discipline data, visualized</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="glass-card-hover p-5 opacity-0 animate-fade-in">
          <p className="stat-label">Total Check-ins</p>
          <p className="stat-value mt-2">{analyticsData?.totalLogs ?? 0}</p>
        </div>
        <div className="glass-card-hover p-5 opacity-0 animate-fade-in" style={{ animationDelay: '60ms' }}>
          <p className="stat-label">Average Score</p>
          <p className="stat-value mt-2 text-primary">{averageScore}/12</p>
        </div>
        <div className="glass-card-hover p-5 opacity-0 animate-fade-in" style={{ animationDelay: '120ms' }}>
          <p className="stat-label">Completion Rate</p>
          <p className="stat-value mt-2 text-warning">{completionRate}%</p>
        </div>
        <div className="glass-card-hover p-5 opacity-0 animate-fade-in" style={{ animationDelay: '180ms' }}>
          <p className="stat-label">Elite Days</p>
          <p className="stat-value mt-2 text-success">{eliteRate}%</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="glass-card p-5 opacity-0 animate-fade-in" style={{ animationDelay: '180ms' }}>
          <h2 className="section-title mb-4">Score Trend (14 days)</h2>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={weeklyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(225 12% 14%)" />
              <XAxis dataKey="day" tick={{ fill: 'hsl(215 10% 46%)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'hsl(215 10% 46%)', fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, SCORE_MAX]} />
              <Tooltip content={<ChartTooltip />} />
              <Line type="monotone" dataKey="score" stroke="hsl(145 65% 42%)" strokeWidth={2.5} dot={{ r: 3, fill: 'hsl(145 65% 42%)', strokeWidth: 0 }} name="Score" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card p-5 opacity-0 animate-fade-in" style={{ animationDelay: '240ms' }}>
          <h2 className="section-title mb-4">Weekly Averages</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyBars}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(225 12% 14%)" />
              <XAxis dataKey="week" tick={{ fill: 'hsl(215 10% 46%)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'hsl(215 10% 46%)', fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, SCORE_MAX]} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="avg" fill="hsl(145 65% 42%)" radius={[6, 6, 0, 0]} name="Avg Score" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Heatmap */}
      <div className="glass-card p-5 opacity-0 animate-fade-in" style={{ animationDelay: '300ms' }}>
        <h2 className="section-title mb-4">Contribution Heatmap (12 weeks)</h2>
        <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(12, 1fr)' }}>
          {heatmapData.map((d) => (
            <div
              key={d.date}
              title={`${d.date}: ${d.score}/${SCORE_MAX}`}
              className={cn('heatmap-cell aspect-square', heatColor(d.score))}
            />
          ))}
        </div>
        <div className="flex items-center gap-2 mt-3 text-[10px] text-muted-foreground">
          <span>Less</span>
          <div className="h-3 w-3 rounded-sm bg-secondary" />
          <div className="h-3 w-3 rounded-sm bg-destructive/30" />
          <div className="h-3 w-3 rounded-sm bg-warning/30" />
          <div className="h-3 w-3 rounded-sm bg-warning/50" />
          <div className="h-3 w-3 rounded-sm bg-success/50" />
          <div className="h-3 w-3 rounded-sm bg-success/80" />
          <span>More</span>
        </div>
      </div>
    </div>
  );
}
