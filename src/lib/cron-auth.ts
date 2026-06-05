import "server-only";

/**
 * Validates the Bearer secret sent by schedulers (cron-job.org, Vercel Cron).
 * Returns true when authorized.
 */
export function isAuthorizedCron(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = req.headers.get("authorization");
  return header === `Bearer ${secret}`;
}
