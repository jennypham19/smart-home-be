// src/config/websocket.js
// Khởi tạo WebSocket server (dùng thư viện 'ws') và cung cấp hàm broadcast realtime.

const { WebSocketServer } = require('ws');
const logger = require('./logger');

let wss = null;

/**
 * Khởi tạo WebSocket server, gắn vào HTTP server có sẵn.
 * FE kết nối tới: ws://<host>:<port>/ws
 * @param {import('http').Server} httpServer
 */
const initWebSocket = (httpServer) => {
    wss = new WebSocketServer({ server: httpServer, path: '/ws' });

    wss.on('connection', (ws) => {
        logger.info('🔌 WebSocket client connected');

        // Cho FE biết đã kết nối thành công
        ws.send(JSON.stringify({ event: 'connected', data: { message: 'WebSocket connected' } }));

        ws.on('close', () => {
            logger.info('🔌 WebSocket client disconnected');
        });

        ws.on('error', (error) => {
            logger.error('WebSocket client error: ' + error.message);
        });
    });

    logger.info('✅ WebSocket server initialized at path /ws');
    return wss;
};

/**
 * Gửi một sự kiện tới tất cả client đang kết nối.
 * @param {string} event - tên sự kiện, ví dụ 'production_orders:updated'
 * @param {any} data - dữ liệu kèm theo
 */
const broadcast = (event, data) => {
    if (!wss) {
        logger.warn('WebSocket chưa được khởi tạo, bỏ qua broadcast: ' + event);
        return;
    }

    const message = JSON.stringify({ event, data });
    wss.clients.forEach((client) => {
        // readyState === 1 (OPEN)
        if (client.readyState === 1) {
            client.send(message);
        }
    });
};

module.exports = {
    initWebSocket,
    broadcast,
};
