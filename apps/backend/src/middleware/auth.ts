import { Request, Response, NextFunction } from 'express';

export const verifyWorkerToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const expectedToken = process.env.MINIPAAS_WORKER_TOKEN;

  if (!expectedToken) {
    return next(); // If not configured, allow (or block if strict. Let's block or allow with warning).
  }

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
  }

  const token = authHeader.split(' ')[1];
  if (token !== expectedToken) {
    return res.status(403).json({ error: 'Forbidden: Invalid worker token' });
  }

  next();
};
