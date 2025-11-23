#!/usr/bin/env tsx
/**
 * Modern diagnostic script to check replies, recasts, and quote casts
 * Verifies that all interaction features are working correctly
 */

import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

interface ServiceStatus {
  name: string;
  port: number;
  healthUrl: string;
  status: 'running' | 'stopped' | 'error';
  responseTime?: number;
}

interface DatabaseStats {
  totalPosts: number;
  totalReplies: number;
  totalReactions: number;
  totalUsers: number;
  recentPosts: number;
}

interface ReactionStats {
  likes: number;
  reposts: number;
  quotes: number;
  recentLikes: number;
  recentReposts: number;
  recentQuotes: number;
}

interface PostInfo {
  hash: string;
  did: string;
  text: string;
  timestamp: number;
}

interface GitInfo {
  branch: string;
  lastCommit: string;
  lastCommitTime: string;
  uncommittedChanges: number;
}

function log(message: string, color: string = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSection(title: string) {
  console.log('');
  log('═'.repeat(60), colors.cyan);
  log(`  ${title}`, colors.bright + colors.cyan);
  log('═'.repeat(60), colors.cyan);
  console.log('');
}

function checkPort(port: number): boolean {
  try {
    // Try PowerShell first (Windows)
    const result = execSync(`powershell -Command "Get-NetTCPConnection -LocalPort ${port} -ErrorAction SilentlyContinue | Select-Object -First 1"`, {
      encoding: 'utf-8',
      stdio: 'pipe'
    });
    return result.trim().length > 0;
  } catch {
    // Fallback to netstat
    try {
      const result = execSync(`netstat -ano | findstr :${port}`, {
        encoding: 'utf-8',
        stdio: 'pipe'
      });
      return result.trim().length > 0;
    } catch {
      return false;
    }
  }
}

async function checkHealth(url: string): Promise<{ status: boolean; responseTime?: number }> {
  try {
    const start = Date.now();
    const response = await fetch(url, {
      method: 'GET',
      signal: AbortSignal.timeout(5000)
    });
    const responseTime = Date.now() - start;
    return {
      status: response.ok,
      responseTime
    };
  } catch {
    return { status: false };
  }
}

function getServices(): ServiceStatus[] {
  return [
    { name: 'Hub', port: 4001, healthUrl: 'http://localhost:4001/health' },
    { name: 'PDS', port: 4002, healthUrl: 'http://localhost:4002/health' },
    { name: 'Gateway', port: 4003, healthUrl: 'http://localhost:4003/health' },
  ];
}

async function checkServices(): Promise<void> {
  logSection('🔧 Service Status');

  const services = getServices();
  for (const service of services) {
    const portOpen = checkPort(service.port);
    const health = await checkHealth(service.healthUrl);

    if (portOpen && health.status) {
      log(`  ✅ ${service.name} (port ${service.port})`, colors.green);
      if (health.responseTime) {
        log(`     Response time: ${health.responseTime}ms`, colors.dim);
      }
    } else if (portOpen && !health.status) {
      log(`  ⚠️  ${service.name} (port ${service.port}) - Port open but health check failed`, colors.yellow);
    } else {
      log(`  ❌ ${service.name} (port ${service.port}) - Not running`, colors.red);
    }
  }
}

function checkDatabase(): DatabaseStats | null {
  try {
    // Try to connect to database and get stats
    const dbUser = process.env.DB_USER || 'daemon';
    const dbName = process.env.DB_NAME || 'daemon';
    const dbHost = process.env.DB_HOST || 'localhost';
    const dbPort = process.env.DB_PORT || '5432';

    // Build psql command with connection string
    const psqlCmd = `psql -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${dbName} -tAc`;

    try {
      const totalPosts = execSync(
        `${psqlCmd} "SELECT COUNT(*) FROM messages WHERE parent_hash IS NULL;"`,
        { encoding: 'utf-8', stdio: 'pipe', env: { ...process.env, PGPASSWORD: process.env.DB_PASSWORD || '' } }
      ).trim();

      const totalReplies = execSync(
        `${psqlCmd} "SELECT COUNT(*) FROM messages WHERE parent_hash IS NOT NULL;"`,
        { encoding: 'utf-8', stdio: 'pipe', env: { ...process.env, PGPASSWORD: process.env.DB_PASSWORD || '' } }
      ).trim();

      const totalReactions = execSync(
        `${psqlCmd} "SELECT COUNT(*) FROM reactions WHERE active = true;"`,
        { encoding: 'utf-8', stdio: 'pipe', env: { ...process.env, PGPASSWORD: process.env.DB_PASSWORD || '' } }
      ).trim();

      const totalUsers = execSync(
        `${psqlCmd} "SELECT COUNT(*) FROM users;"`,
        { encoding: 'utf-8', stdio: 'pipe', env: { ...process.env, PGPASSWORD: process.env.DB_PASSWORD || '' } }
      ).trim();

      const recentPosts = execSync(
        `${psqlCmd} "SELECT COUNT(*) FROM messages WHERE parent_hash IS NULL AND timestamp > EXTRACT(EPOCH FROM NOW() - INTERVAL '24 hours');"`,
        { encoding: 'utf-8', stdio: 'pipe', env: { ...process.env, PGPASSWORD: process.env.DB_PASSWORD || '' } }
      ).trim();

      return {
        totalPosts: parseInt(totalPosts) || 0,
        totalReplies: parseInt(totalReplies) || 0,
        totalReactions: parseInt(totalReactions) || 0,
        totalUsers: parseInt(totalUsers) || 0,
        recentPosts: parseInt(recentPosts) || 0,
      };
    } catch (error: any) {
      // Database connection failed
      return null;
    }
  } catch {
    return null;
  }
}

function checkReactions(): ReactionStats | null {
  try {
    const dbUser = process.env.DB_USER || 'daemon';
    const dbName = process.env.DB_NAME || 'daemon';
    const dbHost = process.env.DB_HOST || 'localhost';
    const dbPort = process.env.DB_PORT || '5432';
    const psqlCmd = `psql -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${dbName} -tAc`;

    try {
      const likes = execSync(
        `${psqlCmd} "SELECT COUNT(*) FROM reactions WHERE reaction_type = 'like' AND active = true;"`,
        { encoding: 'utf-8', stdio: 'pipe', env: { ...process.env, PGPASSWORD: process.env.DB_PASSWORD || '' } }
      ).trim();

      const reposts = execSync(
        `${psqlCmd} "SELECT COUNT(*) FROM reactions WHERE reaction_type = 'repost' AND active = true;"`,
        { encoding: 'utf-8', stdio: 'pipe', env: { ...process.env, PGPASSWORD: process.env.DB_PASSWORD || '' } }
      ).trim();

      const quotes = execSync(
        `${psqlCmd} "SELECT COUNT(*) FROM reactions WHERE reaction_type = 'quote' AND active = true;"`,
        { encoding: 'utf-8', stdio: 'pipe', env: { ...process.env, PGPASSWORD: process.env.DB_PASSWORD || '' } }
      ).trim();

      const recentLikes = execSync(
        `${psqlCmd} "SELECT COUNT(*) FROM reactions WHERE reaction_type = 'like' AND active = true AND timestamp > EXTRACT(EPOCH FROM NOW() - INTERVAL '24 hours');"`,
        { encoding: 'utf-8', stdio: 'pipe', env: { ...process.env, PGPASSWORD: process.env.DB_PASSWORD || '' } }
      ).trim();

      const recentReposts = execSync(
        `${psqlCmd} "SELECT COUNT(*) FROM reactions WHERE reaction_type = 'repost' AND active = true AND timestamp > EXTRACT(EPOCH FROM NOW() - INTERVAL '24 hours');"`,
        { encoding: 'utf-8', stdio: 'pipe', env: { ...process.env, PGPASSWORD: process.env.DB_PASSWORD || '' } }
      ).trim();

      const recentQuotes = execSync(
        `${psqlCmd} "SELECT COUNT(*) FROM reactions WHERE reaction_type = 'quote' AND active = true AND timestamp > EXTRACT(EPOCH FROM NOW() - INTERVAL '24 hours');"`,
        { encoding: 'utf-8', stdio: 'pipe', env: { ...process.env, PGPASSWORD: process.env.DB_PASSWORD || '' } }
      ).trim();

      return {
        likes: parseInt(likes) || 0,
        reposts: parseInt(reposts) || 0,
        quotes: parseInt(quotes) || 0,
        recentLikes: parseInt(recentLikes) || 0,
        recentReposts: parseInt(recentReposts) || 0,
        recentQuotes: parseInt(recentQuotes) || 0,
      };
    } catch {
      return null;
    }
  } catch {
    return null;
  }
}

function getRecentReplies(limit: number = 5): PostInfo[] {
  try {
    const dbUser = process.env.DB_USER || 'daemon';
    const dbName = process.env.DB_NAME || 'daemon';
    const dbHost = process.env.DB_HOST || 'localhost';
    const dbPort = process.env.DB_PORT || '5432';
    const psqlCmd = `psql -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${dbName} -tAc`;

    const result = execSync(
      `${psqlCmd} "SELECT hash, did, LEFT(text, 100) as text, timestamp FROM messages WHERE parent_hash IS NOT NULL ORDER BY timestamp DESC LIMIT ${limit};"`,
      { encoding: 'utf-8', stdio: 'pipe', env: { ...process.env, PGPASSWORD: process.env.DB_PASSWORD || '' } }
    );

    const lines = result.trim().split('\n').filter(l => l.trim());
    return lines.map(line => {
      const parts = line.split('|').map(p => p.trim());
      return {
        hash: parts[0] || '',
        did: parts[1] || '',
        text: parts[2] || '',
        timestamp: parseInt(parts[3]) || 0,
      };
    });
  } catch {
    return [];
  }
}

function getRecentReposts(limit: number = 5): any[] {
  try {
    const dbUser = process.env.DB_USER || 'daemon';
    const dbName = process.env.DB_NAME || 'daemon';
    const dbHost = process.env.DB_HOST || 'localhost';
    const dbPort = process.env.DB_PORT || '5432';
    const psqlCmd = `psql -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${dbName} -tAc`;

    const result = execSync(
      `${psqlCmd} "SELECT did, target_hash, timestamp FROM reactions WHERE reaction_type = 'repost' AND active = true ORDER BY timestamp DESC LIMIT ${limit};"`,
      { encoding: 'utf-8', stdio: 'pipe', env: { ...process.env, PGPASSWORD: process.env.DB_PASSWORD || '' } }
    );

    const lines = result.trim().split('\n').filter(l => l.trim());
    return lines.map(line => {
      const parts = line.split('|').map(p => p.trim());
      return {
        did: parts[0] || '',
        targetHash: parts[1] || '',
        timestamp: parseInt(parts[2]) || 0,
      };
    });
  } catch {
    return [];
  }
}

function getRecentQuotes(limit: number = 5): any[] {
  try {
    const dbUser = process.env.DB_USER || 'daemon';
    const dbName = process.env.DB_NAME || 'daemon';
    const dbHost = process.env.DB_HOST || 'localhost';
    const dbPort = process.env.DB_PORT || '5432';
    const psqlCmd = `psql -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${dbName} -tAc`;

    const result = execSync(
      `${psqlCmd} "SELECT did, target_hash, timestamp FROM reactions WHERE reaction_type = 'quote' AND active = true ORDER BY timestamp DESC LIMIT ${limit};"`,
      { encoding: 'utf-8', stdio: 'pipe', env: { ...process.env, PGPASSWORD: process.env.DB_PASSWORD || '' } }
    );

    const lines = result.trim().split('\n').filter(l => l.trim());
    return lines.map(line => {
      const parts = line.split('|').map(p => p.trim());
      return {
        did: parts[0] || '',
        targetHash: parts[1] || '',
        timestamp: parseInt(parts[2]) || 0,
      };
    });
  } catch {
    return [];
  }
}

function showDatabaseStats(): void {
  logSection('📊 Database Statistics');

  const stats = checkDatabase();
  if (stats) {
    log(`  Total Posts: ${stats.totalPosts}`, colors.cyan);
    log(`  Total Replies: ${stats.totalReplies}`, colors.cyan);
    log(`  Total Reactions: ${stats.totalReactions}`, colors.cyan);
    log(`  Total Users: ${stats.totalUsers}`, colors.cyan);
    log(`  Posts (last 24h): ${stats.recentPosts}`, colors.cyan);
  } else {
    log('  ⚠️  Could not connect to database', colors.yellow);
    log('     Make sure PostgreSQL is running and DATABASE_URL is set', colors.dim);
  }
}

function showReactionsDiagnostics(): void {
  logSection('💬 Replies, Recasts & Quote Casts');

  const stats = checkDatabase();
  const reactions = checkReactions();

  // Replies
  log('  📝 Replies:', colors.bright);
  if (stats) {
    log(`    Total: ${stats.totalReplies}`, colors.cyan);
    const recentReplies = getRecentReplies(3);
    if (recentReplies.length > 0) {
      log(`    Recent replies:`, colors.dim);
      recentReplies.forEach((reply, i) => {
        log(`      ${i + 1}. ${reply.did}: ${reply.text.substring(0, 50)}...`, colors.dim);
      });
    } else {
      log(`    ⚠️  No recent replies found`, colors.yellow);
    }
  } else {
    log(`    ⚠️  Could not check replies`, colors.yellow);
  }

  console.log('');

  // Recasts/Reposts
  log('  ↻ Recasts/Reposts:', colors.bright);
  if (reactions) {
    log(`    Total: ${reactions.reposts}`, colors.cyan);
    log(`    Last 24h: ${reactions.recentReposts}`, colors.cyan);
    const recentReposts = getRecentReposts(3);
    if (recentReposts.length > 0) {
      log(`    Recent reposts:`, colors.dim);
      recentReposts.forEach((repost, i) => {
        log(`      ${i + 1}. ${repost.did} reposted ${repost.targetHash.substring(0, 20)}...`, colors.dim);
      });
    } else {
      log(`    ⚠️  No recent reposts found`, colors.yellow);
    }
  } else {
    log(`    ⚠️  Could not check reposts`, colors.yellow);
  }

  console.log('');

  // Quote Casts
  log('  💬 Quote Casts:', colors.bright);
  if (reactions) {
    log(`    Total: ${reactions.quotes}`, colors.cyan);
    log(`    Last 24h: ${reactions.recentQuotes}`, colors.cyan);
    const recentQuotes = getRecentQuotes(3);
    if (recentQuotes.length > 0) {
      log(`    Recent quote casts:`, colors.dim);
      recentQuotes.forEach((quote, i) => {
        log(`      ${i + 1}. ${quote.did} quoted ${quote.targetHash.substring(0, 20)}...`, colors.dim);
      });
    } else {
      log(`    ⚠️  No recent quote casts found`, colors.yellow);
    }
  } else {
    log(`    ⚠️  Could not check quote casts`, colors.yellow);
  }

  console.log('');

  // Overall status
  log('  ✅ Feature Status:', colors.bright);
  if (stats && reactions) {
    const hasReplies = stats.totalReplies > 0;
    const hasReposts = reactions.reposts > 0;
    const hasQuotes = reactions.quotes > 0;

    log(`    Replies: ${hasReplies ? '✅ Working' : '⚠️  No data'}`, hasReplies ? colors.green : colors.yellow);
    log(`    Recasts: ${hasReposts ? '✅ Working' : '⚠️  No data'}`, hasReposts ? colors.green : colors.yellow);
    log(`    Quote Casts: ${hasQuotes ? '✅ Working' : '⚠️  No data'}`, hasQuotes ? colors.green : colors.yellow);
  } else {
    log(`    ⚠️  Could not verify feature status`, colors.yellow);
  }
}

function getGitInfo(): GitInfo | null {
  try {
    const branch = execSync('git branch --show-current', { encoding: 'utf-8' }).trim();
    const lastCommit = execSync('git log -1 --pretty=format:"%h"', { encoding: 'utf-8' }).trim();
    const lastCommitTime = execSync('git log -1 --pretty=format:"%ar"', { encoding: 'utf-8' }).trim();
    const uncommittedChanges = execSync('git status --porcelain | wc -l', { encoding: 'utf-8' }).trim();

    return {
      branch,
      lastCommit,
      lastCommitTime,
      uncommittedChanges: parseInt(uncommittedChanges) || 0,
    };
  } catch {
    return null;
  }
}

function showGitInfo(): void {
  logSection('📝 Git Status');

  const gitInfo = getGitInfo();
  if (gitInfo) {
    log(`  Branch: ${gitInfo.branch}`, colors.cyan);
    log(`  Last Commit: ${gitInfo.lastCommit} (${gitInfo.lastCommitTime})`, colors.cyan);

    if (gitInfo.uncommittedChanges > 0) {
      log(`  ⚠️  ${gitInfo.uncommittedChanges} uncommitted changes`, colors.yellow);
    } else {
      log(`  ✅ Working tree clean`, colors.green);
    }

    // Show last commit message
    try {
      const lastMessage = execSync('git log -1 --pretty=format:"%s"', { encoding: 'utf-8' }).trim();
      log(`  Last commit: "${lastMessage}"`, colors.dim);
    } catch {}
  } else {
    log('  ⚠️  Not a git repository', colors.yellow);
  }
}

async function checkRecentActivity(): Promise<void> {
  logSection('📈 Recent Activity');

  try {
    const gatewayUrl = process.env.VITE_GATEWAY_URL || 'http://localhost:4003';
    const response = await fetch(`${gatewayUrl}/api/v1/feed?limit=5`, {
      signal: AbortSignal.timeout(5000)
    });

    if (response.ok) {
      const data = await response.json();
      const posts = data.posts || data.feed || [];

      if (posts.length > 0) {
        log(`  Found ${posts.length} recent posts:`, colors.cyan);
        posts.slice(0, 3).forEach((post: any, i: number) => {
          const text = post.text?.substring(0, 50) || 'No text';
          const author = post.username || post.did || 'unknown';
          log(`    ${i + 1}. @${author}: ${text}...`, colors.dim);
        });
      } else {
        log('  No recent posts found', colors.dim);
      }
    } else {
      log('  ⚠️  Could not fetch recent activity', colors.yellow);
    }
  } catch (error) {
    log('  ⚠️  Gateway API not responding', colors.yellow);
  }
}

function showEnvironment(): void {
  logSection('🌍 Environment');

  const nodeEnv = process.env.NODE_ENV || 'development';
  log(`  NODE_ENV: ${nodeEnv}`, colors.cyan);

  const gatewayUrl = process.env.VITE_GATEWAY_URL || 'http://localhost:4003';
  log(`  Gateway URL: ${gatewayUrl}`, colors.cyan);

  const dbUrl = process.env.DATABASE_URL;
  if (dbUrl) {
    const masked = dbUrl.replace(/:[^:@]+@/, ':****@');
    log(`  Database: ${masked}`, colors.cyan);
  } else {
    log(`  ⚠️  DATABASE_URL not set`, colors.yellow);
  }
}

async function showSummary(): Promise<void> {
  logSection('📋 Summary');

  const services = getServices();
  let runningServices = 0;

  for (const service of services) {
    const portOpen = checkPort(service.port);
    const health = await checkHealth(service.healthUrl);
    if (portOpen && health.status) {
      runningServices++;
    }
  }

  const stats = checkDatabase();
  const gitInfo = getGitInfo();

  log('  System Status:', colors.bright);
  log(`    Services: ${runningServices}/${services.length} running`, colors.cyan);
  if (stats) {
    log(`    Database: Connected (${stats.totalUsers} users, ${stats.totalPosts} posts)`, colors.cyan);
  } else {
    log(`    Database: Not connected`, colors.yellow);
  }

  if (gitInfo) {
    log(`    Git: ${gitInfo.branch} branch, ${gitInfo.uncommittedChanges} uncommitted changes`, colors.cyan);
  }

  console.log('');
  log('  Next Steps:', colors.bright);
  log('    • Check service logs if any services are down', colors.dim);
  log('    • Review recent commits and uncommitted changes', colors.dim);
  log('    • Test API endpoints if Gateway is running', colors.dim);
  console.log('');
}

// Main execution
async function main() {
  console.clear();
  log('╔════════════════════════════════════════════════════════════╗', colors.cyan);
  log('║  Daemon Social Network - Replies, Recasts & Quote Casts   ║', colors.cyan);
  log('╚════════════════════════════════════════════════════════════╝', colors.cyan);

  await checkServices();
  showDatabaseStats();
  showReactionsDiagnostics();
  await checkRecentActivity();
  showGitInfo();
  showEnvironment();
  await showSummary();

  log('═'.repeat(60), colors.cyan);
  console.log('');
}

main().catch(console.error);

