// debug-server.js - Wrapper to diagnose server crashes
const { spawn } = require('child_process');
const fs = require('fs');

const logFile = fs.createWriteStream('./server-debug.log', { flags: 'a' });

function log(msg) {
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] ${msg}\n`;
  logFile.write(line);
  console.log(line.trim());
}

log('='.repeat(60));
log('Starting Vite dev server with diagnostics...');
log(`Process PID: ${process.pid}`);
log(`Platform: ${process.platform}`);
log(`Node version: ${process.version}`);

// Capture all signals
const signals = ['SIGINT', 'SIGTERM', 'SIGHUP', 'SIGBREAK'];
signals.forEach(signal => {
  process.on(signal, () => {
    log(`*** Received signal: ${signal} ***`);
  });
});

process.on('uncaughtException', (err) => {
  log(`*** Uncaught Exception: ${err.message}\n${err.stack} ***`);
});

process.on('unhandledRejection', (reason) => {
  log(`*** Unhandled Rejection: ${reason} ***`);
});

process.on('beforeExit', (code) => {
  log(`*** beforeExit with code: ${code} ***`);
});

process.on('exit', (code) => {
  log(`*** Process exit with code: ${code} ***`);
  logFile.end();
});

// Start Vite preview server (more stable than dev)
const child = spawn('npx', ['vite', 'preview', '--port', '8766', '--host', '0.0.0.0'], {
  stdio: ['inherit', 'pipe', 'pipe'],
  shell: true,
  cwd: process.cwd(),
  env: { ...process.env, FORCE_COLOR: '1' }
});

child.stdout.on('data', (data) => {
  process.stdout.write(data);
  log(`STDOUT: ${data.toString().trim()}`);
});

child.stderr.on('data', (data) => {
  process.stderr.write(data);
  log(`STDERR: ${data.toString().trim()}`);
});

child.on('error', (err) => {
  log(`*** Child process error: ${err.message} ***`);
});

child.on('close', (code, signal) => {
  log(`*** Child process CLOSED - code: ${code}, signal: ${signal} ***`);
  process.exit(code || 0);
});

child.on('exit', (code, signal) => {
  log(`*** Child process EXITED - code: ${code}, signal: ${signal} ***`);
});

child.on('disconnect', () => {
  log(`*** Child process DISCONNECTED ***`);
});

log(`Child process started with PID: ${child.pid}`);
log('Waiting for server to be ready...');
