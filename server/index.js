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
            players: [{ id: socket.id, name: playerName, team: 'player', character: null, ready: false }],
            gameState: null,
            currentTurn: 'player',
            phase: 'waiting' // waiting, selecting, playing
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
        
        room.players.push({ id: socket.id, name: playerName, team: 'enemy', character: null, ready: false });
        room.phase = 'selecting';
        socket.join(roomCode);
        socket.roomCode = roomCode;
        socket.playerTeam = 'enemy';
        
        socket.emit('roomJoined', { roomCode, team: 'enemy' });
        
        // 通知双方进入角色选择
        io.to(roomCode).emit('startCharacterSelect', {
            players: room.players.map(p => ({ name: p.name, team: p.team }))
        });
        
        console.log(`玩家加入房间 ${roomCode}，进入角色选择`);
    });
    
    // 角色选择
    socket.on('selectCharacter', (characterId) => {
        const roomCode = socket.roomCode;
        if (!roomCode) return;
        
        const room = rooms.get(roomCode);
        if (!room) return;
        
        const player = room.players.find(p => p.id === socket.id);
        if (player) {
            player.character = characterId;
            player.ready = true;
            
            // 通知对方我选了什么
            socket.to(roomCode).emit('opponentSelected', { 
                team: player.team, 
                character: characterId 
            });
            
            // 检查是否双方都选好了
            if (room.players.every(p => p.ready)) {
                room.phase = 'playing';
                io.to(roomCode).emit('gameStart', {
                    players: room.players.map(p => ({ 
                        team: p.team, 
                        character: p.character,
                        name: p.name
                    })),
                    currentTurn: 'player'
                });
                console.log(`房间 ${roomCode} 游戏开始`);
            }
        }
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
        console.log(`收到turnEnd请求, roomCode: ${roomCode}, socketId: ${socket.id}`);
        
        if (!roomCode) {
            console.log('错误: 没有roomCode');
            return;
        }
        
        const room = rooms.get(roomCode);
        if (room) {
            const oldTurn = room.currentTurn;
            room.currentTurn = room.currentTurn === 'player' ? 'enemy' : 'player';
            console.log(`回合切换: ${oldTurn} -> ${room.currentTurn}`);
            io.to(roomCode).emit('turnChanged', { currentTurn: room.currentTurn });
            console.log(`已广播turnChanged到房间 ${roomCode}`);
        } else {
            console.log('错误: 房间不存在');
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
