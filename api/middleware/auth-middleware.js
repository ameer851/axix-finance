// Temporary JS shim to satisfy Vercel runtime import. Replace with proper build output.
export function createAuthMiddleware(options = {}) {
  return async function (_req, _res, next) {
    next();
  };
}
export const requireAuth = createAuthMiddleware();
export const requireAdmin = createAuthMiddleware({ requireAdmin: true });
