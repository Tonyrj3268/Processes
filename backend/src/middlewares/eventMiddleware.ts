// eventMiddleware.ts
import { query } from 'express-validator';

export const getEventsValidators = [
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('page 必須是大於 0 的整數'),
    query('limit')
        .optional()
        .isInt({ min: 1 })
        .withMessage('limit 必須是大於 0 的整數'),
];