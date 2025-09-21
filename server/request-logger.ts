import { randomUUID } from 'crypto';
import type { NextFunction, Request, Response } from 'express';
import { log } from './logger';

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = process.hrtime.bigint();
  const cid = (req.headers['x-correlation-id'] as string) || randomUUID();
  (req as any).cid = cid;

  const child = log.withCid(cid);
  child.info('REQ', {
    method: req.method,
    path: req.originalUrl || req.url,
    ip: req.ip,
  });

  res.setHeader('x-correlation-id', cid);

  const done = () => {
    res.removeListener('finish', done);
    res.removeListener('close', done);
    const end = process.hrtime.bigint();
    const ms = Number(end - start) / 1_000_000;
    child.info('RES', {
      method: req.method,
      path: req.originalUrl || req.url,
      status: res.statusCode,
      durationMs: Number(ms.toFixed(2)),
      userId: (req as any).user?.id || null,
    });
  };

  res.on('finish', done);
  res.on('close', done);
  next();
}
