const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// 房间管理
const rooms = new Map();

// 生成6位房间码
function generateRoomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

io.on('connection', (socket) => {
    console.log('玩家连接:', socket.id);
    
    // 创建房间
    socket.on('createRoom', (playerName) => {
        const roomCode = generateRoomCode();
        rooms.set(roomCode, {
            players: [{ id: socket.id, name: playerName, team: 'player' }],
            gameState: null,
            currentTurn: 'player'
        });
        socket.join(roomCode);
        socket.roomCode = roomCode;
        socket.playerTeam = 'player';
        
        socket.emit('roomCreated', { roomCode, team: 'player' });
        console.log(`房间 ${roomCode} 已创建`);
    });
    
    // 加入房间
    socket.on('joinRoom', ({ roomCode, playerName }) => {
        const room = rooms.get(roomCode);
        
        if (!room) {
            socket.emit('joinError', '房间不存在');
            return;
        }
        
        if (room.players.length >= 2) {
            socket.emit('joinError', '房间已满');
            return;
        }
        
        room.players.push({ id: socket.id, name: playerName, team: 'enemy' });
        socket.join(roomCode);
        socket.roomCode = roomCode;
        socket.playerTeam = 'enemy';
        
        socket.emit('roomJoined', { roomCode, team: 'enemy' });
        
        // 通知房间内所有玩家游戏开始
        io.to(roomCode).emit('gameStart', {
            players: room.players
        });
        
        console.log(`玩家加入房间 ${roomCode}`);
    });
    
    // 游戏操作同步
    socket.on('gameAction', (action) => {
        const roomCode = socket.roomCode;
        if (!roomCode) return;
        
        // 广播给房间内其他玩家
        socket.to(roomCode).emit('gameAction', action);
    });
    
    // 回合结束
    socket.on('turnEnd', (data) => {
        const roomCode = socket.roomCode;
        if (!roomCode) return;
        
        const room = rooms.get(roomCode);
        if (room) {
            room.currentTurn = room.currentTurn === 'player' ? 'enemy' : 'player';
            io.to(roomCode).emit('turnChanged', { currentTurn: room.currentTurn });
        }
    });
    
    // 断开连接
    socket.on('disconnect', () => {
        const roomCode = socket.roomCode;
        if (roomCode) {
            const room = rooms.get(roomCode);
            if (room) {
                room.players = room.players.filter(p => p.id !== socket.id);
                
                if (room.players.length === 0) {
                    rooms.delete(roomCode);
                    console.log(`房间 ${roomCode} 已删除`);
                } else {
                    io.to(roomCode).emit('playerDisconnected');
                }
            }
        }
        console.log('玩家断开:', socket.id);
    });
});

// 健康检查
app.get('/', (req, res) => {
    res.send('Fate Battle Server Running');
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`服务器运行在端口 ${PORT}`);
});
