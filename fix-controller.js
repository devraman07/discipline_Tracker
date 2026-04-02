const fs = require('fs');

const controllerPath = 'd:/Raman/personal_projects/habit-tracker/backend/src/modules/logs/logs.controller.ts';

const newControllerContent = `import type { Request, Response, NextFunction } from 'express';
import { logsService } from './logs.service';
import { createDailyLogSchema, updateDailyLogSchema, dateParamSchema, rangeQuerySchema } from './logs.validation';
import { getScoreBreakdown, getScoreStatus } from './logs.utils';
import { NotFoundError } from '../../utils/errors';

// Helper to recalculate status from score (fixes stale data)
const fixStatus = (log: any) => {
  if (!log) return log;
  return {
    ...log,
    status: getScoreStatus(log.score || 0),
  };
};

export class LogsController {
  async createOrUpdateLog(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = createDailyLogSchema.parse(req.body);
      const log = await logsService.createOrUpdateLog(validated);
      
      res.status(200).json({
        success: true,
        data: fixStatus(log),
        message: 'Daily log saved successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async getAllLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { range } = rangeQuerySchema.parse(req.query);
      const logs = await logsService.getAllLogs(range);
      
      res.status(200).json({
        success: true,
        data: logs.map(fixStatus),
        count: logs.length,
      });
    } catch (error) {
      next(error);
    }
  }

  async getLogByDate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { date } = dateParamSchema.parse(req.params);
      const log = await logsService.getLogByDate(date);
      
      if (!log) {
        throw new NotFoundError(\`No log found for date: \${date}\`);
      }
      
      const fixedLog = fixStatus(log);
      const scoreBreakdown = getScoreBreakdown(log);
      
      res.status(200).json({
        success: true,
        data: {
          ...fixedLog,
          scoreBreakdown,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async updateLog(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { date } = dateParamSchema.parse(req.params);
      const validated = updateDailyLogSchema.parse(req.body);
      
      const log = await logsService.updateLog(date, validated);
      
      if (!log) {
        throw new NotFoundError(\`No log found for date: \${date}\`);
      }
      
      res.status(200).json({
        success: true,
        data: fixStatus(log),
        message: 'Daily log updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteLog(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { date } = dateParamSchema.parse(req.params);
      const deleted = await logsService.deleteLog(date);
      
      if (!deleted) {
        throw new NotFoundError(\`No log found for date: \${date}\`);
      }
      
      res.status(200).json({
        success: true,
        message: 'Daily log deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const logsController = new LogsController();
`;

try {
  fs.writeFileSync(controllerPath, newControllerContent);
  console.log('✅ logs.controller.ts FIXED');
  console.log('✅ Status now recalculated from score on every request');
  console.log('✅ Old database values will show correct status');
  console.log('');
  console.log('🔄 RESTART BACKEND: npm run dev');
} catch (err) {
  console.error('❌ Failed to write file:', err);
}
