class ChessAI {
    constructor(chess, color, maxDepth) {
        this.chess = chess;
        this.aiColor = color || 'black';
        this.maxDepth = maxDepth || 9;
        this.moveCount = 0;
        this.nodesSearched = 0;
        this.startTime = 0;
        this.timeLimit = 6000;
        this.searchAborted = false;
        this.lastAIMove = null;

        this.pieceValues = {
            jiang: 10000, che: 900, pao: 550, ma: 350, xiang: 120, shi: 120, bing: 50
        };

        this.pst = this._initPST();

        this.zobrist = this._initZobrist();
        this.tt = {};
        this.ttMaxSize = 800000;

        this.killerMoves = {};
        this.historyTable = {};
    }

    _initPST() {
        var jiang_red = [
            [0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0],[0,0,0,10,10,10,0,0,0],
            [0,0,0,10,10,10,0,0,0]
        ];
        var shi_red = [
            [0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0],[0,0,0,0,20,0,0,0,0],
            [0,0,0,20,0,20,0,0,0]
        ];
        var xiang_red = [
            [0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0],[0,0,20,0,0,0,20,0,0],
            [0,0,0,0,0,0,0,0,0],[0,0,20,0,20,0,20,0,20],[0,0,0,0,0,0,0,0,0],
            [0,0,20,0,0,0,20,0,0]
        ];
        var ma_red = [
            [4,8,16,12,4,12,16,8,4],[4,10,28,16,8,16,28,10,4],
            [12,14,16,20,18,20,16,14,12],[8,24,18,24,20,24,18,24,8],
            [6,16,14,18,16,18,14,16,6],[4,12,16,14,12,14,16,12,4],
            [2,6,8,6,10,6,8,6,2],[4,2,6,4,4,4,6,2,4],
            [0,2,4,4,4,4,4,2,0],[0,-4,0,0,0,0,0,-4,0]
        ];
        var che_red = [
            [8,8,8,12,14,12,8,8,8],[8,12,10,16,18,16,10,12,8],
            [8,8,8,12,14,12,8,8,8],[8,12,10,16,16,16,10,12,8],
            [8,8,8,12,14,12,8,8,8],[6,10,8,14,14,14,8,10,6],
            [4,6,6,10,10,10,6,6,4],[4,6,4,10,8,10,4,6,4],
            [6,4,6,12,6,12,6,4,6],[8,8,8,12,10,12,8,8,8]
        ];
        var pao_red = [
            [-6,-4,-4,-8,-10,-8,-4,-4,-6],[-4,-2,-2,-6,-8,-6,-2,-2,-4],
            [0,0,0,0,0,0,0,0,0],[-2,0,0,0,2,0,0,0,-2],
            [0,0,0,2,4,2,0,0,0],[0,2,4,4,8,4,4,2,0],
            [2,4,6,4,8,4,6,4,2],[4,4,8,8,12,8,8,4,4],
            [2,4,6,8,8,8,6,4,2],[2,4,6,8,10,8,6,4,2]
        ];
        var bing_red = [
            [9,9,9,11,13,11,9,9,9],[19,24,34,40,40,40,34,24,19],
            [7,12,16,18,18,18,16,12,7],[7,10,13,15,15,15,13,10,7],
            [5,5,5,5,5,5,5,5,5],[0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0]
        ];

        function flip(tbl) {
            var r = [];
            for (var i = 0; i < 10; i++) r.push(tbl[9 - i].slice());
            return r;
        }

        return {
            red: { jiang: jiang_red, shi: shi_red, xiang: xiang_red, ma: ma_red, che: che_red, pao: pao_red, bing: bing_red },
            black: { jiang: flip(jiang_red), shi: flip(shi_red), xiang: flip(xiang_red), ma: flip(ma_red), che: flip(che_red), pao: flip(pao_red), bing: flip(bing_red) }
        };
    }

    _initZobrist() {
        var types = ['jiang','shi','xiang','ma','che','pao','bing'];
        var colors = ['red','black'];
        var table = {};
        for (var c = 0; c < colors.length; c++) {
            table[colors[c]] = {};
            for (var t = 0; t < types.length; t++) {
                table[colors[c]][types[t]] = [];
                for (var y = 0; y < 10; y++) {
                    table[colors[c]][types[t]][y] = [];
                    for (var x = 0; x < 9; x++) {
                        table[colors[c]][types[t]][y][x] = this._rand64();
                    }
                }
            }
        }
        table.turn = this._rand64();
        return table;
    }

    _rand64() {
        var h = Math.imul(Math.random() * 0xFFFFFFFF | 0, 0x5bd1e995);
        var l = Math.imul(Math.random() * 0xFFFFFFFF | 0, 0x27d4eb2d);
        return (h >>> 0) * 0x100000000 + (l >>> 0);
    }

    computeHash() {
        var hash = 0;
        for (var i = 0; i < this.chess.pieces.length; i++) {
            var p = this.chess.pieces[i];
            if (p.alive) hash += this.zobrist[p.color][p.type][p.y][p.x];
        }
        if (this.chess.currentTurn === 'black') hash += this.zobrist.turn;
        return hash >>> 0;
    }

    ttStore(hash, depth, score, flag, bestMove) {
        this.tt[hash] = { depth: depth, score: score, flag: flag, bestMove: bestMove };
        if (Object.keys(this.tt).length > this.ttMaxSize) this.tt = {};
    }

    ttProbe(hash, depth, alpha, beta) {
        var entry = this.tt[hash];
        if (!entry) return null;
        if (entry.depth >= depth) {
            if (entry.flag === 0) return entry.score;
            if (entry.flag === 1 && entry.score <= alpha) return alpha;
            if (entry.flag === 2 && entry.score >= beta) return beta;
        }
        return null;
    }

    ttGetBestMove(hash) {
        var entry = this.tt[hash];
        return entry && entry.bestMove ? entry.bestMove : null;
    }

    historyKey(piece, move) {
        return piece.color + '_' + piece.type + '_' + move.x + '_' + move.y;
    }

    addHistory(piece, move, depth) {
        var key = this.historyKey(piece, move);
        if (!this.historyTable[key]) this.historyTable[key] = 0;
        this.historyTable[key] += depth * depth;
    }

    getHistory(piece, move) {
        return this.historyTable[this.historyKey(piece, move)] || 0;
    }

    scoreMove(piece, move, ply) {
        var score = 0;
        var captured = this.chess.getPieceAt(move.x, move.y);
        if (captured) {
            var victimVal = this.pieceValues[captured.type];
            var attackerVal = this.pieceValues[piece.type];
            if (victimVal >= attackerVal) {
                score += victimVal * 10 - attackerVal;
            } else {
                score -= (attackerVal - victimVal) * 8;
            }
        }
        var pstTbl = this.pst[piece.color][piece.type];
        if (pstTbl) {
            score += (pstTbl[move.y][move.x] - pstTbl[piece.y][piece.x]);
        }
        var km = this.killerMoves[ply];
        if (km && km.fromX === piece.x && km.fromY === piece.y && km.toX === move.x && km.toY === move.y) {
            score += 5000;
        }
        score += this.getHistory(piece, move);
        if (this.lastAIMove && piece.x === this.lastAIMove.toX && piece.y === this.lastAIMove.toY &&
            move.x === this.lastAIMove.fromX && move.y === this.lastAIMove.fromY) {
            score -= 50000;
        }
        return score;
    }

    generateSortedMoves(color, ply, ttBestMove) {
        var pieces = this.chess.pieces.filter(function (p) { return p.alive && p.color === color; });
        var allMoves = [];
        for (var i = 0; i < pieces.length; i++) {
            var piece = pieces[i];
            var moves = this.chess.getValidMoves(piece);
            for (var j = 0; j < moves.length; j++) {
                var move = moves[j];
                var s = this.scoreMove(piece, move, ply);
                if (ttBestMove && ttBestMove.fromX === piece.x && ttBestMove.fromY === piece.y &&
                    ttBestMove.toX === move.x && ttBestMove.toY === move.y) {
                    s += 100000;
                }
                allMoves.push({ piece: piece, move: move, score: s });
            }
        }
        allMoves.sort(function (a, b) { return b.score - a.score; });
        return allMoves;
    }

    getBestMove() {
        this.moveCount++;
        this.nodesSearched = 0;
        this.searchAborted = false;
        this.startTime = Date.now();

        if (typeof getOpeningBookMove === 'function' && this.moveCount <= 10) {
            var bookMove = getOpeningBookMove(this.chess.pieces);
            if (bookMove) {
                var piece = this.chess.getPieceAt(bookMove.fromX, bookMove.fromY);
                if (piece && piece.color === this.aiColor) {
                    var validMoves = this.chess.getValidMoves(piece);
                    var isValid = validMoves.some(function (m) { return m.x === bookMove.toX && m.y === bookMove.toY; });
                    if (isValid) {
                        this.lastAIMove = {
                            fromX: bookMove.fromX, fromY: bookMove.fromY,
                            toX: bookMove.toX, toY: bookMove.toY
                        };
                        return { piece: piece, move: { x: bookMove.toX, y: bookMove.toY } };
                    }
                }
            }
        }

        var allMoves = this.generateSortedMoves(this.aiColor, 0, null);
        if (allMoves.length === 0) return null;

        if (allMoves.length === 1) {
            return { piece: allMoves[0].piece, move: allMoves[0].move };
        }

        var bestMove = { piece: allMoves[0].piece, move: allMoves[0].move };
        var bestScore = -Infinity;

        for (var depth = 1; depth <= this.maxDepth; depth++) {
            this.searchAborted = false;
            var currentBest = null;
            var currentBestScore = -Infinity;
            var alpha = -Infinity;
            var beta = Infinity;

            var hash = this.computeHash();
            var ttBest = this.ttGetBestMove(hash);
            var orderedMoves = this.generateSortedMoves(this.aiColor, 0, ttBest);

            for (var i = 0; i < orderedMoves.length; i++) {
                var item = orderedMoves[i];
                var piece = item.piece;
                var move = item.move;
                var captured = this.chess.getPieceAt(move.x, move.y);
                var origX = piece.x;
                var origY = piece.y;

                piece.x = move.x;
                piece.y = move.y;
                if (captured) captured.alive = false;
                var oldTurn = this.chess.currentTurn;
                this.chess.currentTurn = this.chess.currentTurn === 'red' ? 'black' : 'red';

                var score = this.minimax(depth - 1, alpha, beta, false, 1);

                this.chess.currentTurn = oldTurn;
                piece.x = origX;
                piece.y = origY;
                if (captured) captured.alive = true;

                if (this.searchAborted) break;

                if (score > currentBestScore) {
                    currentBestScore = score;
                    currentBest = { piece: piece, move: move };
                }
                alpha = Math.max(alpha, score);
            }

            if (!this.searchAborted && currentBest) {
                bestMove = currentBest;
                bestScore = currentBestScore;
            }

            if (this.searchAborted) break;

            if (bestScore >= 90000 || bestScore <= -90000) break;

            if (Date.now() - this.startTime > this.timeLimit * 0.6) break;
        }

        if (!bestMove) {
            bestMove = { piece: allMoves[0].piece, move: allMoves[0].move };
        }

        if (this.moveCount <= 10 && bestScore < -100) {
            for (var q = 0; q < allMoves.length; q++) {
                var quiet = allMoves[q];
                var cap = this.chess.getPieceAt(quiet.move.x, quiet.move.y);
                if (!cap) {
                    bestMove = { piece: quiet.piece, move: quiet.move };
                    break;
                }
            }
        }

        this.lastAIMove = {
            fromX: bestMove.piece.x, fromY: bestMove.piece.y,
            toX: bestMove.move.x, toY: bestMove.move.y
        };

        return bestMove;
    }

    minimax(depth, alpha, beta, isMaximizing, ply) {
        this.nodesSearched++;

        if ((this.nodesSearched & 4095) === 0) {
            if (Date.now() - this.startTime > this.timeLimit) {
                this.searchAborted = true;
                return 0;
            }
        }

        if (this.searchAborted) return 0;

        var hash = this.computeHash();
        var ttResult = this.ttProbe(hash, depth, alpha, beta);
        if (ttResult !== null) return ttResult;

        if (depth <= 0) {
            var qScore = this.quiescence(alpha, beta, isMaximizing, ply, 6);
            return qScore;
        }

        var currentColor = isMaximizing ? this.aiColor : (this.aiColor === 'red' ? 'black' : 'red');
        var ttBest = this.ttGetBestMove(hash);
        var allMoves = this.generateSortedMoves(currentColor, ply, ttBest);

        if (allMoves.length === 0) {
            var mateScore = isMaximizing ? -99999 + ply : 99999 - ply;
            this.ttStore(hash, depth, mateScore, 0, null);
            return mateScore;
        }

        if (!isMaximizing && depth >= 3 && !this.isInCheck(currentColor)) {
            var oppColor = currentColor === 'red' ? 'black' : 'red';
            this.chess.currentTurn = oppColor;
            var nullScore = -this.minimax(depth - 3, -beta, -beta + 1, true, ply + 1);
            this.chess.currentTurn = currentColor;
            if (nullScore >= beta) {
                return beta;
            }
        }

        var origAlpha = alpha;
        var bestScore = isMaximizing ? -Infinity : Infinity;
        var bestMoveData = null;
        var movesSearched = 0;

        for (var i = 0; i < allMoves.length; i++) {
            var item = allMoves[i];
            var piece = item.piece;
            var move = item.move;
            var captured = this.chess.getPieceAt(move.x, move.y);
            var origX = piece.x;
            var origY = piece.y;

            piece.x = move.x;
            piece.y = move.y;
            if (captured) captured.alive = false;
            var oldTurn = this.chess.currentTurn;
            this.chess.currentTurn = this.chess.currentTurn === 'red' ? 'black' : 'red';

            var score;
            var doFullSearch = true;

            if (movesSearched >= 4 && depth >= 3 && !captured &&
                piece.type !== 'jiang' && !this.isInCheck(currentColor)) {
                var reduction = 1 + Math.floor(Math.log(depth) * Math.log(movesSearched) / 2);
                if (reduction >= 1) {
                    score = this.minimax(depth - 1 - reduction, alpha, beta, !isMaximizing, ply + 1);
                    if (isMaximizing && score > alpha) doFullSearch = true;
                    else if (!isMaximizing && score < beta) doFullSearch = true;
                    else doFullSearch = false;
                }
            }

            if (doFullSearch) {
                if (movesSearched >= 1) {
                    score = this.minimax(depth - 1, alpha, alpha + 1, !isMaximizing, ply + 1);
                    if (isMaximizing && score > alpha) {
                        score = this.minimax(depth - 1, alpha, beta, !isMaximizing, ply + 1);
                    } else if (!isMaximizing && score < beta) {
                        score = this.minimax(depth - 1, alpha, beta, !isMaximizing, ply + 1);
                    }
                } else {
                    score = this.minimax(depth - 1, alpha, beta, !isMaximizing, ply + 1);
                }
            }

            this.chess.currentTurn = oldTurn;
            piece.x = origX;
            piece.y = origY;
            if (captured) captured.alive = true;

            if (this.searchAborted) return 0;

            movesSearched++;

            if (isMaximizing) {
                if (score > bestScore) {
                    bestScore = score;
                    bestMoveData = { fromX: origX, fromY: origY, toX: move.x, toY: move.y };
                }
                alpha = Math.max(alpha, score);
            } else {
                if (score < bestScore) {
                    bestScore = score;
                    bestMoveData = { fromX: origX, fromY: origY, toX: move.x, toY: move.y };
                }
                beta = Math.min(beta, score);
            }

            if (beta <= alpha) {
                if (!captured) {
                    this.killerMoves[ply] = { fromX: origX, fromY: origY, toX: move.x, toY: move.y };
                    this.addHistory(piece, move, depth);
                }
                break;
            }
        }

        var flag;
        if (bestScore <= origAlpha) flag = 1;
        else if (bestScore >= beta) flag = 2;
        else flag = 0;
        this.ttStore(hash, depth, bestScore, flag, bestMoveData);

        return bestScore;
    }

    quiescence(alpha, beta, isMaximizing, ply, maxQDepth) {
        this.nodesSearched++;

        if ((this.nodesSearched & 4095) === 0) {
            if (Date.now() - this.startTime > this.timeLimit) {
                this.searchAborted = true;
                return 0;
            }
        }

        if (this.searchAborted) return 0;

        var standPat = this.evaluateBoard();

        if (maxQDepth <= 0) return standPat;

        if (isMaximizing) {
            if (standPat >= beta) return beta;
            if (standPat > alpha) alpha = standPat;
        } else {
            if (standPat <= alpha) return alpha;
            if (standPat < beta) beta = standPat;
        }

        var currentColor = isMaximizing ? this.aiColor : (this.aiColor === 'red' ? 'black' : 'red');
        var pieces = this.chess.pieces.filter(function (p) { return p.alive && p.color === currentColor; });
        var captureMoves = [];

        for (var i = 0; i < pieces.length; i++) {
            var piece = pieces[i];
            var moves = this.chess.getValidMoves(piece);
            for (var j = 0; j < moves.length; j++) {
                var move = moves[j];
                var captured = this.chess.getPieceAt(move.x, move.y);
                if (captured) {
                    var victimVal = this.pieceValues[captured.type];
                    var attackerVal = this.pieceValues[piece.type];
                    var s;
                    if (victimVal >= attackerVal) {
                        s = victimVal * 10 - attackerVal;
                    } else {
                        s = -(attackerVal - victimVal) * 8;
                    }
                    captureMoves.push({ piece: piece, move: move, score: s, victimVal: victimVal });
                }
            }
        }

        if (captureMoves.length === 0) return standPat;

        captureMoves.sort(function (a, b) {
            if (a.victimVal !== b.victimVal) return b.victimVal - a.victimVal;
            return b.score - a.score;
        });

        var bestScore = isMaximizing ? standPat : standPat;

        for (var k = 0; k < captureMoves.length; k++) {
            var item = captureMoves[k];
            var piece = item.piece;
            var move = item.move;
            var captured = this.chess.getPieceAt(move.x, move.y);
            var origX = piece.x;
            var origY = piece.y;

            var delta = this.pieceValues[captured.type] + 200;
            if (isMaximizing) {
                if (standPat + delta < alpha) continue;
            } else {
                if (standPat - delta > beta) continue;
            }

            if (this.pieceValues[piece.type] > this.pieceValues[captured.type] * 2) continue;

            piece.x = move.x;
            piece.y = move.y;
            captured.alive = false;
            var oldTurn = this.chess.currentTurn;
            this.chess.currentTurn = this.chess.currentTurn === 'red' ? 'black' : 'red';

            var score = this.quiescence(alpha, beta, !isMaximizing, ply + 1, maxQDepth - 1);

            this.chess.currentTurn = oldTurn;
            piece.x = origX;
            piece.y = origY;
            captured.alive = true;

            if (this.searchAborted) return 0;

            if (isMaximizing) {
                if (score > bestScore) bestScore = score;
                alpha = Math.max(alpha, score);
            } else {
                if (score < bestScore) bestScore = score;
                beta = Math.min(beta, score);
            }

            if (beta <= alpha) break;
        }

        return bestScore;
    }

    isInCheck(color) {
        var king = null;
        for (var i = 0; i < this.chess.pieces.length; i++) {
            var p = this.chess.pieces[i];
            if (p.alive && p.type === 'jiang' && p.color === color) {
                king = p;
                break;
            }
        }
        if (!king) return true;

        var oppColor = color === 'red' ? 'black' : 'red';
        var oppPieces = this.chess.pieces.filter(function (p) { return p.alive && p.color === oppColor; });
        for (var j = 0; j < oppPieces.length; j++) {
            var moves = this.chess.getValidMoves(oppPieces[j]);
            for (var k = 0; k < moves.length; k++) {
                if (moves[k].x === king.x && moves[k].y === king.y) return true;
            }
        }
        return false;
    }

    evaluateBoard() {
        var score = 0;
        var totalMaterial = 0;
        for (var i = 0; i < this.chess.pieces.length; i++) {
            var piece = this.chess.pieces[i];
            if (!piece.alive) continue;
            if (piece.type !== 'jiang') totalMaterial += this.pieceValues[piece.type];
        }
        var phase = Math.min(totalMaterial / 4000, 1);

        for (var i = 0; i < this.chess.pieces.length; i++) {
            var piece = this.chess.pieces[i];
            if (!piece.alive) continue;

            var value = this.pieceValues[piece.type];

            if (piece.type === 'pao') value += Math.round(90 * phase);
            if (piece.type === 'ma') value -= Math.round(50 * phase);

            var pstTable = this.pst[piece.color][piece.type];
            if (pstTable && piece.y >= 0 && piece.y < 10 && piece.x >= 0 && piece.x < 9) {
                value += pstTable[piece.y][piece.x];
            }

            if (piece.color === this.aiColor) score += value;
            else score -= value;
        }

        score += this.evaluatePieceSafety();

        return score;
    }

    evaluatePieceSafety() {
        var safetyScore = 0;
        var board = this.chess;
        var aiColor = this.aiColor;
        var oppColor = aiColor === 'red' ? 'black' : 'red';

        for (var i = 0; i < board.pieces.length; i++) {
            var piece = board.pieces[i];
            if (!piece.alive) continue;

            var pieceVal = this.pieceValues[piece.type];
            if (piece.type === 'jiang') continue;

            var minAttackerVal = this.findMinAttackerValue(piece);
            if (minAttackerVal < 0) continue;

            var minDefenderVal = this.findMinDefenderValue(piece);
            var isOurs = piece.color === aiColor;

            var penalty;
            if (minDefenderVal < 0) {
                penalty = Math.round(pieceVal * 0.85);
            } else if (minDefenderVal > minAttackerVal) {
                penalty = Math.round(pieceVal * 0.6);
            } else {
                penalty = Math.round((pieceVal - minDefenderVal) * 0.4);
            }

            if (isOurs) safetyScore -= penalty;
        }

        return safetyScore;
    }

    findMinDefenderValue(piece) {
        var board = this.chess;
        var friendColor = piece.color;
        var minVal = -1;
        var px = piece.x;
        var py = piece.y;

        var dirs = [[0,1],[0,-1],[1,0],[-1,0]];
        for (var d = 0; d < 4; d++) {
            var dx = dirs[d][0], dy = dirs[d][1];
            var nx = px + dx, ny = py + dy;
            var jumped = false;
            while (nx >= 0 && nx <= 8 && ny >= 0 && ny <= 9) {
                var target = board.getPieceAt(nx, ny);
                if (!jumped) {
                    if (target) {
                        if (target === piece) { nx += dx; ny += dy; continue; }
                        if (target.color === friendColor && target.type === 'che') {
                            var v = this.pieceValues.che;
                            if (minVal < 0 || v < minVal) minVal = v;
                        }
                        jumped = true;
                    }
                } else {
                    if (target) {
                        if (target.color === friendColor && target.type === 'pao') {
                            var v2 = this.pieceValues.pao;
                            if (minVal < 0 || v2 < minVal) minVal = v2;
                        }
                        break;
                    }
                }
                nx += dx;
                ny += dy;
            }
        }

        var maDeltas = [
            {dx:-2,dy:-1,lx:-1,ly:0},{dx:-2,dy:1,lx:-1,ly:0},
            {dx:2,dy:-1,lx:1,ly:0},{dx:2,dy:1,lx:1,ly:0},
            {dx:-1,dy:-2,lx:0,ly:-1},{dx:1,dy:-2,lx:0,ly:-1},
            {dx:-1,dy:2,lx:0,ly:1},{dx:1,dy:2,lx:0,ly:1}
        ];
        for (var m = 0; m < maDeltas.length; m++) {
            var md = maDeltas[m];
            var mx = px - md.dx, my = py - md.dy;
            if (mx < 0 || mx > 8 || my < 0 || my > 9) continue;
            var defender = board.getPieceAt(mx, my);
            if (defender && defender.color === friendColor && defender.type === 'ma') {
                var legX = mx + md.lx, legY = my + md.ly;
                if (!board.getPieceAt(legX, legY)) {
                    var v3 = this.pieceValues.ma;
                    if (minVal < 0 || v3 < minVal) minVal = v3;
                }
            }
        }

        var bingDy = piece.color === 'red' ? -1 : 1;
        var bingDefends = [{dx:0,dy:bingDy},{dx:-1,dy:bingDy},{dx:1,dy:bingDy}];
        for (var b = 0; b < bingDefends.length; b++) {
            var bx = px - bingDefends[b].dx, by = py - bingDefends[b].dy;
            if (bx < 0 || bx > 8 || by < 0 || by > 9) continue;
            var bing = board.getPieceAt(bx, by);
            if (bing && bing.color === friendColor && bing.type === 'bing') {
                var v4 = this.pieceValues.bing;
                if (minVal < 0 || v4 < minVal) minVal = v4;
            }
        }

        return minVal;
    }

    findMinAttackerValue(piece) {
        var board = this.chess;
        var oppColor = piece.color === 'red' ? 'black' : 'red';
        var minVal = -1;
        var px = piece.x;
        var py = piece.y;

        var dirs = [[0,1],[0,-1],[1,0],[-1,0]];
        for (var d = 0; d < 4; d++) {
            var dx = dirs[d][0], dy = dirs[d][1];
            var nx = px + dx, ny = py + dy;
            var jumped = false;
            while (nx >= 0 && nx <= 8 && ny >= 0 && ny <= 9) {
                var target = board.getPieceAt(nx, ny);
                if (!jumped) {
                    if (target) {
                        if (target.color === oppColor && target.type === 'che') {
                            var v = this.pieceValues.che;
                            if (minVal < 0 || v < minVal) minVal = v;
                        }
                        jumped = true;
                    }
                } else {
                    if (target) {
                        if (target.color === oppColor && target.type === 'pao') {
                            var v2 = this.pieceValues.pao;
                            if (minVal < 0 || v2 < minVal) minVal = v2;
                        }
                        break;
                    }
                }
                nx += dx;
                ny += dy;
            }
        }

        var maDeltas = [
            {dx:-2,dy:-1,lx:-1,ly:0},{dx:-2,dy:1,lx:-1,ly:0},
            {dx:2,dy:-1,lx:1,ly:0},{dx:2,dy:1,lx:1,ly:0},
            {dx:-1,dy:-2,lx:0,ly:-1},{dx:1,dy:-2,lx:0,ly:-1},
            {dx:-1,dy:2,lx:0,ly:1},{dx:1,dy:2,lx:0,ly:1}
        ];
        for (var m = 0; m < maDeltas.length; m++) {
            var md = maDeltas[m];
            var mx = px - md.dx, my = py - md.dy;
            if (mx < 0 || mx > 8 || my < 0 || my > 9) continue;
            var attacker = board.getPieceAt(mx, my);
            if (attacker && attacker.color === oppColor && attacker.type === 'ma') {
                var legX = mx + md.lx, legY = my + md.ly;
                if (!board.getPieceAt(legX, legY)) {
                    var v3 = this.pieceValues.ma;
                    if (minVal < 0 || v3 < minVal) minVal = v3;
                }
            }
        }

        var bingDy = piece.color === 'red' ? 1 : -1;
        var bingAttacks = [{dx:0,dy:bingDy},{dx:-1,dy:bingDy},{dx:1,dy:bingDy}];
        for (var b = 0; b < bingAttacks.length; b++) {
            var bx = px - bingAttacks[b].dx, by = py - bingAttacks[b].dy;
            if (bx < 0 || bx > 8 || by < 0 || by > 9) continue;
            var bing = board.getPieceAt(bx, by);
            if (bing && bing.color === oppColor && bing.type === 'bing') {
                var v4 = this.pieceValues.bing;
                if (minVal < 0 || v4 < minVal) minVal = v4;
            }
        }

        return minVal;
    }
}
