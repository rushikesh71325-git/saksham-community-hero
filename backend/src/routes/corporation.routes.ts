import { Router } from 'express';
import * as corporationController from '../controllers/corporation.controller';

const router = Router();

router.get('/', corporationController.getAllCorporations);

export default router;
