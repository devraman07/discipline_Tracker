import { useState, useMemo } from 'react';
import { useGetLogs, useGetStreak } from '@/hooks/useLogs';
import { getStatusEmoji } from '@/lib/scoring';
import { DailyLog } from '@/types';
import { SCORE_MAX } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { subDays, parseISO, isAfter, startOfDay } from 'date-fns';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';

export default function HistoryPage() {
  const [filter, setFilter] = useState('7');
  const [selected, setSelected] = useState<DailyLog | null>(null);
  const [page, setPage] = useState(1);
  
  const { data: logsData, isLoading: logsLoading } = useGetLogs(page, 20);
  const { data: streakData } = useGetStreak();

  const checkins = logsData?.data ?? [];

  const filtered = useMemo(() => {
    const cutoff = subDays(startOfDay(new Date()), parseInt(filter));
    return [...checkins]
      .filter((c) => {
        const logDate = parseISO(c.date);
        return isAfter(logDate, cutoff) || logDate.getTime() === cutoff.getTime();
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [checkins, filter]);

  const statusColor = (st: string) =>
    st === 'Elite' ? 'text-success' : st === 'Good' ? 'text-warning' : 'text-destructive';

  const statusBg = (st: string) =>
    st === 'Elite' ? 'bg-success/10' : st === 'Good' ? 'bg-warning/10' : 'bg-destructive/10';

  if (logsLoading) {
    return (
      <div className="space-y-6 max-w-4xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">History</h1>
            <p className="page-subtitle">Review your past check-ins</p>
          </div>
        </div>
        <div className="glass-card p-12 text-center text-muted-foreground text-sm">
          Loading history...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">History</h1>
          <p className="page-subtitle">Review your past check-ins</p>
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="14">Last 14 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        {filtered.map((c, i) => (
          <div
            key={c.id}
            onClick={() => setSelected(c)}
            className="glass-card-hover px-5 py-4 flex items-center justify-between cursor-pointer opacity-0 animate-fade-in"
            style={{ animationDelay: `${i * 40}ms` }}
          >
            <div className="flex items-center gap-4">
              <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center text-sm font-bold', statusBg(c.status), statusColor(c.status))}>
                {c.score}
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{new Date(c.date).toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                <p className="text-xs text-muted-foreground">{c.deepWorkHours}h deep work · Focus: {c.focusLevel}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={cn('text-xs font-semibold', statusColor(c.status))}>
                {getStatusEmoji(c.status)} {c.status}
              </span>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="glass-card p-12 text-center text-muted-foreground text-sm">
            No check-ins found for this period.
          </div>
        )}
      </div>

      {/* Pagination */}
      {logsData?.pagination?.totalPages && logsData.pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1 rounded-lg bg-secondary text-sm disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-3 py-1 text-sm text-muted-foreground">
            Page {page} of {logsData.pagination.totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(logsData.pagination?.totalPages || 1, p + 1))}
            disabled={page === logsData.pagination?.totalPages}
            className="px-3 py-1 rounded-lg bg-secondary text-sm disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      {/* Detail Modal */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="glass-card border-glass-border max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selected && new Date(selected.date).toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric' })}
            </DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4 py-2">
              <div className="flex items-center gap-3">
                <span className="text-4xl font-extrabold">
                  <span className={statusColor(selected.status)}>{selected.score}</span>
                  <span className="text-lg text-muted-foreground">/{SCORE_MAX}</span>
                </span>
                <span className={cn('text-sm font-bold', statusColor(selected.status))}>
                  {getStatusEmoji(selected.status)} {selected.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                {([
                  ['Woke on time', selected.wokeOnTime],
                  ['Sleep schedule', selected.sleepFollowed],
                  ['Morning reset', selected.morningReset],
                  ['DW Block 1', selected.deepWorkBlock1],
                  ['DW Block 2', selected.deepWorkBlock2],
                  ['DW Block 3', selected.deepWorkBlock3],
                  ['Backend task', selected.backendDone],
                  ['DSA', selected.dsaDone],
                  ['GitHub commit', selected.githubCommit],
                  ['Workout', selected.workoutDone],
                  ['Sunlight', selected.sunlightTaken],
                ] as [string, boolean][]).map(([label, done]) => (
                  <div key={label} className={cn(
                    'px-3 py-2 rounded-lg',
                    done ? 'bg-success/10 text-success' : 'bg-secondary text-muted-foreground'
                  )}>
                    {done ? '✓' : '✗'} {label}
                  </div>
                ))}
              </div>

              <div className="text-xs space-y-1 text-muted-foreground">
                <p><span className="text-foreground font-medium">Deep Work:</span> {selected.deepWorkHours}h</p>
                <p><span className="text-foreground font-medium">Focus:</span> {selected.focusLevel}</p>
                {selected.reflection && <p><span className="text-foreground font-medium">Reflection:</span> {selected.reflection}</p>}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
