# How to Check Server Logs

## Server Information
- **Server IP:** `50.21.187.69`
- **Hostname:** `ubuntu`
- **Node Process:** Running on ports 4001, 4002, 4003

## Quick Commands

### 1. Check if Node Process is Running

```bash
# SSH into your server
ssh user@50.21.187.69

# Check if node processes are running
ps aux | grep node

# Check what's using the ports
sudo netstat -tlnp | grep -E ':(4001|4002|4003|5001)'
# OR
sudo ss -tlnp | grep -E ':(4001|4002|4003|5001)'
```

### 2. Check Log Files

The daemon-node writes logs to the `logs/` directory:

```bash
# Navigate to daemon-node directory
cd ~/daemon/daemon-node

# Check if logs directory exists
ls -la logs/

# View recent error logs
tail -f logs/error.log

# View all logs
tail -f logs/combined.log

# View last 100 lines of logs
tail -n 100 logs/combined.log

# Search logs for errors
grep -i error logs/combined.log | tail -20

# Search logs for specific endpoint
grep "api/v1/feed" logs/combined.log | tail -20
```

### 3. Check Process Output (if running with screen/tmux)

```bash
# Check if running in screen
screen -ls

# Attach to screen session
screen -r

# Check if running in tmux
tmux list-sessions

# Attach to tmux session
tmux attach
```

### 4. Check if running with PM2

```bash
# Check PM2 processes
pm2 list

# View PM2 logs
pm2 logs

# View specific process logs
pm2 logs daemon-node

# View real-time logs
pm2 logs daemon-node --lines 100
```

### 5. Check System Logs

```bash
# Check systemd service logs (if running as service)
sudo journalctl -u daemon-node -f
sudo journalctl -u daemon-node --since "1 hour ago"

# Check recent system logs
sudo journalctl -xe | grep -i daemon
```

### 6. Check Current Running Process Output

```bash
# Find the node process PID
ps aux | grep "npm\|node\|tsx" | grep -v grep

# If running in a specific directory, check for nohup.out
cd ~/daemon/daemon-node
cat nohup.out | tail -100

# Check if process redirected output to a file
ls -la *.log
```

## Common Issues

### No Logs Directory
If logs directory doesn't exist, it means file logging might not be enabled. Check:

```bash
# Check .env for logging settings
cd ~/daemon
cat .env | grep -i log

# Check if file logging is enabled
# Should see ENABLE_FILE_LOGGING=true
```

### No Logs at All
If you see no logs:

1. **Check if process is actually running:**
   ```bash
   ps aux | grep node
   ```

2. **Check if it crashed:**
   ```bash
   # Check system logs for crashes
   sudo dmesg | tail -20
   sudo journalctl -xe | tail -50
   ```

3. **Check if running in background without output:**
   ```bash
   # Check for nohup.out or similar
   find ~/daemon -name "*.log" -o -name "nohup.out" -o -name "*.out"
   ```

4. **Try to restart and watch output:**
   ```bash
   cd ~/daemon/daemon-node
   npm run dev all
   # Watch terminal for errors
   ```

## View Logs Remotely

### Using SSH

```bash
# SSH and tail logs
ssh user@50.21.187.69 "tail -f ~/daemon/daemon-node/logs/combined.log"

# SSH and search logs
ssh user@50.21.187.69 "grep -i error ~/daemon/daemon-node/logs/combined.log | tail -20"
```

## Real-time Monitoring

```bash
# Watch logs in real-time
tail -f ~/daemon/daemon-node/logs/combined.log

# Watch multiple log files
tail -f ~/daemon/daemon-node/logs/*.log

# Watch with timestamps (if configured)
tail -f ~/daemon/daemon-node/logs/combined.log | while read line; do echo "$(date '+%Y-%m-%d %H:%M:%S') $line"; done
```

## Check for Specific Errors

```bash
# Connection errors
grep -i "connection\|timeout\|ECONN" ~/daemon/daemon-node/logs/combined.log

# API errors
grep -i "api\|endpoint\|route" ~/daemon/daemon-node/logs/combined.log

# Database errors
grep -i "database\|postgres\|sql" ~/daemon/daemon-node/logs/combined.log

# Authentication errors
grep -i "auth\|unauthorized\|401\|403" ~/daemon/daemon-node/logs/combined.log
```

## Quick Health Check

```bash
# One-liner to check everything
echo "=== Processes ===" && ps aux | grep node | grep -v grep && \
echo "=== Ports ===" && sudo ss -tlnp | grep -E ':(4001|4002|4003|5001)' && \
echo "=== Recent Logs ===" && tail -20 ~/daemon/daemon-node/logs/combined.log 2>/dev/null || echo "No log file found"
```

