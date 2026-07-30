import dns from 'dns';

/**
 * Prefer IPv4 when resolving hostnames (common fix for ECONNRESET on Windows + Supabase).
 */
export function preferIpv4First() {
  if (process.env.DB_FORCE_IPV4 === 'false') return;
  try {
    dns.setDefaultResultOrder('ipv4first');
  } catch {
    /* Node < 17 or unsupported */
  }
}

/**
 * Remove sslmode/ssl query params so `pg` does not fight with Sequelize `dialectOptions.ssl`.
 * NOTE: We intentionally do NOT rewrite the pooler host to a direct connection host.
 * Cloud platforms (Render, Railway, etc.) can reach Supabase pooler URLs but NOT
 * the direct `db.*` host on free-tier projects.
 */
export function normalizePostgresUrl(url) {
  if (!url || typeof url !== 'string') return url;
  try {
    const u = new URL(url.replace(/^postgresql:/i, 'http:').replace(/^postgres:/i, 'http:'));
    // Only strip params that conflict with Sequelize's own SSL dialect options
    u.searchParams.delete('sslmode');
    u.searchParams.delete('ssl');
    // Keep pgbouncer=true and all other params intact
    return u.toString().replace(/^http:/i, 'postgres:');
  } catch {
    return url;
  }
}

export function parseConnectionInfoFromUrl(url) {
  if (!url) return { host: null, port: null, database: null, isTransactionPooler: false };
  try {
    const u = new URL(url.replace(/^postgresql:/i, 'http:').replace(/^postgres:/i, 'http:'));
    const port = u.port || '5432';
    const isTransactionPooler =
      /pooler\.supabase\.com/i.test(u.hostname) && port === '6543';
    return {
      host: u.hostname,
      port,
      database: (u.pathname || '').replace(/^\//, '').split('/')[0] || null,
      isTransactionPooler
    };
  } catch {
    return { host: null, port: null, database: null, isTransactionPooler: false };
  }
}
