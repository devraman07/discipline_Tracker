import { Router } from 'express';
import { authController } from '../auth/auth.controller';
import { validateRequest } from '../../middlewares/validation';
import { registerSchema, loginSchema } from './auth.validation';

const router = Router();

// Public routes
router.post('/register', validateRequest(registerSchema), authController.register);
router.post('/login', validateRequest(loginSchema), authController.login);

export const authRouter = router;
