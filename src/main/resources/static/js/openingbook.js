var OpeningBook = (function () {
    var book = {};

    function boardKey(pieces) {
        var alive = pieces.filter(function (p) { return p.alive; });
        alive.sort(function (a, b) {
            if (a.color !== b.color) return a.color === 'red' ? 1 : -1;
            if (a.type !== b.type) return a.type < b.type ? -1 : 1;
            if (a.x !== b.x) return a.x - b.x;
            return a.y - b.y;
        });
        return alive.map(function (p) { return p.color[0] + p.type + p.x + p.y; }).join(',');
    }

    function addPosition(pieces, fromX, fromY, toX, toY) {
        var key = boardKey(pieces);
        if (!book[key]) book[key] = [];
        var moves = book[key];
        for (var i = 0; i < moves.length; i++) {
            if (moves[i].fromX === fromX && moves[i].fromY === fromY &&
                moves[i].toX === toX && moves[i].toY === toY) return;
        }
        moves.push({ fromX: fromX, fromY: fromY, toX: toX, toY: toY });
    }

    var initPieces = [
        { color: 'black', type: 'che', x: 0, y: 0, alive: true },
        { color: 'black', type: 'ma', x: 1, y: 0, alive: true },
        { color: 'black', type: 'xiang', x: 2, y: 0, alive: true },
        { color: 'black', type: 'shi', x: 3, y: 0, alive: true },
        { color: 'black', type: 'jiang', x: 4, y: 0, alive: true },
        { color: 'black', type: 'shi', x: 5, y: 0, alive: true },
        { color: 'black', type: 'xiang', x: 6, y: 0, alive: true },
        { color: 'black', type: 'ma', x: 7, y: 0, alive: true },
        { color: 'black', type: 'che', x: 8, y: 0, alive: true },
        { color: 'black', type: 'pao', x: 1, y: 2, alive: true },
        { color: 'black', type: 'pao', x: 7, y: 2, alive: true },
        { color: 'black', type: 'bing', x: 0, y: 3, alive: true },
        { color: 'black', type: 'bing', x: 2, y: 3, alive: true },
        { color: 'black', type: 'bing', x: 4, y: 3, alive: true },
        { color: 'black', type: 'bing', x: 6, y: 3, alive: true },
        { color: 'black', type: 'bing', x: 8, y: 3, alive: true },
        { color: 'red', type: 'che', x: 0, y: 9, alive: true },
        { color: 'red', type: 'ma', x: 1, y: 9, alive: true },
        { color: 'red', type: 'xiang', x: 2, y: 9, alive: true },
        { color: 'red', type: 'shi', x: 3, y: 9, alive: true },
        { color: 'red', type: 'jiang', x: 4, y: 9, alive: true },
        { color: 'red', type: 'shi', x: 5, y: 9, alive: true },
        { color: 'red', type: 'xiang', x: 6, y: 9, alive: true },
        { color: 'red', type: 'ma', x: 7, y: 9, alive: true },
        { color: 'red', type: 'che', x: 8, y: 9, alive: true },
        { color: 'red', type: 'pao', x: 1, y: 7, alive: true },
        { color: 'red', type: 'pao', x: 7, y: 7, alive: true },
        { color: 'red', type: 'bing', x: 0, y: 6, alive: true },
        { color: 'red', type: 'bing', x: 2, y: 6, alive: true },
        { color: 'red', type: 'bing', x: 4, y: 6, alive: true },
        { color: 'red', type: 'bing', x: 6, y: 6, alive: true },
        { color: 'red', type: 'bing', x: 8, y: 6, alive: true }
    ];

    function clonePieces(pieces) {
        return pieces.map(function (p) {
            return { color: p.color, type: p.type, x: p.x, y: p.y, alive: p.alive };
        });
    }

    function doMove(pieces, fromX, fromY, toX, toY) {
        var moved = null;
        var captured = null;
        for (var i = 0; i < pieces.length; i++) {
            if (pieces[i].alive && pieces[i].x === fromX && pieces[i].y === fromY) moved = pieces[i];
            if (pieces[i].alive && pieces[i].x === toX && pieces[i].y === toY && pieces[i] !== moved) captured = pieces[i];
        }
        if (!moved) return;
        if (captured) captured.alive = false;
        moved.x = toX;
        moved.y = toY;
    }

    var lines = [
        [[7, 7, 4, 7], [7, 0, 6, 2], [7, 9, 6, 7], [6, 3, 6, 4], [1, 9, 2, 7], [1, 0, 2, 2]],
        [[7, 7, 4, 7], [7, 0, 6, 2], [7, 9, 6, 7], [1, 0, 2, 2], [1, 9, 2, 7], [6, 3, 6, 4]],
        [[7, 7, 4, 7], [7, 0, 6, 2], [7, 9, 6, 7], [6, 3, 6, 4]],
        [[7, 7, 4, 7], [7, 0, 6, 2], [7, 9, 6, 7], [1, 0, 2, 2]],
        [[7, 7, 4, 7], [1, 0, 2, 2], [7, 9, 6, 7]],
        [[7, 7, 4, 7], [1, 0, 2, 2], [1, 9, 2, 7]],
        [[7, 7, 4, 7], [7, 2, 4, 2], [7, 9, 6, 7], [7, 0, 6, 2]],
        [[7, 7, 4, 7], [7, 2, 4, 2], [7, 9, 6, 7]],
        [[7, 7, 4, 7], [7, 2, 4, 2], [1, 9, 2, 7], [1, 0, 2, 2]],
        [[7, 7, 4, 7], [7, 2, 4, 2], [1, 9, 2, 7]],
        [[7, 7, 4, 7], [1, 0, 2, 2], [7, 9, 6, 7], [7, 2, 5, 2]],
        [[6, 9, 4, 7], [7, 0, 6, 2]],
        [[6, 9, 4, 7], [7, 2, 4, 2]],
        [[2, 9, 4, 7], [7, 0, 6, 2]],
        [[2, 9, 4, 7], [7, 2, 4, 2]],
        [[6, 6, 6, 5], [6, 3, 6, 4]],
        [[6, 6, 6, 5], [7, 0, 6, 2]],
        [[2, 6, 2, 5], [6, 3, 6, 4]],
        [[2, 6, 2, 5], [7, 0, 6, 2]],
        [[1, 9, 2, 7], [7, 0, 6, 2]],
        [[1, 9, 2, 7], [6, 3, 6, 4]],
        [[7, 9, 6, 7], [7, 0, 6, 2]],
        [[7, 9, 6, 7], [6, 3, 6, 4]],
        [[7, 7, 3, 7], [7, 0, 6, 2]],
        [[1, 7, 3, 7], [7, 0, 6, 2]],
        [[7, 7, 5, 7], [7, 0, 6, 2]],
        [[1, 7, 5, 7], [7, 0, 6, 2]],
        [[7, 7, 4, 7], [7, 0, 6, 2], [1, 9, 2, 7], [6, 3, 6, 4]],
        [[7, 7, 4, 7], [7, 0, 6, 2], [1, 9, 2, 7], [1, 0, 2, 2]],
        [[7, 7, 4, 7], [7, 0, 6, 2], [8, 9, 7, 7]],
        [[7, 7, 4, 7], [7, 0, 6, 2], [0, 9, 0, 8]],
        [[7, 7, 4, 7], [6, 3, 6, 4]],
        [[7, 7, 4, 7], [4, 3, 4, 4]],
        [[7, 7, 4, 7], [3, 0, 4, 1]],
        [[7, 7, 4, 7], [5, 0, 4, 1]],

        [[1, 7, 4, 7], [1, 0, 2, 2], [1, 9, 2, 7], [2, 3, 2, 4], [7, 9, 6, 7], [6, 0, 6, 2]],
        [[1, 7, 4, 7], [1, 0, 2, 2], [1, 9, 2, 7], [7, 0, 6, 2], [7, 9, 6, 7], [2, 3, 2, 4]],

        [[6, 9, 4, 7], [7, 0, 6, 2], [7, 9, 6, 7], [6, 3, 6, 4], [1, 9, 2, 7], [1, 0, 2, 2]],
        [[2, 9, 4, 7], [1, 0, 2, 2], [1, 9, 2, 7], [2, 3, 2, 4], [7, 9, 6, 7], [7, 0, 6, 2]],

        [[6, 6, 6, 5], [7, 0, 6, 2], [7, 9, 6, 7], [7, 2, 4, 2], [1, 9, 2, 7], [6, 3, 6, 4]],
        [[2, 6, 2, 5], [1, 0, 2, 2], [1, 9, 2, 7], [1, 2, 4, 2], [7, 9, 6, 7], [2, 3, 2, 4]]
    ];

    var redFirstStepResponses = [
        { redStep: [7, 7, 4, 7], blackSteps: [[7, 0, 6, 2], [1, 0, 2, 2], [7, 2, 4, 2], [1, 2, 4, 2], [6, 3, 6, 4], [2, 3, 2, 4], [4, 3, 4, 4], [3, 0, 4, 1], [5, 0, 4, 1]] },
        { redStep: [1, 7, 4, 7], blackSteps: [[1, 0, 2, 2], [7, 0, 6, 2], [1, 2, 4, 2], [7, 2, 4, 2], [2, 3, 2, 4], [6, 3, 6, 4]] },
        { redStep: [6, 9, 4, 7], blackSteps: [[7, 0, 6, 2], [1, 0, 2, 2], [7, 2, 4, 2], [2, 0, 4, 2], [6, 3, 6, 4]] },
        { redStep: [2, 9, 4, 7], blackSteps: [[1, 0, 2, 2], [7, 0, 6, 2], [1, 2, 4, 2], [7, 2, 4, 2], [2, 3, 2, 4]] },
        { redStep: [6, 6, 6, 5], blackSteps: [[6, 3, 6, 4], [7, 0, 6, 2], [1, 0, 2, 2], [2, 3, 2, 4]] },
        { redStep: [2, 6, 2, 5], blackSteps: [[2, 3, 2, 4], [1, 0, 2, 2], [7, 0, 6, 2], [6, 3, 6, 4]] },
        { redStep: [1, 9, 2, 7], blackSteps: [[7, 0, 6, 2], [1, 0, 2, 2], [6, 3, 6, 4], [7, 2, 4, 2]] },
        { redStep: [7, 9, 6, 7], blackSteps: [[7, 0, 6, 2], [1, 0, 2, 2], [6, 3, 6, 4], [1, 2, 4, 2]] },
        { redStep: [7, 7, 3, 7], blackSteps: [[7, 0, 6, 2], [1, 0, 2, 2], [3, 0, 4, 1]] },
        { redStep: [1, 7, 3, 7], blackSteps: [[1, 0, 2, 2], [7, 0, 6, 2], [5, 0, 4, 1]] },
        { redStep: [7, 7, 5, 7], blackSteps: [[7, 0, 6, 2], [5, 0, 4, 1]] },
        { redStep: [1, 7, 5, 7], blackSteps: [[1, 0, 2, 2], [3, 0, 4, 1]] },

    ];

    function buildBook() {
        for (var i = 0; i < lines.length; i++) {
            var line = lines[i];
            var pieces = clonePieces(initPieces);
            for (var j = 0; j < line.length; j++) {
                var m = line[j];
                addPosition(pieces, m[0], m[1], m[2], m[3]);
                doMove(pieces, m[0], m[1], m[2], m[3]);
            }
        }

        for (var k = 0; k < redFirstStepResponses.length; k++) {
            var response = redFirstStepResponses[k];
            var pieces = clonePieces(initPieces);
            addPosition(pieces, response.redStep[0], response.redStep[1], response.redStep[2], response.redStep[3]);
            doMove(pieces, response.redStep[0], response.redStep[1], response.redStep[2], response.redStep[3]);
            for (var l = 0; l < response.blackSteps.length; l++) {
                var blackMove = response.blackSteps[l];
                addPosition(pieces, blackMove[0], blackMove[1], blackMove[2], blackMove[3]);
            }
        }
    }

    buildBook();

    function getOpeningBookMove(pieces) {
        var key = boardKey(pieces);
        var moves = book[key];
        if (moves && moves.length > 0) {
            return moves[Math.floor(Math.random() * moves.length)];
        }
        return null;
    }

    return {
        getOpeningBookMove: getOpeningBookMove,
        boardKey: boardKey
    };
})();

function getOpeningBookMove(pieces) {
    return OpeningBook.getOpeningBookMove(pieces);
}
