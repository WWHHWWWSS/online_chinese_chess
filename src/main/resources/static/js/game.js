let chess = null;
let ws = null;
let userInfo = null;
let roomId = null;
let myColor = null;
let gameStarted = false;
let startTime = null;
let allMoves = [];
let iAmReady = false;
let isAIMode = false;
let aiDifficulty = 'beginner';
let ai = null;

function init() {
    const stored = localStorage.getItem('userInfo');
    if (!stored) {
        window.location.href = '/';
        return;
    }
    userInfo = JSON.parse(stored);

    fetch('/api/user/info').then(res => res.json()).then(data => {
        if (data.code !== 200) {
            localStorage.removeItem('userInfo');
            window.location.href = '/';
        }
    }).catch(() => {
        localStorage.removeItem('userInfo');
        window.location.href = '/';
    });

    const params = new URLSearchParams(window.location.search);
    const mode = params.get('mode');
    roomId = params.get('roomId');

    if (mode === 'ai') {
        isAIMode = true;
        aiDifficulty = params.get('difficulty') || 'beginner';
    } else if (!roomId) {
        window.location.href = '/lobby.html';
        return;
    }

    const canvas = document.getElementById('chessBoard');
    chess = new ChineseChess(canvas);
    chess.draw();

    canvas.addEventListener('click', handleCanvasClick);

    if (isAIMode) {
        initAIMode();
    } else {
        loadRoomInfo();
        connectWebSocket();
    }
}

function initAIMode() {
    myColor = 'red';
    gameStarted = false;
    iAmReady = false;

    chess.setFlipped(false);
    chess.draw();

    var diffLabel = aiDifficulty === 'master' ? '特级AI（皮卡鱼）' : '初级AI';
    document.getElementById('roomInfo').textContent = '人机对战 - ' + diffLabel;
    document.getElementById('redPlayerName').textContent = userInfo.nickname || userInfo.username || '你';
    document.getElementById('blackPlayerName').textContent = diffLabel;
    document.getElementById('readyBtn').style.display = 'block';
    document.getElementById('readyBtn').textContent = '准备';
    document.getElementById('readyBtn').disabled = false;
    document.getElementById('switchSideBtn').style.display = 'block';
    document.getElementById('switchSideBtn').disabled = false;
    document.querySelector('.chat-box').style.display = 'none';

    if (aiDifficulty === 'master') {
        checkPikafishStatus();
    }

    updateTurnIndicator();
    showToast('人机对战！请选择阵营后点击准备', 'info');
}

function handleCanvasClick(e) {
    if (!gameStarted || !myColor) return;
    if (chess.currentTurn !== myColor) return;

    const rect = e.target.getBoundingClientRect();
    const scaleX = e.target.width / rect.width;
    const scaleY = e.target.height / rect.height;
    const canvasX = (e.clientX - rect.left) * scaleX;
    const canvasY = (e.clientY - rect.top) * scaleY;

    const result = chess.handleClick(canvasX, canvasY);

    if (result && result.type === 'move') {
        const moveData = result.data;
        allMoves.push(moveData);

        addMoveLog(moveData);
        updateTurnIndicator();

        if (isAIMode) {
            checkGameEnd();
            if (gameStarted) {
                setTimeout(aiMove, 300);
            }
        } else {
            ws.send(JSON.stringify({
                type: 'move',
                roomId: parseInt(roomId),
                userId: userInfo.id,
                fromX: moveData.fromX,
                fromY: moveData.fromY,
                toX: moveData.toX,
                toY: moveData.toY,
                piece: moveData.piece,
                moveIndex: moveData.moveIndex
            }));

            checkGameEnd();
        }
    }
}

function aiMove() {
    if (!gameStarted) return;

    if (aiDifficulty === 'master') {
        pikafishMove();
    } else {
        beginnerAIMove();
    }
}

function beginnerAIMove() {
    if (!ai) return;

    const bestMove = ai.getBestMove();
    if (!bestMove) {
        const result = myColor === 'red' ? 0 : 1;
        endGame(result, 'checkmate');
        return;
    }

    const moveData = chess.movePiece(bestMove.piece, bestMove.move.x, bestMove.move.y);
    allMoves.push(moveData);

    addMoveLog(moveData);
    updateTurnIndicator();
    checkGameEnd();
}

function pikafishMove() {
    var fen = chess.toFEN();

    fetch('/api/ai/move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fen: fen, depth: 20 })
    }).then(function (res) { return res.json(); }).then(function (data) {
        if (data.code === 200 && data.bestMove) {
            var move = parsePikafishMove(data.bestMove);
            if (move) {
                var moveData = chess.applyFENMove(move.fromX, move.fromY, move.toX, move.toY);
                if (moveData) {
                    allMoves.push(moveData);
                    addMoveLog(moveData);
                    updateTurnIndicator();
                    checkGameEnd();
                    return;
                }
            }
        }
        showToast('AI计算出错，尝试回退到初级AI', 'error');
        aiDifficulty = 'beginner';
        ai = new ChessAI(chess, myColor === 'red' ? 'black' : 'red', 7);
        beginnerAIMove();
    }).catch(function (err) {
        console.error('Pikafish error:', err);
        showToast('AI连接失败，回退到初级AI', 'error');
        aiDifficulty = 'beginner';
        ai = new ChessAI(chess, myColor === 'red' ? 'black' : 'red', 7);
        beginnerAIMove();
    });
}

function parsePikafishMove(moveStr) {
    if (!moveStr || moveStr.length < 4) return null;

    var fromCol = moveStr.charCodeAt(0) - 'a'.charCodeAt(0);
    var fromRow = 9 - parseInt(moveStr[1]);
    var toCol = moveStr.charCodeAt(2) - 'a'.charCodeAt(0);
    var toRow = 9 - parseInt(moveStr[3]);

    if (fromCol < 0 || fromCol > 8 || fromRow < 0 || fromRow > 9 ||
        toCol < 0 || toCol > 8 || toRow < 0 || toRow > 9) return null;

    return { fromX: fromCol, fromY: fromRow, toX: toCol, toY: toRow };
}

function checkPikafishStatus() {
    fetch('/api/ai/status').then(function (res) { return res.json(); }).then(function (data) {
        if (data.code === 200 && !data.pikafishAvailable) {
            showToast('皮卡鱼引擎未就绪，将使用初级AI', 'warning');
            aiDifficulty = 'beginner';
            document.getElementById('roomInfo').textContent = '人机对战 - 初级AI';
            document.getElementById('blackPlayerName').textContent = '初级AI';
        }
    }).catch(function () {
        showToast('无法连接AI服务，将使用初级AI', 'warning');
        aiDifficulty = 'beginner';
        document.getElementById('roomInfo').textContent = '人机对战 - 初级AI';
        document.getElementById('blackPlayerName').textContent = '初级AI';
    });
}

async function loadRoomInfo() {
    try {
        const res = await fetch('/api/room/' + roomId);
        const data = await res.json();
        if (data.code === 200) {
            const room = data.data;
            document.getElementById('roomInfo').textContent = room.roomName + ' #' + room.id;
            document.getElementById('redPlayerName').textContent = room.redPlayerName || '红方';
            document.getElementById('blackPlayerName').textContent = room.blackPlayerName || '等待加入...';

            if (room.redPlayerId === userInfo.id) {
                myColor = 'red';
            } else if (room.blackPlayerId === userInfo.id) {
                myColor = 'black';
            }
            if (myColor) {
                chess.setFlipped(myColor === 'black');
                chess.draw();
            }
        }
    } catch (err) {
        console.error('Failed to load room info:', err);
    }
}

function connectWebSocket() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = protocol + '//' + window.location.host + '/ws/game';
    ws = new WebSocket(wsUrl);

    ws.onopen = function () {
        console.log('WebSocket connected');
        ws.send(JSON.stringify({
            type: 'auth',
            userId: userInfo.id,
            roomId: parseInt(roomId)
        }));
    };

    ws.onmessage = function (event) {
        const msg = JSON.parse(event.data);
        handleWebSocketMessage(msg);
    };

    ws.onclose = function () {
        console.log('WebSocket disconnected');
        showToast('连接断开，请刷新页面重试', 'error');
    };

    ws.onerror = function (err) {
        console.error('WebSocket error:', err);
    };
}

function handleWebSocketMessage(msg) {
    switch (msg.type) {
        case 'auth_success':
            console.log('Auth success');
            break;

        case 'player_joined':
            loadRoomInfo();
            break;

        case 'both_joined':
            if (msg.redUserId === userInfo.id) {
                myColor = 'red';
            } else if (msg.blackUserId === userInfo.id) {
                myColor = 'black';
            }
            chess.setFlipped(myColor === 'black');
            chess.draw();
            document.getElementById('redPlayerName').textContent = msg.redPlayerName || '红方';
            document.getElementById('blackPlayerName').textContent = msg.blackPlayerName || '黑方';
            document.getElementById('readyBtn').style.display = 'block';
            document.getElementById('switchSideBtn').style.display = 'block';
            showToast('双方已就位，请选择阵营后点击准备', 'info');
            break;

        case 'player_ready':
            if (msg.userId === userInfo.id) {
                iAmReady = true;
                document.getElementById('readyBtn').textContent = '已准备';
                document.getElementById('readyBtn').disabled = true;
                document.getElementById('switchSideBtn').disabled = true;
            } else {
                showToast('对手已准备', 'info');
            }
            break;

        case 'game_start':
            gameStarted = true;
            startTime = Date.now();
            loadRoomInfo();
            showToast('游戏开始！红方先行', 'success');
            updateTurnIndicator();
            document.getElementById('readyBtn').style.display = 'none';
            document.getElementById('switchSideBtn').style.display = 'none';
            break;

        case 'move':
            handleOpponentMove(msg);
            break;

        case 'chat':
            addChatMessage(msg.userId, msg.content);
            break;

        case 'opponent_ready':
            showToast('对手已准备', 'info');
            break;

        case 'opponent_disconnected':
            if (gameStarted) {
                gameStarted = false;
                const result = myColor === 'red' ? 0 : 1;
                endGame(result, 'surrender');
                showToast('对手断开连接，你获胜了！', 'success');
            } else {
                showToast('对手断开连接', 'error');
            }
            break;

        case 'host_left':
            gameStarted = false;
            showModal('房间解散', '房主离开，房间解散');
            break;

        case 'side_changed':
            handleSideChanged(msg);
            break;

        case 'draw_request':
            handleDrawRequest(msg);
            break;

        case 'draw_rejected':
            showToast('对手拒绝求和', 'info');
            break;

        case 'game_over':
            handleGameOver(msg);
            break;
    }
}

function handleOpponentMove(msg) {
    chess.applyOpponentMove(msg.fromX, msg.fromY, msg.toX, msg.toY);

    const moveData = {
        fromX: msg.fromX,
        fromY: msg.fromY,
        toX: msg.toX,
        toY: msg.toY,
        piece: msg.piece,
        pieceName: chess.getPieceAt(msg.toX, msg.toY)?.name || '',
        pieceColor: chess.currentTurn === 'red' ? 'black' : 'red',
        moveIndex: msg.moveIndex
    };
    allMoves.push(moveData);

    addMoveLog(moveData);
    updateTurnIndicator();
    checkGameEnd();
}

function checkGameEnd() {
    const currentColor = chess.currentTurn;

    if (chess.isInCheck(currentColor)) {
        if (chess.isCheckmate(currentColor)) {
            const winner = currentColor === 'red' ? 'black' : 'red';
            const result = winner === 'red' ? 0 : 1;
            endGame(result, 'checkmate');
            return;
        }
        showToast('将军！', 'error');
    }
}

function endGame(result, reason) {
    gameStarted = false;
    const duration = startTime ? Math.floor((Date.now() - startTime) / 1000) : 0;
    const movesJson = JSON.stringify(allMoves);

    if (!isAIMode) {
        fetch('/api/room/finish', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                roomId: parseInt(roomId),
                result: result,
                moves: movesJson,
                totalMoves: allMoves.length,
                duration: duration
            })
        }).catch(err => console.error(err));
    } else {
        fetch('/api/room/ai-record', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                result: result,
                moves: movesJson,
                totalMoves: allMoves.length,
                duration: duration,
                aiDifficulty: aiDifficulty || 'beginner',
                playerColor: myColor
            })
        }).then(function(res) { return res.json(); }).then(function(data) {
            if (data.code !== 200) {
                console.error('保存AI对战记录失败:', data.msg);
            }
        }).catch(function(err) { console.error('保存AI对战记录失败:', err); });
    }

    let title = '游戏结束';
    let message = '';

    if (reason === 'checkmate') {
        const winner = result === 0 ? '红方' : '黑方';
        message = winner + '获胜！';
    } else if (reason === 'surrender') {
        const loser = result === 0 ? '黑方' : '红方';
        message = loser + '认输';
    } else if (reason === 'draw') {
        message = '双方和棋';
    }

    showModal(title, message);
}

function updateTurnIndicator() {
    const indicator = document.getElementById('turnIndicator');
    if (chess.currentTurn === 'red') {
        indicator.className = 'turn-indicator red-turn';
        indicator.textContent = '红方走棋';
    } else {
        indicator.className = 'turn-indicator black-turn';
        indicator.textContent = '黑方走棋';
    }
}

function addMoveLog(moveData) {
    const log = document.getElementById('moveLog');
    const notation = chess.getMoveNotation(moveData);
    const colorLabel = moveData.pieceColor === 'red' ? '红' : '黑';
    const item = document.createElement('div');
    item.className = 'move-item';
    item.textContent = `${moveData.moveIndex + 1}. ${colorLabel} ${notation}`;
    log.appendChild(item);
    log.scrollTop = log.scrollHeight;
}

function addChatMessage(userId, content) {
    const container = document.getElementById('chatMessages');
    const msg = document.createElement('div');
    msg.className = 'chat-msg';
    const isMe = userId === userInfo.id;
    msg.innerHTML = `<span class="sender">${isMe ? '我' : '对手'}:</span> ${escapeHtml(content)}`;
    container.appendChild(msg);
    container.scrollTop = container.scrollHeight;
}

function sendChat() {
    const input = document.getElementById('chatInput');
    const content = input.value.trim();
    if (!content || !ws) return;

    ws.send(JSON.stringify({
        type: 'chat',
        roomId: parseInt(roomId),
        userId: userInfo.id,
        content: content
    }));

    input.value = '';
}

function requestDraw() {
    if (!gameStarted) return;
    if (isAIMode) {
        if (confirm('确定要求和吗？')) {
            endGame(2, 'draw');
        }
        return;
    }
    if (!ws) return;
    if (confirm('确定要向对手求和吗？')) {
        ws.send(JSON.stringify({
            type: 'draw_request',
            roomId: parseInt(roomId),
            userId: userInfo.id
        }));
        showToast('已发送求和请求', 'info');
    }
}

function handleDrawRequest(msg) {
    if (confirm('对手请求求和，是否同意？')) {
        ws.send(JSON.stringify({
            type: 'draw_response',
            roomId: parseInt(roomId),
            userId: userInfo.id,
            accepted: true
        }));
    } else {
        ws.send(JSON.stringify({
            type: 'draw_response',
            roomId: parseInt(roomId),
            userId: userInfo.id,
            accepted: false
        }));
    }
}

function surrender() {
    if (!gameStarted) return;
    if (isAIMode) {
        if (confirm('确定要认输吗？')) {
            const result = myColor === 'red' ? 1 : 0;
            endGame(result, 'surrender');
        }
        return;
    }
    if (!ws) return;
    if (confirm('确定要认输吗？')) {
        ws.send(JSON.stringify({
            type: 'surrender',
            roomId: parseInt(roomId),
            userId: userInfo.id
        }));

        const result = myColor === 'red' ? 1 : 0;
        endGame(result, 'surrender');
    }
}

function playerReady() {
    if (gameStarted || iAmReady) return;

    if (isAIMode) {
        iAmReady = true;
        document.getElementById('readyBtn').textContent = '已准备';
        document.getElementById('readyBtn').disabled = true;
        document.getElementById('switchSideBtn').disabled = true;

        if (aiDifficulty === 'beginner') {
            ai = new ChessAI(chess, myColor === 'red' ? 'black' : 'red', 7);
        }

        gameStarted = true;
        startTime = Date.now();

        showToast('游戏开始！你执' + (myColor === 'red' ? '红' : '黑') + '方' + (myColor === 'red' ? '先行' : ''), 'success');
        updateTurnIndicator();

        if (myColor === 'black') {
            setTimeout(aiMove, 300);
        }
        return;
    }

    if (!ws) return;
    ws.send(JSON.stringify({
        type: 'ready',
        roomId: parseInt(roomId),
        userId: userInfo.id
    }));
}

function switchSide() {
    if (gameStarted && !isAIMode) return;

    if (isAIMode) {
        chess.initPieces();
        chess.currentTurn = 'red';
        chess.selectedPiece = null;
        chess.validMoves = [];
        chess.moveHistory = [];
        chess.moveIndex = 0;

        allMoves = [];

        var newPlayerColor = myColor === 'red' ? 'black' : 'red';
        myColor = newPlayerColor;
        iAmReady = false;

        chess.setFlipped(newPlayerColor === 'black');
        chess.draw();

        var diffLabel = aiDifficulty === 'master' ? '特级AI（皮卡鱼）' : '初级AI';

        if (newPlayerColor === 'red') {
            document.getElementById('redPlayerName').textContent = userInfo.nickname || userInfo.username || '你';
            document.getElementById('blackPlayerName').textContent = diffLabel;
        } else {
            document.getElementById('redPlayerName').textContent = diffLabel;
            document.getElementById('blackPlayerName').textContent = userInfo.nickname || userInfo.username || '你';
        }

        document.getElementById('readyBtn').textContent = '准备';
        document.getElementById('readyBtn').disabled = false;
        document.getElementById('switchSideBtn').disabled = false;

        updateTurnIndicator();
        showToast('已换边！你执' + (myColor === 'red' ? '红' : '黑') + '方，点击准备开始', 'info');
        return;
    }

    if (!ws) return;
    ws.send(JSON.stringify({
        type: 'switch_side',
        roomId: parseInt(roomId),
        userId: userInfo.id
    }));
}

function handleSideChanged(msg) {
    if (msg.redUserId === userInfo.id) {
        myColor = 'red';
    } else if (msg.blackUserId === userInfo.id) {
        myColor = 'black';
    }

    chess.setFlipped(myColor === 'black');
    chess.draw();

    document.getElementById('redPlayerName').textContent = msg.redPlayerName || '红方';
    document.getElementById('blackPlayerName').textContent = msg.blackPlayerName || '黑方';

    iAmReady = false;
    document.getElementById('readyBtn').textContent = '准备';
    document.getElementById('readyBtn').disabled = false;
    document.getElementById('switchSideBtn').disabled = false;

    showToast('已换边！你现在是' + (myColor === 'red' ? '红方' : '黑方'), 'info');
}

function handleGameOver(msg) {
    gameStarted = false;
    let title = '游戏结束';
    let message = '';

    if (msg.reason === 'surrender') {
        const loser = msg.loserId === userInfo.id ? '你' : '对手';
        message = loser + '认输';
    } else if (msg.reason === 'draw') {
        message = '双方和棋';
    } else if (msg.reason === 'checkmate') {
        const winner = msg.result === 0 ? '红方' : '黑方';
        message = winner + '获胜！';
    }

    const duration = startTime ? Math.floor((Date.now() - startTime) / 1000) : 0;
    fetch('/api/room/finish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            roomId: parseInt(roomId),
            result: msg.result,
            moves: JSON.stringify(allMoves),
            totalMoves: allMoves.length,
            duration: duration
        })
    }).catch(err => console.error(err));

    showModal(title, message);
}

function showModal(title, message) {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalMessage').textContent = message;
    document.getElementById('modalOverlay').classList.remove('hidden');

    if (ws) {
        ws.close();
        ws = null;
    }

    setTimeout(function () {
        window.location.href = '/lobby.html';
    }, 3000);
}

function goBack() {
    if (!isAIMode && ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
            type: 'leave',
            roomId: parseInt(roomId),
            userId: userInfo.id
        }));
    }
    if (ws) ws.close();
    window.location.href = '/lobby.html';
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showToast(message, type) {
    const toast = document.createElement('div');
    toast.className = 'toast ' + type;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

init();
