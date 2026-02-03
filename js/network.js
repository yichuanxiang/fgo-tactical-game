// 网络管理器
class NetworkManager {
    constructor() {
        this.socket = null;
        this.roomCode = null;
        this.myTeam = null;
        this.isHost = false;
        this.connected = false;
        this.onGameStart = null;
        this.onGameAction = null;
        this.onTurnChanged = null;
        this.onPlayerDisconnected = null;
    }

    // 连接服务器
    connect(serverUrl) {
        return new Promise((resolve, reject) => {
            this.socket = io(serverUrl);
            
            this.socket.on('connect', () => {
                this.connected = true;
                console.log('已连接到服务器');
                resolve();
            });
            
            this.socket.on('connect_error', (err) => {
                console.error('连接失败:', err);
                reject(err);
            });
            
            // 房间创建成功
            this.socket.on('roomCreated', ({ roomCode, team }) => {
                this.roomCode = roomCode;
                this.myTeam = team;
                this.isHost = true;
                if (this.onRoomCreated) this.onRoomCreated(roomCode);
            });
            
            // 加入房间成功
            this.socket.on('roomJoined', ({ roomCode, team }) => {
                this.roomCode = roomCode;
                this.myTeam = team;
                this.isHost = false;
            });
            
            // 加入房间失败
            this.socket.on('joinError', (msg) => {
                if (this.onJoinError) this.onJoinError(msg);
            });
            
            // 游戏开始
            this.socket.on('gameStart', (data) => {
                if (this.onGameStart) this.onGameStart(data);
            });
            
            // 收到对方操作
            this.socket.on('gameAction', (action) => {
                if (this.onGameAction) this.onGameAction(action);
            });
            
            // 回合切换
            this.socket.on('turnChanged', (data) => {
                if (this.onTurnChanged) this.onTurnChanged(data);
            });
            
            // 对方断开
            this.socket.on('playerDisconnected', () => {
                if (this.onPlayerDisconnected) this.onPlayerDisconnected();
            });
        });
    }

    // 创建房间
    createRoom(playerName) {
        this.socket.emit('createRoom', playerName);
    }

    // 加入房间
    joinRoom(roomCode, playerName) {
        this.socket.emit('joinRoom', { roomCode: roomCode.toUpperCase(), playerName });
    }

    // 发送游戏操作
    sendAction(action) {
        if (this.socket && this.roomCode) {
            this.socket.emit('gameAction', action);
        }
    }

    // 结束回合
    endTurn() {
        if (this.socket && this.roomCode) {
            this.socket.emit('turnEnd', {});
        }
    }

    // 是否是我的回合
    isMyTurn(currentTurn) {
        return currentTurn === this.myTeam;
    }
}

// 全局网络管理器
const networkManager = new NetworkManager();
