import type { Access } from 'payload';

export const canWrite: Access = ({ req }) =>
  Boolean(req.user) && (req.user as { role?: string })?.role !== 'read-only';
