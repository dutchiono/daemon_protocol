import * as fs from 'fs';
import * as path from 'path';

export interface TickConfig {
  starting_tick: number;
  tick_lower: number;
  tick_upper: number;
  tick_spacing: number;
  target_fdv_usd: number;
  daemon_price_usd: number;
  raw_tick: number;
  price_usd: number;
  price_daemon: number;
  fdv_at_lower: number;
  fdv_at_upper: number;
}

/**
 * Load tick configuration from ticks.json file
 * Falls back to defaults if file doesn't exist
 */
export function loadTickConfig(): TickConfig | null {
  // Try multiple possible paths
  const possiblePaths = [
    path.join(process.cwd(), 'backend', 'src', 'config', 'ticks.json'),
    path.join(process.cwd(), 'daemon', 'backend', 'src', 'config', 'ticks.json'),
    path.join(__dirname, 'ticks.json'),
  ];

  for (const configPath of possiblePaths) {
    if (fs.existsSync(configPath)) {
      try {
        const content = fs.readFileSync(configPath, 'utf-8');
        const config = JSON.parse(content) as TickConfig;
        console.log(`✅ Loaded tick config from: ${configPath}`);
        return config;
      } catch (error) {
        console.warn(`⚠️  Failed to parse tick config from ${configPath}:`, error);
        // Continue to next path
      }
    }
  }

  console.warn('⚠️  No tick config file found. Using defaults.');
  return null;
}

/**
 * Get starting tick (tickIfToken0IsFey) from config or default
 */
export function getStartingTick(): number {
  const config = loadTickConfig();
  return config?.starting_tick ?? -10400; // DEFAULT_STARTING_TICK
}

/**
 * Get tick spacing from config or default
 */
export function getTickSpacing(): number {
  const config = loadTickConfig();
  return config?.tick_spacing ?? 200; // DEFAULT_TICK_SPACING
}

