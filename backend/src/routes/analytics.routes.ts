import { Router } from 'express';
import * as analyticsController from '../controllers/analytics.controller';

const router = Router();

router.get('/overview', analyticsController.getAnalyticsOverview);

export default router;
