const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const BattleCore = require('../www/js/battleCore');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const {
    generateInitialBattleState,
    generateRoomCode,
    nextTurn,
    manhattanDistance,
    isInsideMap
} = BattleCore;

// 房间管理
const rooms = new Map();

// 服务器端操作验证
function validateAction(action, room) {
    if (!action || typeof action.type !== 'string') {
        return '无效操作格式';
    }

    // stateSync 数据量限制：防止恶意超大包
    if (action.type === 'stateSync') {
        const stateStr = JSON.stringify(action.state || {});
        if (stateStr.length > 50000) {
            return '状态数据过大';
        }
        return null;
    }

    // 移动验证：目标必须在地图内
    if (action.type === 'move') {
        if (typeof action.toX !== 'number' || typeof action.toY !== 'number') {
            return '移动目标坐标缺失';
        }
        if (!isInsideMap(action.toX, action.toY)) {
            return `移动目标超出地图: (${action.toX}, ${action.toY})`;
        }
        // 使用最近的 stateSync 快照验证移动距离
        if (room.gameState && room.gameState.units) {
            const unitState = room.gameState.units.find(u => u.team === action.team);
            if (unitState) {
                const dist = manhattanDistance(
                    { x: unitState.x, y: unitState.y },
                    { x: action.toX, y: action.toY }
                );
                // 最大移动范围不超过 8（含加成），超过则视为非法
                if (dist > 8) {
                    return `移动距离过远: ${dist}`;
                }
            }
        }
        return null;
    }

    // 攻击验证：伤害值上限
    if (action.type === 'attack') {
        if (typeof action.damage === 'number' && action.damage > 500) {
            return `异常伤害值: ${action.damage}`;
        }
        return null;
    }

    // 其他操作类型（skill, noble, dice, endTurn）暂时放行
    return null;
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
            phase: 'waiting', // waiting, selecting, playing
            initialState: null
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
                room.currentTurn = 'player';
                room.initialState = generateInitialBattleState();
                io.to(roomCode).emit('gameStart', {
                    players: room.players.map(p => ({ 
                        team: p.team, 
                        character: p.character,
                        name: p.name
                    })),
                    currentTurn: 'player',
                    initialState: room.initialState
                });
                console.log(`房间 ${roomCode} 游戏开始`);
            }
        }
    });
    
    // 游戏操作同步
    socket.on('gameAction', (action) => {
        const roomCode = socket.roomCode;
        if (!roomCode) return;

        const room = rooms.get(roomCode);
        if (!room || room.phase !== 'playing') {
            return;
        }

        if (room.currentTurn !== socket.playerTeam) {
            console.log(`忽略越权操作: ${socket.playerTeam} 在 ${room.currentTurn} 回合发送动作`);
            return;
        }

        const payload = {
            ...action,
            team: socket.playerTeam
        };

        // 服务器端操作验证
        const rejection = validateAction(payload, room);
        if (rejection) {
            console.log(`拒绝非法操作: ${rejection}`);
            socket.emit('actionRejected', { reason: rejection });
            return;
        }

        if (payload.type === 'stateSync' && payload.state) {
            room.gameState = payload.state;
        }

        // 广播给房间内其他玩家
        socket.to(roomCode).emit('gameAction', payload);
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
            if (room.phase !== 'playing') {
                console.log('错误: 房间尚未进入对战阶段');
                return;
            }

            if (room.currentTurn !== socket.playerTeam) {
                console.log(`错误: ${socket.playerTeam} 试图在 ${room.currentTurn} 回合结束回合`);
                return;
            }

            const oldTurn = room.currentTurn;
            room.currentTurn = nextTurn(room.currentTurn);
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
