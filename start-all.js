/**
 * Unified Process Orchestrator for 3-Tier Architecture
 * Spawns Auth Backend (Port 5001), Core Backend (Port 5002), and Frontend Web Server (Port 3000)
 */
const { spawn } = require('child_process');
const path = require('path');

const SERVICES = [
  {
    name: 'AUTH-BACKEND',
    color: '\x1b[36m', // Cyan
    cwd: path.join(__dirname, 'auth-backend'),
    command: 'node',
    args: ['server.js']
  },
  {
    name: 'CORE-BACKEND',
    color: '\x1b[35m', // Magenta
    cwd: path.join(__dirname, 'core-backend'),
    command: 'node',
    args: ['server.js']
  },
  {
    name: 'FRONTEND-APP',
    color: '\x1b[32m', // Green
    cwd: path.join(__dirname, 'frontend'),
    command: 'node',
    args: ['server.js']
  }
];

const RESET_COLOR = '\x1b[0m';
const processes = [];

console.log('\x1b[1m\x1b[34m===============================================================');
console.log('🌐 STARTING 3-TIER ARCHITECTURE SUITE');
console.log('   Tier 1: Auth Backend  -> http://localhost:5001 (arch_auth_db)');
console.log('   Tier 2: Core Backend  -> http://localhost:5002 (arch_core_db)');
console.log('   Tier 3: Web Frontend  -> http://localhost:3000');
console.log('===============================================================\x1b[0m\n');

SERVICES.forEach(service => {
  const isWindows = process.platform === 'win32';
  const proc = spawn(service.command, service.args, {
    cwd: service.cwd,
    shell: isWindows,
    env: { ...process.env }
  });

  proc.stdout.on('data', data => {
    const lines = data.toString().trim().split('\n');
    lines.forEach(line => {
      if (line.trim()) {
        console.log(`${service.color}[${service.name}]${RESET_COLOR} ${line}`);
      }
    });
  });

  proc.stderr.on('data', data => {
    const lines = data.toString().trim().split('\n');
    lines.forEach(line => {
      if (line.trim()) {
        console.error(`${service.color}[${service.name} ERR]${RESET_COLOR} \x1b[31m${line}\x1b[0m`);
      }
    });
  });

  proc.on('close', code => {
    console.log(`${service.color}[${service.name}]${RESET_COLOR} Process exited with code ${code}`);
  });

  proc.on('error', err => {
    console.error(`${service.color}[${service.name} ERROR]${RESET_COLOR} Failed to start process:`, err);
  });

  processes.push(proc);
});

function cleanup() {
  console.log('\nShutting down all services...');
  processes.forEach(proc => {
    try {
      if (process.platform === 'win32') {
        spawn('taskkill', ['/pid', proc.pid, '/f', '/t']);
      } else {
        proc.kill('SIGINT');
      }
    } catch (e) {}
  });
  process.exit(0);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
