import type { Request, Response, NextFunction } from 'express';
import * as service from '../services/transaction.service.js';

export const listTransactions = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await service.listTransactions(req.query);
        res.json(result);
    } catch (error) {
        next(error);
    }
};

export const createTransaction = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await service.createTransaction(req.body, req.user!.id);
        res.status(201).json(result);
    } catch (error) {
        next(error);
    }
};

export const getStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await service.getTransactionStats();
        res.json(result);
    } catch (error) {
        next(error);
    }
};
