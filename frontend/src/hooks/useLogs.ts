import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { CreateLogInput, DailyLog, AnalyticsSummary, ScoreTrend, CategoryBreakdown, StreakInfo, PaginatedLogsResponse } from '@/types';

// Query keys
export const queryKeys = {
  logs: 'logs',
  log: (date: string) => ['log', date],
  analytics: 'analytics',
  trend: (days: number) => ['trend', days],
  categories: 'categories',
  streak: 'streak',
} as const;

// Logs
export function useCreateLog() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateLogInput) => api.createLog(data),
    // Optimistic update
    onMutate: async (newLog) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: [queryKeys.logs], exact: false });
      
      // Snapshot previous value
      const previousLogs = queryClient.getQueryData([queryKeys.logs, 1, 20]);
      
      // Optimistically update to new value
      const optimisticLog: DailyLog = {
        ...newLog,
        id: 'temp-' + Date.now(),
        score: 0, // Will be calculated by backend
        status: 'Good',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      queryClient.setQueryData([queryKeys.logs, 1, 20], (old: PaginatedLogsResponse | undefined) => {
        if (!old) return old;
        return {
          ...old,
          data: [optimisticLog, ...old.data],
        };
      });
      
      return { previousLogs };
    },
    onError: (err, newLog, context) => {
      // Rollback on error
      if (context?.previousLogs) {
        queryClient.setQueryData([queryKeys.logs, 1, 20], context.previousLogs);
      }
    },
    onSettled: () => {
      // Invalidate ALL queries to ensure fresh data
      queryClient.invalidateQueries({ queryKey: [queryKeys.logs], exact: false });
      queryClient.invalidateQueries({ queryKey: [queryKeys.analytics], exact: false });
      queryClient.invalidateQueries({ queryKey: [queryKeys.streak], exact: false });
      queryClient.invalidateQueries({ queryKey: [queryKeys.trend(30)], exact: false });
      queryClient.invalidateQueries({ queryKey: [queryKeys.categories], exact: false });
      
      // Force refetch of current day log
      queryClient.refetchQueries({ queryKey: queryKeys.log(new Date().toISOString().split('T')[0]) });
    },
  });
}

export function useGetLogs(page = 1, limit = 20) {
  return useQuery<PaginatedLogsResponse>({
    queryKey: [queryKeys.logs, page, limit],
    queryFn: () => api.getLogs(page, limit),
  });
}

export function useGetLogByDate(date: string) {
  return useQuery<DailyLog | null>({
    queryKey: queryKeys.log(date),
    queryFn: () => api.getLogByDate(date),
    enabled: !!date,
  });
}

export function useUpdateLog() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ date, data }: { date: string; data: Partial<CreateLogInput> }) =>
      api.updateLog(date, data),
    onSuccess: (_, { date }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.log(date), exact: false });
      queryClient.invalidateQueries({ queryKey: [queryKeys.logs], exact: false });
      queryClient.invalidateQueries({ queryKey: [queryKeys.analytics], exact: false });
    },
  });
}

export function useDeleteLog() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (date: string) => api.deleteLog(date),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKeys.logs], exact: false });
      queryClient.invalidateQueries({ queryKey: [queryKeys.analytics], exact: false });
    },
  });
}

// Analytics
export function useGetAnalytics() {
  return useQuery<AnalyticsSummary>({
    queryKey: [queryKeys.analytics],
    queryFn: () => api.getAnalytics(),
  });
}

export function useGetScoreTrend(days = 30) {
  return useQuery<ScoreTrend[]>({
    queryKey: queryKeys.trend(days),
    queryFn: () => api.getScoreTrend(days),
  });
}

export function useGetCategories() {
  return useQuery<CategoryBreakdown[]>({
    queryKey: [queryKeys.categories],
    queryFn: () => api.getCategories(),
  });
}

// Streak
export function useGetStreak() {
  return useQuery<StreakInfo>({
    queryKey: [queryKeys.streak],
    queryFn: () => api.getStreak(),
  });
}
