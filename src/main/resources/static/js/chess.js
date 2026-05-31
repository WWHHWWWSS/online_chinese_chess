class ChineseChess {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.gridSize = 60;
        this.padding = 40;
        this.boardCols = 9;
        this.boardRows = 10;

        this.pieces = [];
        this.selectedPiece = null;
        this.validMoves = [];
        this.currentTurn = 'red';
        this.moveHistory = [];
        this.moveIndex = 0;
        this.flipped = false;

        this.initPieces();
    }

    setFlipped(flipped) {
        this.flipped = flipped;
    }

    _tx(x) {
        return this.flipped ? 8 - x : x;
    }

    _ty(y) {
        return this.flipped ? 9 - y : y;
    }

    initPieces() {
        this.pieces = [];
        const layout = [
            { type: 'che', color: 'black', x: 0, y: 0, name: '車' },
            { type: 'ma', color: 'black', x: 1, y: 0, name: '馬' },
            { type: 'xiang', color: 'black', x: 2, y: 0, name: '象' },
            { type: 'shi', color: 'black', x: 3, y: 0, name: '士' },
            { type: 'jiang', color: 'black', x: 4, y: 0, name: '將' },
            { type: 'shi', color: 'black', x: 5, y: 0, name: '士' },
            { type: 'xiang', color: 'black', x: 6, y: 0, name: '象' },
            { type: 'ma', color: 'black', x: 7, y: 0, name: '馬' },
            { type: 'che', color: 'black', x: 8, y: 0, name: '車' },
            { type: 'pao', color: 'black', x: 1, y: 2, name: '砲' },
            { type: 'pao', color: 'black', x: 7, y: 2, name: '砲' },
            { type: 'bing', color: 'black', x: 0, y: 3, name: '卒' },
            { type: 'bing', color: 'black', x: 2, y: 3, name: '卒' },
            { type: 'bing', color: 'black', x: 4, y: 3, name: '卒' },
            { type: 'bing', color: 'black', x: 6, y: 3, name: '卒' },
            { type: 'bing', color: 'black', x: 8, y: 3, name: '卒' },

            { type: 'che', color: 'red', x: 0, y: 9, name: '車' },
            { type: 'ma', color: 'red', x: 1, y: 9, name: '馬' },
            { type: 'xiang', color: 'red', x: 2, y: 9, name: '相' },
            { type: 'shi', color: 'red', x: 3, y: 9, name: '仕' },
            { type: 'jiang', color: 'red', x: 4, y: 9, name: '帥' },
            { type: 'shi', color: 'red', x: 5, y: 9, name: '仕' },
            { type: 'xiang', color: 'red', x: 6, y: 9, name: '相' },
            { type: 'ma', color: 'red', x: 7, y: 9, name: '馬' },
            { type: 'che', color: 'red', x: 8, y: 9, name: '車' },
            { type: 'pao', color: 'red', x: 1, y: 7, name: '炮' },
            { type: 'pao', color: 'red', x: 7, y: 7, name: '炮' },
            { type: 'bing', color: 'red', x: 0, y: 6, name: '兵' },
            { type: 'bing', color: 'red', x: 2, y: 6, name: '兵' },
            { type: 'bing', color: 'red', x: 4, y: 6, name: '兵' },
            { type: 'bing', color: 'red', x: 6, y: 6, name: '兵' },
            { type: 'bing', color: 'red', x: 8, y: 6, name: '兵' },
        ];

        layout.forEach(p => {
            this.pieces.push({
                type: p.type,
                color: p.color,
                x: p.x,
                y: p.y,
                name: p.name,
                alive: true
            });
        });
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawBoard();
        this.drawPieces();
        this.drawValidMoves();
    }

    drawBoard() {
        const ctx = this.ctx;
        const gs = this.gridSize;
        const pd = this.padding;

        ctx.fillStyle = '#f0d9b5';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        ctx.strokeStyle = '#5d3a1a';
        ctx.lineWidth = 2;

        for (let i = 0; i < this.boardRows; i++) {
            ctx.beginPath();
            ctx.moveTo(pd + this._tx(0) * gs, pd + this._ty(i) * gs);
            ctx.lineTo(pd + this._tx(8) * gs, pd + this._ty(i) * gs);
            ctx.stroke();
        }

        for (let j = 0; j < this.boardCols; j++) {
            if (j === 0 || j === 8) {
                ctx.beginPath();
                ctx.moveTo(pd + this._tx(j) * gs, pd + this._ty(0) * gs);
                ctx.lineTo(pd + this._tx(j) * gs, pd + this._ty(9) * gs);
                ctx.stroke();
            } else {
                ctx.beginPath();
                ctx.moveTo(pd + this._tx(j) * gs, pd + this._ty(0) * gs);
                ctx.lineTo(pd + this._tx(j) * gs, pd + this._ty(4) * gs);
                ctx.stroke();

                ctx.beginPath();
                ctx.moveTo(pd + this._tx(j) * gs, pd + this._ty(5) * gs);
                ctx.lineTo(pd + this._tx(j) * gs, pd + this._ty(9) * gs);
                ctx.stroke();
            }
        }

        ctx.lineWidth = 3;
        ctx.strokeRect(pd - 1, pd - 1, 8 * gs + 2, 9 * gs + 2);

        this.drawPalaceLines(3, 0, 5, 2);
        this.drawPalaceLines(3, 7, 5, 9);

        this.drawRiverText();

        this.drawCrossMarks();
    }

    drawPalaceLines(x1, y1, x2, y2) {
        const ctx = this.ctx;
        const gs = this.gridSize;
        const pd = this.padding;

        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(pd + this._tx(x1) * gs, pd + this._ty(y1) * gs);
        ctx.lineTo(pd + this._tx(x2) * gs, pd + this._ty(y2) * gs);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(pd + this._tx(x2) * gs, pd + this._ty(y1) * gs);
        ctx.lineTo(pd + this._tx(x1) * gs, pd + this._ty(y2) * gs);
        ctx.stroke();
    }

    drawRiverText() {
        const ctx = this.ctx;
        const gs = this.gridSize;
        const pd = this.padding;
        const riverY = pd + this._ty(4.5) * gs;

        ctx.font = 'bold 28px "KaiTi", "STKaiti", serif';
        ctx.fillStyle = '#5d3a1a';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        ctx.fillText(this.flipped ? '漢 界' : '楚 河', pd + this._tx(2) * gs, riverY);
        ctx.fillText(this.flipped ? '楚 河' : '漢 界', pd + this._tx(6) * gs, riverY);
    }

    drawCrossMarks() {
        const positions = [
            [1, 2], [7, 2], [1, 7], [7, 7],
            [0, 3], [2, 3], [4, 3], [6, 3], [8, 3],
            [0, 6], [2, 6], [4, 6], [6, 6], [8, 6]
        ];

        positions.forEach(([x, y]) => {
            this.drawCrossMark(x, y);
        });
    }

    drawCrossMark(x, y) {
        const ctx = this.ctx;
        const gs = this.gridSize;
        const pd = this.padding;
        const cx = pd + this._tx(x) * gs;
        const cy = pd + this._ty(y) * gs;
        const len = 8;
        const gap = 4;

        ctx.lineWidth = 1.5;
        ctx.strokeStyle = '#5d3a1a';

        if (x > 0) {
            ctx.beginPath();
            ctx.moveTo(cx - gap, cy - gap);
            ctx.lineTo(cx - gap - len, cy - gap);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(cx - gap, cy - gap);
            ctx.lineTo(cx - gap, cy - gap - len);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(cx - gap, cy + gap);
            ctx.lineTo(cx - gap - len, cy + gap);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(cx - gap, cy + gap);
            ctx.lineTo(cx - gap, cy + gap + len);
            ctx.stroke();
        }

        if (x < 8) {
            ctx.beginPath();
            ctx.moveTo(cx + gap, cy - gap);
            ctx.lineTo(cx + gap + len, cy - gap);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(cx + gap, cy - gap);
            ctx.lineTo(cx + gap, cy - gap - len);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(cx + gap, cy + gap);
            ctx.lineTo(cx + gap + len, cy + gap);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(cx + gap, cy + gap);
            ctx.lineTo(cx + gap, cy + gap + len);
            ctx.stroke();
        }
    }

    drawPieces() {
        this.pieces.forEach(piece => {
            if (!piece.alive) return;
            this.drawPiece(piece);
        });
    }

    drawPiece(piece) {
        const ctx = this.ctx;
        const gs = this.gridSize;
        const pd = this.padding;
        const cx = pd + this._tx(piece.x) * gs;
        const cy = pd + this._ty(piece.y) * gs;
        const radius = gs * 0.42;

        const isSelected = this.selectedPiece === piece;

        ctx.save();

        if (isSelected) {
            ctx.shadowColor = '#f0c040';
            ctx.shadowBlur = 20;
        }

        const gradient = ctx.createRadialGradient(cx - 4, cy - 4, 2, cx, cy, radius);
        gradient.addColorStop(0, '#fff8e8');
        gradient.addColorStop(1, '#e8d5a0');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = piece.color === 'red' ? '#c0392b' : '#333';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(cx, cy, radius - 5, 0, Math.PI * 2);
        ctx.stroke();

        ctx.font = 'bold 26px "KaiTi", "STKaiti", "SimSun", serif';
        ctx.fillStyle = piece.color === 'red' ? '#c0392b' : '#222';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(piece.name, cx, cy + 1);

        if (isSelected) {
            ctx.strokeStyle = '#f0c040';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(cx, cy, radius + 3, 0, Math.PI * 2);
            ctx.stroke();
        }

        ctx.restore();
    }

    drawValidMoves() {
        const ctx = this.ctx;
        const gs = this.gridSize;
        const pd = this.padding;

        this.validMoves.forEach(move => {
            const cx = pd + this._tx(move.x) * gs;
            const cy = pd + this._ty(move.y) * gs;
            const targetPiece = this.getPieceAt(move.x, move.y);

            if (targetPiece) {
                ctx.strokeStyle = 'rgba(231, 76, 60, 0.7)';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(cx, cy, gs * 0.45, 0, Math.PI * 2);
                ctx.stroke();
            } else {
                ctx.fillStyle = 'rgba(46, 204, 113, 0.5)';
                ctx.beginPath();
                ctx.arc(cx, cy, 8, 0, Math.PI * 2);
                ctx.fill();
            }
        });
    }

    getPieceAt(x, y) {
        return this.pieces.find(p => p.alive && p.x === x && p.y === y);
    }

    getValidMoves(piece) {
        if (!piece || !piece.alive) return [];
        const moves = [];

        switch (piece.type) {
            case 'jiang':
                this.getJiangMoves(piece, moves);
                break;
            case 'shi':
                this.getShiMoves(piece, moves);
                break;
            case 'xiang':
                this.getXiangMoves(piece, moves);
                break;
            case 'ma':
                this.getMaMoves(piece, moves);
                break;
            case 'che':
                this.getCheMoves(piece, moves);
                break;
            case 'pao':
                this.getPaoMoves(piece, moves);
                break;
            case 'bing':
                this.getBingMoves(piece, moves);
                break;
        }

        return moves.filter(m => {
            const captured = this.getPieceAt(m.x, m.y);
            if (captured && captured.color === piece.color) return false;
            return !this.wouldBeInCheck(piece, m.x, m.y);
        });
    }

    getJiangMoves(piece, moves) {
        const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
        const minX = 3, maxX = 5;
        const minY = piece.color === 'red' ? 7 : 0;
        const maxY = piece.color === 'red' ? 9 : 2;

        dirs.forEach(([dx, dy]) => {
            const nx = piece.x + dx;
            const ny = piece.y + dy;
            if (nx >= minX && nx <= maxX && ny >= minY && ny <= maxY) {
                moves.push({ x: nx, y: ny });
            }
        });

        const opponent = this.pieces.find(p => p.alive && p.type === 'jiang' && p.color !== piece.color);
        if (opponent && opponent.x === piece.x) {
            let blocked = false;
            const minY2 = Math.min(piece.y, opponent.y);
            const maxY2 = Math.max(piece.y, opponent.y);
            for (let y = minY2 + 1; y < maxY2; y++) {
                if (this.getPieceAt(piece.x, y)) {
                    blocked = true;
                    break;
                }
            }
            if (!blocked) {
                moves.push({ x: opponent.x, y: opponent.y });
            }
        }
    }

    getShiMoves(piece, moves) {
        const dirs = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
        const minX = 3, maxX = 5;
        const minY = piece.color === 'red' ? 7 : 0;
        const maxY = piece.color === 'red' ? 9 : 2;

        dirs.forEach(([dx, dy]) => {
            const nx = piece.x + dx;
            const ny = piece.y + dy;
            if (nx >= minX && nx <= maxX && ny >= minY && ny <= maxY) {
                moves.push({ x: nx, y: ny });
            }
        });
    }

    getXiangMoves(piece, moves) {
        const dirs = [[2, 2], [2, -2], [-2, 2], [-2, -2]];
        const minY = piece.color === 'red' ? 5 : 0;
        const maxY = piece.color === 'red' ? 9 : 4;

        dirs.forEach(([dx, dy]) => {
            const nx = piece.x + dx;
            const ny = piece.y + dy;
            const blockX = piece.x + dx / 2;
            const blockY = piece.y + dy / 2;
            if (nx >= 0 && nx <= 8 && ny >= minY && ny <= maxY) {
                if (!this.getPieceAt(blockX, blockY)) {
                    moves.push({ x: nx, y: ny });
                }
            }
        });
    }

    getMaMoves(piece, moves) {
        const jumps = [
            { dx: 1, dy: 2, bx: 0, by: 1 },
            { dx: 1, dy: -2, bx: 0, by: -1 },
            { dx: -1, dy: 2, bx: 0, by: 1 },
            { dx: -1, dy: -2, bx: 0, by: -1 },
            { dx: 2, dy: 1, bx: 1, by: 0 },
            { dx: 2, dy: -1, bx: 1, by: 0 },
            { dx: -2, dy: 1, bx: -1, by: 0 },
            { dx: -2, dy: -1, bx: -1, by: 0 },
        ];

        jumps.forEach(j => {
            const nx = piece.x + j.dx;
            const ny = piece.y + j.dy;
            const blockX = piece.x + j.bx;
            const blockY = piece.y + j.by;
            if (nx >= 0 && nx <= 8 && ny >= 0 && ny <= 9) {
                if (!this.getPieceAt(blockX, blockY)) {
                    moves.push({ x: nx, y: ny });
                }
            }
        });
    }

    getCheMoves(piece, moves) {
        const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
        dirs.forEach(([dx, dy]) => {
            let nx = piece.x + dx;
            let ny = piece.y + dy;
            while (nx >= 0 && nx <= 8 && ny >= 0 && ny <= 9) {
                const target = this.getPieceAt(nx, ny);
                if (target) {
                    if (target.color !== piece.color) {
                        moves.push({ x: nx, y: ny });
                    }
                    break;
                }
                moves.push({ x: nx, y: ny });
                nx += dx;
                ny += dy;
            }
        });
    }

    getPaoMoves(piece, moves) {
        const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
        dirs.forEach(([dx, dy]) => {
            let nx = piece.x + dx;
            let ny = piece.y + dy;
            let jumped = false;
            while (nx >= 0 && nx <= 8 && ny >= 0 && ny <= 9) {
                const target = this.getPieceAt(nx, ny);
                if (!jumped) {
                    if (target) {
                        jumped = true;
                    } else {
                        moves.push({ x: nx, y: ny });
                    }
                } else {
                    if (target) {
                        if (target.color !== piece.color) {
                            moves.push({ x: nx, y: ny });
                        }
                        break;
                    }
                }
                nx += dx;
                ny += dy;
            }
        });
    }

    getBingMoves(piece, moves) {
        if (piece.color === 'red') {
            moves.push({ x: piece.x, y: piece.y - 1 });
            if (piece.y <= 4) {
                moves.push({ x: piece.x - 1, y: piece.y });
                moves.push({ x: piece.x + 1, y: piece.y });
            }
        } else {
            moves.push({ x: piece.x, y: piece.y + 1 });
            if (piece.y >= 5) {
                moves.push({ x: piece.x - 1, y: piece.y });
                moves.push({ x: piece.x + 1, y: piece.y });
            }
        }
    }

    wouldBeInCheck(piece, toX, toY) {
        const origX = piece.x;
        const origY = piece.y;
        const captured = this.getPieceAt(toX, toY);

        piece.x = toX;
        piece.y = toY;
        if (captured) captured.alive = false;

        const inCheck = this.isInCheck(piece.color);

        piece.x = origX;
        piece.y = origY;
        if (captured) captured.alive = true;

        return inCheck;
    }

    isInCheck(color) {
        const king = this.pieces.find(p => p.alive && p.type === 'jiang' && p.color === color);
        if (!king) return true;

        const opponentColor = color === 'red' ? 'black' : 'red';
        return this.pieces.some(p => {
            if (!p.alive || p.color !== opponentColor) return false;
            const rawMoves = [];
            switch (p.type) {
                case 'jiang': this.getJiangMoves(p, rawMoves); break;
                case 'shi': this.getShiMoves(p, rawMoves); break;
                case 'xiang': this.getXiangMoves(p, rawMoves); break;
                case 'ma': this.getMaMoves(p, rawMoves); break;
                case 'che': this.getCheMoves(p, rawMoves); break;
                case 'pao': this.getPaoMoves(p, rawMoves); break;
                case 'bing': this.getBingMoves(p, rawMoves); break;
            }
            return rawMoves.some(m => m.x === king.x && m.y === king.y);
        });
    }

    isCheckmate(color) {
        const pieces = this.pieces.filter(p => p.alive && p.color === color);
        for (const piece of pieces) {
            const moves = this.getValidMoves(piece);
            if (moves.length > 0) return false;
        }
        return true;
    }

    movePiece(piece, toX, toY) {
        const captured = this.getPieceAt(toX, toY);
        const moveData = {
            fromX: piece.x,
            fromY: piece.y,
            toX: toX,
            toY: toY,
            piece: piece.type,
            pieceName: piece.name,
            pieceColor: piece.color,
            captured: captured ? { type: captured.type, name: captured.name, color: captured.color } : null,
            moveIndex: this.moveIndex
        };

        if (captured) {
            captured.alive = false;
        }

        piece.x = toX;
        piece.y = toY;
        this.moveIndex++;

        this.currentTurn = this.currentTurn === 'red' ? 'black' : 'red';

        this.selectedPiece = null;
        this.validMoves = [];

        this.draw();

        return moveData;
    }

    handleClick(canvasX, canvasY) {
        const gs = this.gridSize;
        const pd = this.padding;

        const viewX = Math.round((canvasX - pd) / gs);
        const viewY = Math.round((canvasY - pd) / gs);

        const boardX = this.flipped ? 8 - viewX : viewX;
        const boardY = this.flipped ? 9 - viewY : viewY;

        if (boardX < 0 || boardX > 8 || boardY < 0 || boardY > 9) return null;

        const clickedPiece = this.getPieceAt(boardX, boardY);

        if (this.selectedPiece) {
            const isValidMove = this.validMoves.some(m => m.x === boardX && m.y === boardY);

            if (isValidMove) {
                const moveData = this.movePiece(this.selectedPiece, boardX, boardY);
                return { type: 'move', data: moveData };
            }

            if (clickedPiece && clickedPiece.color === this.currentTurn) {
                this.selectedPiece = clickedPiece;
                this.validMoves = this.getValidMoves(clickedPiece);
                this.draw();
                return { type: 'select' };
            }

            this.selectedPiece = null;
            this.validMoves = [];
            this.draw();
            return null;
        }

        if (clickedPiece && clickedPiece.color === this.currentTurn) {
            this.selectedPiece = clickedPiece;
            this.validMoves = this.getValidMoves(clickedPiece);
            this.draw();
            return { type: 'select' };
        }

        return null;
    }

    applyOpponentMove(fromX, fromY, toX, toY) {
        const piece = this.getPieceAt(fromX, fromY);
        if (piece) {
            this.movePiece(piece, toX, toY);
        }
    }

    getMoveNotation(moveData) {
        const colNames = { red: ['九', '八', '七', '六', '五', '四', '三', '二', '一'], black: ['1', '2', '3', '4', '5', '6', '7', '8', '9'] };
        const color = moveData.pieceColor;
        const colName = colNames[color][moveData.fromX];
        const direction = (color === 'red' && moveData.toY < moveData.fromY) || (color === 'black' && moveData.toY > moveData.fromY) ? '进' :
                          (color === 'red' && moveData.toY > moveData.fromY) || (color === 'black' && moveData.toY < moveData.fromY) ? '退' : '平';

        let target;
        if (moveData.fromX === moveData.toX) {
            const steps = Math.abs(moveData.toY - moveData.fromY);
            const numNames = { red: ['', '一', '二', '三', '四', '五', '六', '七', '八', '九'], black: ['', '1', '2', '3', '4', '5', '6', '7', '8', '9'] };
            target = numNames[color][steps];
        } else {
            target = colNames[color][moveData.toX];
        }

        return `${moveData.pieceName}${colName}${direction}${target}`;
    }

    toFEN() {
        var fenMap = {
            red: { jiang: 'K', shi: 'A', xiang: 'B', ma: 'N', che: 'R', pao: 'C', bing: 'P' },
            black: { jiang: 'k', shi: 'a', xiang: 'b', ma: 'n', che: 'r', pao: 'c', bing: 'p' }
        };

        var board = [];
        for (var y = 0; y < 10; y++) {
            board[y] = [];
            for (var x = 0; x < 9; x++) {
                board[y][x] = null;
            }
        }

        for (var i = 0; i < this.pieces.length; i++) {
            var p = this.pieces[i];
            if (p.alive) {
                board[p.y][p.x] = fenMap[p.color][p.type];
            }
        }

        var fen = '';
        for (var y = 0; y < 10; y++) {
            var empty = 0;
            for (var x = 0; x < 9; x++) {
                if (board[y][x] === null) {
                    empty++;
                } else {
                    if (empty > 0) {
                        fen += empty;
                        empty = 0;
                    }
                    fen += board[y][x];
                }
            }
            if (empty > 0) fen += empty;
            if (y < 9) fen += '/';
        }

        fen += ' ' + (this.currentTurn === 'red' ? 'w' : 'b');
        fen += ' - - 0 1';

        return fen;
    }

    applyFENMove(fromX, fromY, toX, toY) {
        var piece = this.getPieceAt(fromX, fromY);
        if (!piece) return null;
        return this.movePiece(piece, toX, toY);
    }
}
