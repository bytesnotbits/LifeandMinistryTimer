const crypto = require('crypto');
const fs = require('fs');
const http = require('http');
const path = require('path');
const { URL } = require('url');
const { WebSocketServer } = require('ws');

const PORT = Number(process.env.PORT || 8080);
const PUBLIC_BASE_URL = (process.env.PUBLIC_BASE_URL || '').replace(/\/$/, '');
const ROOM_TTL_MS = Number(process.env.ROOM_TTL_MS || 6 * 60 * 60 * 1000);
const appRoot = __dirname;

const contentTypes = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.ico': 'image/x-icon'
};

const rooms = new Map();

function makeToken(bytes = 18) {
    return crypto.randomBytes(bytes).toString('base64url');
}

function makeMeetingId() {
    return makeToken(9);
}

function publicUrl(req, pathname) {
    if (PUBLIC_BASE_URL) {
        return `${PUBLIC_BASE_URL}${pathname}`;
    }
    const proto = req.headers['x-forwarded-proto'] || 'http';
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    return `${proto}://${host}${pathname}`;
}

function getRoom(meetingId) {
    const room = rooms.get(meetingId);
    if (!room) return null;
    room.lastSeenAt = Date.now();
    return room;
}

function sendJson(res, status, body) {
    const payload = JSON.stringify(body);
    res.writeHead(status, {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Length': Buffer.byteLength(payload)
    });
    res.end(payload);
}

function readRequestBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', (chunk) => {
            body += chunk;
            if (body.length > 1024 * 1024) {
                reject(new Error('Request body too large'));
                req.destroy();
            }
        });
        req.on('end', () => resolve(body));
        req.on('error', reject);
    });
}

function serveStatic(req, res) {
    const requestUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    let pathname = decodeURIComponent(requestUrl.pathname);
    if (pathname === '/') {
        pathname = '/index.html';
    }

    const filePath = path.normalize(path.join(appRoot, pathname));
    if (!filePath.startsWith(appRoot)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
    }

    fs.stat(filePath, (statError, stats) => {
        if (statError || !stats.isFile()) {
            res.writeHead(404);
            res.end('Not found');
            return;
        }

        const ext = path.extname(filePath).toLowerCase();
        res.writeHead(200, {
            'Content-Type': contentTypes[ext] || 'application/octet-stream',
            'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=300'
        });
        fs.createReadStream(filePath).pipe(res);
    });
}

const server = http.createServer(async (req, res) => {
    try {
        if (req.method === 'POST' && req.url === '/api/share') {
            await readRequestBody(req);
            const meetingId = makeMeetingId();
            const hostToken = makeToken();
            rooms.set(meetingId, {
                hostToken,
                snapshot: null,
                viewers: new Set(),
                createdAt: Date.now(),
                lastSeenAt: Date.now()
            });

            const viewerPath = `/?view=share&id=${encodeURIComponent(meetingId)}`;
            sendJson(res, 201, {
                meetingId,
                hostToken,
                viewerUrl: publicUrl(req, viewerPath)
            });
            return;
        }

        if (req.method === 'GET' && req.url === '/api/health') {
            sendJson(res, 200, {
                ok: true,
                rooms: rooms.size
            });
            return;
        }

        if (req.method !== 'GET' && req.method !== 'HEAD') {
            res.writeHead(405);
            res.end('Method not allowed');
            return;
        }

        serveStatic(req, res);
    } catch (error) {
        console.error('Request failed:', error);
        sendJson(res, 500, { error: 'Internal server error' });
    }
});

const wss = new WebSocketServer({ server, path: '/share' });

function wsSend(socket, message) {
    if (socket.readyState === socket.OPEN) {
        socket.send(JSON.stringify(message));
    }
}

function broadcastToViewers(room, message) {
    for (const viewer of room.viewers) {
        wsSend(viewer, message);
    }
}

wss.on('connection', (socket) => {
    socket.role = null;
    socket.meetingId = null;

    socket.on('message', (raw) => {
        let message;
        try {
            message = JSON.parse(raw.toString());
        } catch {
            wsSend(socket, { type: 'error', message: 'Invalid JSON' });
            return;
        }

        if (message.type === 'host:join') {
            const room = getRoom(message.meetingId);
            if (!room || message.hostToken !== room.hostToken) {
                wsSend(socket, { type: 'error', message: 'Invalid share credentials' });
                return;
            }
            socket.role = 'host';
            socket.meetingId = message.meetingId;
            wsSend(socket, {
                type: 'host:ready',
                meetingId: message.meetingId,
                viewers: room.viewers.size
            });
            return;
        }

        if (message.type === 'viewer:join') {
            const room = getRoom(message.meetingId);
            if (!room) {
                wsSend(socket, { type: 'error', message: 'Share link is no longer active' });
                return;
            }
            socket.role = 'viewer';
            socket.meetingId = message.meetingId;
            room.viewers.add(socket);
            wsSend(socket, {
                type: 'viewer:ready',
                meetingId: message.meetingId,
                snapshot: room.snapshot
            });
            return;
        }

        if (message.type === 'host:snapshot') {
            const room = getRoom(socket.meetingId);
            if (!room || socket.role !== 'host') {
                wsSend(socket, { type: 'error', message: 'Host is not connected to a share room' });
                return;
            }
            room.snapshot = {
                ...message.snapshot,
                receivedAt: Date.now()
            };
            broadcastToViewers(room, {
                type: 'snapshot',
                snapshot: room.snapshot
            });
        }
    });

    socket.on('close', () => {
        if (socket.role === 'viewer' && socket.meetingId) {
            const room = rooms.get(socket.meetingId);
            if (room) {
                room.viewers.delete(socket);
            }
        }
    });
});

setInterval(() => {
    const cutoff = Date.now() - ROOM_TTL_MS;
    for (const [meetingId, room] of rooms.entries()) {
        if (room.lastSeenAt < cutoff) {
            for (const viewer of room.viewers) {
                viewer.close(1001, 'Share room expired');
            }
            rooms.delete(meetingId);
        }
    }
}, 10 * 60 * 1000).unref();

server.listen(PORT, () => {
    console.log(`Life and Ministry Timer listening on http://localhost:${PORT}`);
});
