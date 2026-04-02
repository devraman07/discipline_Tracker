import { useGetLogByDate, useGetStreak } from '@/hooks/useLogs';
import { getStatusEmoji } from '@/lib/scoring';
import { SCORE_MAX } from '@/lib/constants';
import { format } from 'date-fns';
import { Flame, Calendar } from 'lucide-react';

export function TopBar() {
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const { data: today, isLoading: todayLoading } = useGetLogByDate(todayStr);
  const { data: streakData, isLoading: streakLoading } = useGetStreak();

  const dateStr = new Date().toLocaleDateString('en', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  const streak = streakData?.currentStreak ?? 0;

  return (
    <header className="sticky top-0 z-30 flex h-12 items-center justify-between border-b border-border bg-background/80 backdrop-blur-xl px-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Calendar className="h-3.5 w-3.5" />
        <span>{dateStr}</span>
      </div>

      <div className="flex items-center gap-3">
        {!todayLoading && today && (
          <div className="topbar-badge flex items-center gap-1.5">
            <span>{getStatusEmoji(today.status)}</span>
            <span className="text-foreground">{today.score}/{SCORE_MAX}</span>
          </div>
        )}

        {!streakLoading && (
          <div className="topbar-badge flex items-center gap-1.5">
            <Flame className="h-3.5 w-3.5 text-primary" />
            <span className="text-foreground">{streak} day{streak !== 1 ? 's' : ''}</span>
          </div>
        )}
      </div>
    </header>
  );
}
