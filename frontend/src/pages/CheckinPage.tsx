import { useState, useMemo, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useCreateLog } from '@/hooks/useLogs';
import { CreateLogInput, SCORE_MAX } from '@/types';
import { getStatus, getStatusEmoji, getFeedback, getRealTimeFeedback } from '@/lib/scoring';

type CheckField = 'wokeOnTime' | 'sleepFollowed' | 'morningReset' |
  'deepWorkBlock1' | 'deepWorkBlock2' | 'deepWorkBlock3' |
  'backendDone' | 'dsaDone' | 'githubCommit' |
  'workoutDone' | 'sunlightTaken';

const sections: { title: string; emoji: string; fields: { key: CheckField; label: string }[] }[] = [
  {
    title: 'Routine Check',
    emoji: '🌅',
    fields: [
      { key: 'wokeOnTime', label: 'Woke up on time' },
      { key: 'sleepFollowed', label: 'Followed sleep schedule' },
      { key: 'morningReset', label: 'Did morning reset' },
    ],
  },
  {
    title: 'Deep Work Execution',
    emoji: '🧠',
    fields: [
      { key: 'deepWorkBlock1', label: 'Completed Deep Work Block 1' },
      { key: 'deepWorkBlock2', label: 'Completed Deep Work Block 2' },
      { key: 'deepWorkBlock3', label: 'Completed Deep Work Block 3' },
    ],
  },
  {
    title: 'Learning & Output',
    emoji: '💻',
    fields: [
      { key: 'backendDone', label: 'Backend task completed' },
      { key: 'dsaDone', label: 'DSA completed' },
      { key: 'githubCommit', label: 'GitHub commit done' },
    ],
  },
  {
    title: 'Health',
    emoji: '💪',
    fields: [
      { key: 'workoutDone', label: 'Workout completed' },
      { key: 'sunlightTaken', label: 'Sunlight taken' },
    ],
  },
];

const checkinSchema = z.object({
  wokeOnTime: z.boolean().default(false),
  sleepFollowed: z.boolean().default(false),
  morningReset: z.boolean().default(false),
  deepWorkBlock1: z.boolean().default(false),
  deepWorkBlock2: z.boolean().default(false),
  deepWorkBlock3: z.boolean().default(false),
  backendDone: z.boolean().default(false),
  dsaDone: z.boolean().default(false),
  githubCommit: z.boolean().default(false),
  workoutDone: z.boolean().default(false),
  sunlightTaken: z.boolean().default(false),
  deepWorkHours: z.number().min(0).max(24).default(0),
  sleepHours: z.number().min(0).max(24).default(0),
  focusLevel: z.enum(['high', 'medium', 'low']).default('medium'),
  reflection: z.string().max(2000).default(''),
});

type CheckinFormData = z.infer<typeof checkinSchema>;

export default function CheckinPage() {
  const [showResult, setShowResult] = useState(false);
  const [submittedScore, setSubmittedScore] = useState(0);
  
  const createLog = useCreateLog();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<CheckinFormData>({
    resolver: zodResolver(checkinSchema),
    defaultValues: {
      wokeOnTime: false,
      sleepFollowed: false,
      morningReset: false,
      deepWorkBlock1: false,
      deepWorkBlock2: false,
      deepWorkBlock3: false,
      backendDone: false,
      dsaDone: false,
      githubCommit: false,
      workoutDone: false,
      sunlightTaken: false,
      deepWorkHours: 0,
      sleepHours: 0,
      focusLevel: 'medium',
      reflection: '',
    },
  });

  const watchedValues = watch();

  const toggle = useCallback((key: CheckField) => {
    setValue(key, !watchedValues[key], { shouldValidate: true });
  }, [watchedValues, setValue]);

  const liveScore = useMemo(() => {
    let score = 0;
    const boolFields: CheckField[] = [
      'wokeOnTime', 'sleepFollowed', 'morningReset',
      'deepWorkBlock1', 'deepWorkBlock2', 'deepWorkBlock3',
      'backendDone', 'dsaDone', 'githubCommit',
      'workoutDone', 'sunlightTaken',
    ];
    for (const f of boolFields) {
      if (watchedValues[f]) score++;
    }
    if (watchedValues.focusLevel === 'high') score++;
    return score;
  }, [watchedValues]);

  const liveStatus = useMemo(() => getStatus(liveScore), [liveScore]);
  const liveFeedback = useMemo(() => getRealTimeFeedback(liveScore), [liveScore]);
  const progressPct = (liveScore / SCORE_MAX) * 100;

  const onSubmit = async (data: CheckinFormData) => {
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      
      const logData: CreateLogInput = {
        date: today,
        ...data,
      };

      await createLog.mutateAsync(logData);
      
      setSubmittedScore(liveScore);
      setShowResult(true);
      toast.success('Check-in saved successfully!');
      reset();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save check-in');
    }
  };

  const scoreBarColor = liveStatus === 'Elite' ? 'bg-success' : liveStatus === 'Good' ? 'bg-warning' : 'bg-destructive';

  return (
    <div className="max-w-2xl space-y-5">
      <div>
        <h1 className="page-title">Daily Check-in</h1>
        <p className="page-subtitle">Track your execution. Build discipline.</p>
      </div>

      <div className="glass-card p-4 opacity-0 animate-fade-in sticky top-12 z-20">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-foreground">
            {liveScore}/{SCORE_MAX}
          </span>
          <span className="text-xs text-muted-foreground">{liveFeedback}</span>
        </div>
        <div className="h-2 rounded-full bg-secondary overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all duration-500', scoreBarColor)}
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {sections.map((section, si) => (
          <div
            key={section.title}
            className="checkin-section opacity-0 animate-fade-in"
            style={{ animationDelay: `${(si + 1) * 80}ms` }}
          >
            <div className="flex items-center gap-2">
              <span>{section.emoji}</span>
              <h3 className="checkin-section-title">{section.title}</h3>
            </div>
            <div className="space-y-2.5">
              {section.fields.map((field) => (
                <label
                  key={field.key}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200',
                    watchedValues[field.key]
                      ? 'bg-success/8 border border-success/20'
                      : 'bg-secondary/30 border border-transparent hover:bg-secondary/50'
                  )}
                >
                  <Checkbox
                    checked={watchedValues[field.key]}
                    onCheckedChange={() => toggle(field.key)}
                  />
                  <span className={cn(
                    'text-sm font-medium transition-colors',
                    watchedValues[field.key] ? 'text-foreground' : 'text-secondary-foreground'
                  )}>
                    {field.label}
                  </span>
                  {watchedValues[field.key] && (
                    <span className="ml-auto text-xs text-success font-mono">+1</span>
                  )}
                </label>
              ))}
            </div>
          </div>
        ))}

        <div className="checkin-section opacity-0 animate-fade-in" style={{ animationDelay: '400ms' }}>
          <div className="flex items-center gap-2">
            <span>⏱️</span>
            <h3 className="checkin-section-title">Deep Work Hours</h3>
          </div>
          <Input
            type="number"
            step="0.5"
            min="0"
            max="16"
            {...register('deepWorkHours', { valueAsNumber: true })}
            placeholder="Total hours of deep work"
            className="bg-secondary/30 border-transparent"
          />
          {errors.deepWorkHours && (
            <p className="text-xs text-destructive mt-1">{errors.deepWorkHours.message}</p>
          )}
        </div>

        <div className="checkin-section opacity-0 animate-fade-in" style={{ animationDelay: '440ms' }}>
          <div className="flex items-center gap-2">
            <span>🌙</span>
            <h3 className="checkin-section-title">Sleep Hours</h3>
          </div>
          <Input
            type="number"
            step="0.5"
            min="0"
            max="16"
            {...register('sleepHours', { valueAsNumber: true })}
            placeholder="Hours of sleep"
            className="bg-secondary/30 border-transparent"
          />
          {errors.sleepHours && (
            <p className="text-xs text-destructive mt-1">{errors.sleepHours.message}</p>
          )}
        </div>

        <div className="checkin-section opacity-0 animate-fade-in" style={{ animationDelay: '480ms' }}>
          <div className="flex items-center gap-2">
            <span>🎯</span>
            <h3 className="checkin-section-title">Focus Level</h3>
          </div>
          <Select 
            value={watchedValues.focusLevel} 
            onValueChange={(v) => setValue('focusLevel', v as 'high' | 'medium' | 'low')}
          >
            <SelectTrigger className="bg-secondary/30 border-transparent">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="high">🔥 High (+1 point)</SelectItem>
              <SelectItem value="medium">⚡ Medium</SelectItem>
              <SelectItem value="low">❌ Low</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="checkin-section opacity-0 animate-fade-in" style={{ animationDelay: '560ms' }}>
          <div className="flex items-center gap-2">
            <span>📝</span>
            <h3 className="checkin-section-title">Reflection</h3>
          </div>
          <div className="space-y-3">
            <div>
              <Label className="text-xs text-muted-foreground">What did you build today?</Label>
              <Textarea
                {...register('reflection')}
                rows={2}
                className="bg-secondary/30 border-transparent mt-1"
                placeholder="APIs, features, learning, bugs fixed..."
              />
            </div>
          </div>
          {errors.reflection && (
            <p className="text-xs text-destructive mt-1">{errors.reflection.message}</p>
          )}
        </div>

        <Button
          type="submit"
          disabled={isSubmitting || createLog.isPending}
          className="btn-submit opacity-0 animate-fade-in w-full"
          style={{ animationDelay: '640ms' }}
        >
          {createLog.isPending ? 'Saving...' : `Submit Check-in → ${liveScore}/${SCORE_MAX}`}
        </Button>
      </form>

      <Dialog open={showResult} onOpenChange={setShowResult}>
        <DialogContent className="glass-card border-glass-border max-w-sm text-center">
          <DialogHeader>
            <DialogTitle className="text-center">Check-in Complete</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-6xl font-extrabold animate-score-pop">
              <span className={getStatus(submittedScore) === 'Elite' ? 'score-elite' : getStatus(submittedScore) === 'Good' ? 'score-good' : 'score-missed'}>
                {submittedScore}
              </span>
              <span className="text-xl text-muted-foreground">/{SCORE_MAX}</span>
            </p>
            <div className="flex items-center justify-center gap-2 mt-3">
              <span className="text-xl">{getStatusEmoji(getStatus(submittedScore))}</span>
              <span className="text-lg font-bold">{getStatus(submittedScore)}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-3">
              {getFeedback(submittedScore, watchedValues)}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
