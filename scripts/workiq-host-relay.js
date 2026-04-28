#!/usr/bin/env node
/**
 * Work IQ Host Relay
 *
 * Runs natively on the host (NOT in Docker) so it can use the macOS Keychain
 * for M365 authentication. Exposes a tiny HTTP API that the Docker container's
 * `workiq-docker-bridge.js` calls when the Copilot agent uses Work IQ tools.
 *
 * Why: Microsoft's Work IQ CLI requires platform-native auth (macOS Keychain
 * / Windows WAM / Linux libsecret + WebKit2GTK) which doesn't work inside a
 * headless Linux container.
 *
 * Usage:
 *   node scripts/workiq-host-relay.js
 *
 * Listens on:
 *   http://127.0.0.1:52391/ask  POST { query: string } → { result | error }
 *   http://127.0.0.1:52391/health  GET → { ok: true, workiqBinary: string }
 */

const http = require('http');
const { execFile, spawn } = require('child_process');
const path = require('path');
const os = require('os');
const fs = require('fs');

const PORT = parseInt(process.env.WORKIQ_RELAY_PORT || '52391', 10);
const HOST = process.env.WORKIQ_RELAY_HOST || '127.0.0.1';

// Locate the workiq binary cached by npx (avoids slow npx cold start per call)
function findWorkiqBinary() {
    const platform = process.platform === 'darwin' ? 'osx' : process.platform;
    const arch = process.arch === 'arm64' ? 'arm64' : 'x64';
    const binaryName = `${platform}-${arch}/workiq`;
    const npxCache = path.join(os.homedir(), '.npm', '_npx');

    if (fs.existsSync(npxCache)) {
        for (const dir of fs.readdirSync(npxCache)) {
            const candidate = path.join(npxCache, dir, 'node_modules', '@microsoft', 'workiq', 'bin', binaryName);
            if (fs.existsSync(candidate)) return candidate;
        }
    }
    return null;
}

const WORKIQ_BINARY = findWorkiqBinary();

function runWorkiq(query, callback) {
    const args = ['ask', '-q', query];
    const cmd = WORKIQ_BINARY || 'npx';
    const finalArgs = WORKIQ_BINARY ? args : ['-y', '@microsoft/workiq@0.4.0', ...args];

    // Workiq uses Spectre.Console which requires a TTY to produce output.
    // When spawned from Node without a PTY it hangs and produces no output.
    // We wrap it in `script` (BSD on macOS, util-linux on Linux) which gives
    // it a fake TTY. `script` itself does ioctl on its stdin so we must pass
    // a regular file descriptor (e.g. /dev/null opened as a file), not a
    // pipe/socket — otherwise it errors "tcgetattr/ioctl: Operation not
    // supported on socket".
    let wrappedCmd, wrappedArgs;
    if (process.platform === 'darwin') {
        wrappedCmd = 'script';
        wrappedArgs = ['-q', '/dev/null', cmd, ...finalArgs];
    } else if (process.platform === 'linux') {
        // util-linux: script -qec "<command>" /dev/null
        wrappedCmd = 'script';
        wrappedArgs = ['-qec', [cmd, ...finalArgs].map(a => `"${a.replace(/"/g, '\\"')}"`).join(' '), '/dev/null'];
    } else {
        wrappedCmd = cmd;
        wrappedArgs = finalArgs;
    }

    let stdinFd = 'ignore';
    try {
        stdinFd = fs.openSync('/dev/null', 'r');
    } catch (_) {}

    const child = spawn(wrappedCmd, wrappedArgs, { stdio: [stdinFd, 'pipe', 'pipe'] });

    let stdout = '';
    let stderr = '';
    let timedOut = false;
    const timer = setTimeout(() => {
        timedOut = true;
        child.kill('SIGTERM');
    }, 120000);

    const MAX = 50 * 1024 * 1024;
    child.stdout.on('data', (d) => { if (stdout.length < MAX) stdout += d.toString(); });
    child.stderr.on('data', (d) => { if (stderr.length < MAX) stderr += d.toString(); });

    child.on('error', (err) => {
        clearTimeout(timer);
        if (typeof stdinFd === 'number') try { fs.closeSync(stdinFd); } catch (_) {}
        callback(err, stdout, stderr);
    });

    child.on('close', (code, signal) => {
        clearTimeout(timer);
        if (typeof stdinFd === 'number') try { fs.closeSync(stdinFd); } catch (_) {}
        if (stdout.trim().length > 0) {
            if (code !== 0 || signal) {
                console.warn(`[relay] non-zero exit (code=${code}, sig=${signal}) but stdout present (${stdout.length} chars)`);
                if (stderr) console.warn(`[relay] stderr: ${stderr.slice(0, 500)}`);
            }
            return callback(null, stdout, stderr);
        }
        if (timedOut) {
            return callback(new Error('Workiq command timed out after 120s'), stdout, stderr);
        }
        if (code !== 0) {
            return callback(new Error(`Workiq exited with code ${code} (signal ${signal}); stderr: ${stderr.slice(0, 300)}`), stdout, stderr);
        }
        callback(null, stdout, stderr);
    });
}

// Strip ANSI escape codes and a few control characters that `script` injects
// at the start of its output (e.g., `^D\b\b\x1b[?1h\x1b=`). We keep the
// content otherwise intact — including markdown links — for the agent.
function cleanWorkiqOutput(s) {
    if (!s) return s;
    return s
        // ANSI CSI / escape sequences
        .replace(/\x1b\[[0-?]*[ -/]*[@-~]/g, '')
        .replace(/\x1b[=>]/g, '')
        .replace(/\x1b\][^\x07\x1b]*[\x07\x1b]/g, '')
        // Stray control chars often emitted by script (^D, BS, BEL, NUL)
        .replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, '')
        // `script` on macOS prints a literal "^D" caret-notation at EOF
        .replace(/^\^D+/, '')
        // Collapse Windows line endings
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        // Trim leading whitespace artifacts
        .replace(/^\s+/, '');
}

const server = http.createServer((req, res) => {
    if (req.method === 'GET' && req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ ok: true, workiqBinary: WORKIQ_BINARY || 'npx-fallback' }));
    }

    if (req.method === 'POST' && req.url === '/ask') {
        let body = '';
        req.on('data', (c) => (body += c));
        req.on('end', () => {
            let payload;
            try { payload = JSON.parse(body); } catch (e) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({ error: 'Invalid JSON' }));
            }
            const { query } = payload || {};
            if (typeof query !== 'string' || !query.trim()) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({ error: 'Missing or empty "query"' }));
            }

            console.log(`[relay] ask: ${query.slice(0, 120)}${query.length > 120 ? '…' : ''}`);
            runWorkiq(query, (err, stdout, stderr) => {
                if (err) {
                    console.error(`[relay] error: ${err.message}`);
                    console.error(`[relay] stderr: ${(stderr || '').toString().slice(0, 1000)}`);
                    console.error(`[relay] stdout: ${(stdout || '').toString().slice(0, 500)}`);
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    return res.end(JSON.stringify({
                        error: err.message,
                        stderr: (stderr || '').toString(),
                        stdout: (stdout || '').toString(),
                    }));
                }
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ result: cleanWorkiqOutput(stdout || '').trim() }));
            });
        });
        return;
    }

    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, HOST, () => {
    console.log(`[workiq-host-relay] Listening on http://${HOST}:${PORT}`);
    console.log(`[workiq-host-relay] Workiq binary: ${WORKIQ_BINARY || '(using npx fallback)'}`);
    console.log(`[workiq-host-relay] Health check: curl http://${HOST}:${PORT}/health`);
});
