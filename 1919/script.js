const board = document.getElementById('board');
const turnDisplay = document.getElementById('turn-display');
const newGameButton = document.getElementById('new-game');
const gameOverDisplay = document.getElementById('game-over-display');

let initialBoard = [
    ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'],
    ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
    ['', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', ''],
    ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
    ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R'],
];

const pieceUnicode = {
    'r': '♜', 'n': '♞', 'b': '♝', 'q': '♛', 'k': '♚', 'p': '♟',
    'R': '♖', 'N': '♘', 'B': '♗', 'Q': '♕', 'K': '♔', 'P': '♙',
};

let selectedSquare = null;
let validMoves = [];
let turn = 'white';
let boardState = JSON.parse(JSON.stringify(initialBoard));
let hasMoved = {
    'white': {
        'K': false,
        'R1': false,
        'R2': false,
    },
    'black': {
        'k': false,
        'r1': false,
        'r2': false,
    }
};
let gameOver = false;

function createBoard() {
    board.innerHTML = '';
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            const square = document.createElement('div');
            square.classList.add('square');
            if ((i + j) % 2 === 0) {
                square.classList.add('white');
            } else {
                square.classList.add('black');
            }
            square.dataset.row = i;
            square.dataset.col = j;
            board.appendChild(square);
        }
    }
}

function renderPieces() {
    const squares = document.querySelectorAll('.square');
    squares.forEach((square, i) => {
        const row = Math.floor(i / 8);
        const col = i % 8;
        const piece = boardState[row][col];
        square.innerHTML = '';
        if (piece) {
            square.innerHTML = `<span class="piece">${pieceUnicode[piece]}</span>`;
        }
    });
}

function isSquareAttacked(row, col, byWhite, currentBoard) {
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const piece = currentBoard[r][c];
            if (piece === '') continue;
            const isPieceWhite = piece === piece.toUpperCase();
            if (isPieceWhite === byWhite) {
                const moves = getValidMoves(piece, r, c, currentBoard, true);
                if (moves.some(([moveRow, moveCol]) => moveRow === row && moveCol === col)) {
                    return true;
                }
            }
        }
    }
    return false;
}

function getKingPosition(isWhite, currentBoard) {
    const king = isWhite ? 'K' : 'k';
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            if (currentBoard[r][c] === king) {
                return [r, c];
            }
        }
    }
    return null;
}

function isInCheck(isWhite, currentBoard) {
    const kingPos = getKingPosition(isWhite, currentBoard);
    if (!kingPos) return false;
    return isSquareAttacked(kingPos[0], kingPos[1], !isWhite, currentBoard);
}

function hasValidMoves(isWhite, currentBoard) {
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const piece = currentBoard[r][c];
            if (piece === '') continue;
            const isPieceWhite = piece === piece.toUpperCase();
            if (isPieceWhite === isWhite) {
                const moves = getValidMoves(piece, r, c, currentBoard);
                if (moves.length > 0) {
                    return true;
                }
            }
        }
    }
    return false;
}

function getValidMoves(piece, row, col, currentBoard, isCheckingAttack = false) {
    const moves = [];
    const isWhite = piece === piece.toUpperCase();

    function isOpponent(r, c) {
        const targetPiece = currentBoard[r][c];
        if (targetPiece === '') return false;
        return isWhite !== (targetPiece === targetPiece.toUpperCase());
    }

    if (piece.toLowerCase() === 'p') {
        const direction = isWhite ? -1 : 1;
        const startRow = isWhite ? 6 : 1;

        // Forward move
        if (!isCheckingAttack && row + direction >= 0 && row + direction < 8 && currentBoard[row + direction][col] === '') {
            moves.push([row + direction, col]);
            // Double move from start
            if (row === startRow && currentBoard[row + 2 * direction][col] === '') {
                moves.push([row + 2 * direction, col]);
            }
        }

        // Capture moves
        if (row + direction >= 0 && row + direction < 8 && col - 1 >= 0) {
            if (isCheckingAttack || (currentBoard[row + direction][col - 1] !== '' && isOpponent(row + direction, col - 1))) {
                moves.push([row + direction, col - 1]);
            }
        }
        if (row + direction >= 0 && row + direction < 8 && col + 1 < 8) {
            if (isCheckingAttack || (currentBoard[row + direction][col + 1] !== '' && isOpponent(row + direction, col + 1))) {
                moves.push([row + direction, col + 1]);
            }
        }
    } else if (piece.toLowerCase() === 'r') {
        const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        for (const [dr, dc] of directions) {
            for (let i = 1; i < 8; i++) {
                const r = row + i * dr;
                const c = col + i * dc;
                if (r < 0 || r >= 8 || c < 0 || c >= 8) break;
                if (currentBoard[r][c] === '') {
                    moves.push([r, c]);
                } else {
                    if (isOpponent(r, c)) {
                        moves.push([r, c]);
                    }
                    break;
                }
            }
        }
    } else if (piece.toLowerCase() === 'n') {
        const directions = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];
        for (const [dr, dc] of directions) {
            const r = row + dr;
            const c = col + dc;
            if (r >= 0 && r < 8 && c >= 0 && c < 8) {
                if (currentBoard[r][c] === '' || isOpponent(r, c)) {
                    moves.push([r, c]);
                }
            }
        }
    } else if (piece.toLowerCase() === 'b') {
        const directions = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
        for (const [dr, dc] of directions) {
            for (let i = 1; i < 8; i++) {
                const r = row + i * dr;
                const c = col + i * dc;
                if (r < 0 || r >= 8 || c < 0 || c >= 8) break;
                if (currentBoard[r][c] === '') {
                    moves.push([r, c]);
                } else {
                    if (isOpponent(r, c)) {
                        moves.push([r, c]);
                    }
                    break;
                }
            }
        }
    } else if (piece.toLowerCase() === 'q') {
        const directions = [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [-1, 1], [1, -1], [1, 1]];
        for (const [dr, dc] of directions) {
            for (let i = 1; i < 8; i++) {
                const r = row + i * dr;
                const c = col + i * dc;
                if (r < 0 || r >= 8 || c < 0 || c >= 8) break;
                if (currentBoard[r][c] === '') {
                    moves.push([r, c]);
                } else {
                    if (isOpponent(r, c)) {
                        moves.push([r, c]);
                    }
                    break;
                }
            }
        }
    } else if (piece.toLowerCase() === 'k') {
        const directions = [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [-1, 1], [1, -1], [1, 1]];
        for (const [dr, dc] of directions) {
            const r = row + dr;
            const c = col + dc;
            if (r >= 0 && r < 8 && c >= 0 && c < 8) {
                if (currentBoard[r][c] === '' || isOpponent(r, c)) {
                    moves.push([r, c]);
                }
            }
        }
        // Castling
        if (!isCheckingAttack) {
            const canCastle = isWhite ? !hasMoved.white.K : !hasMoved.black.k;
            if (canCastle && !isSquareAttacked(row, col, !isWhite, currentBoard)) {
                // Kingside
                if (currentBoard[row][col + 1] === '' && currentBoard[row][col + 2] === '' && (isWhite ? !hasMoved.white.R2 : !hasMoved.black.r2)) {
                    if (!isSquareAttacked(row, col + 1, !isWhite, currentBoard) && !isSquareAttacked(row, col + 2, !isWhite, currentBoard)) {
                        moves.push([row, col + 2]);
                    }
                }
                // Queenside
                if (currentBoard[row][col - 1] === '' && currentBoard[row][col - 2] === '' && currentBoard[row][col - 3] === '' && (isWhite ? !hasMoved.white.R1 : !hasMoved.black.r1)) {
                    if (!isSquareAttacked(row, col - 1, !isWhite, currentBoard) && !isSquareAttacked(row, col - 2, !isWhite, currentBoard)) {
                        moves.push([row, col - 2]);
                    }
                }
            }
        }
    }

    if (isCheckingAttack) {
        return moves;
    }

    return moves.filter(move => {
        const [r, c] = move;
        const tempBoard = JSON.parse(JSON.stringify(currentBoard));
        tempBoard[r][c] = piece;
        tempBoard[row][col] = '';
        return !isInCheck(isWhite, tempBoard);
    });
}

function highlightValidMoves() {
    const squares = document.querySelectorAll('.square');
    squares.forEach(square => square.classList.remove('valid-move'));
    validMoves.forEach(([row, col]) => {
        const square = document.querySelector(`[data-row='${row}'][data-col='${col}']`);
        square.classList.add('valid-move');
    });
}

function handleSquareClick(e) {
    if (gameOver) return;

    const square = e.target.closest('.square');
    if (!square) return;

    const row = parseInt(square.dataset.row);
    const col = parseInt(square.dataset.col);
    const piece = boardState[row][col];

    if (selectedSquare) {
        const selectedRow = parseInt(selectedSquare.dataset.row);
        const selectedCol = parseInt(selectedSquare.dataset.col);

        if (selectedRow === row && selectedCol === col) {
            selectedSquare.classList.remove('selected');
            selectedSquare = null;
            validMoves = [];
            highlightValidMoves();
            return;
        }

        const isAValidMove = validMoves.some(([validRow, validCol]) => validRow === row && validCol === col);

        if (isAValidMove) {
            const movedPiece = boardState[selectedRow][selectedCol];
            const isWhite = movedPiece === movedPiece.toUpperCase();

            boardState[row][col] = movedPiece;
            boardState[selectedRow][selectedCol] = '';

            // Handle castling rook move
            if (movedPiece.toLowerCase() === 'k' && Math.abs(selectedCol - col) === 2) {
                if (col > selectedCol) { // Kingside
                    const rook = boardState[row][7];
                    boardState[row][5] = rook;
                    boardState[row][7] = '';
                } else { // Queenside
                    const rook = boardState[row][0];
                    boardState[row][3] = rook;
                    boardState[row][0] = '';
                }
            }

            if (movedPiece.toLowerCase() === 'k') {
                if (isWhite) {
                    hasMoved.white.K = true;
                } else {
                    hasMoved.black.k = true;
                }
            } else if (movedPiece.toLowerCase() === 'r') {
                if (isWhite) {
                    if (selectedRow === 7 && selectedCol === 0) hasMoved.white.R1 = true;
                    if (selectedRow === 7 && selectedCol === 7) hasMoved.white.R2 = true;
                } else {
                    if (selectedRow === 0 && selectedCol === 0) hasMoved.black.r1 = true;
                    if (selectedRow === 0 && selectedCol === 7) hasMoved.black.r2 = true;
                }
            }

            turn = turn === 'white' ? 'black' : 'white';
            turnDisplay.textContent = `${turn.charAt(0).toUpperCase() + turn.slice(1)}'s Turn`;

            selectedSquare.classList.remove('selected');
            selectedSquare = null;
            validMoves = [];
            highlightValidMoves();
            renderPieces();

            const opponentIsWhite = turn === 'white';
            if (!hasValidMoves(opponentIsWhite, boardState)) {
                if (isInCheck(opponentIsWhite, boardState)) {
                    gameOverDisplay.textContent = `Checkmate! ${isWhite ? 'White' : 'Black'} wins.`;
                } else {
                    gameOverDisplay.textContent = 'Stalemate!';
                }
                gameOverDisplay.classList.remove('hidden');
                gameOver = true;
            }
        }
    } else {
        if (piece) {
            const isWhitePiece = piece === piece.toUpperCase();
            if ((isWhitePiece && turn === 'white') || (!isWhitePiece && turn === 'black')) {
                square.classList.add('selected');
                selectedSquare = square;
                validMoves = getValidMoves(piece, row, col, boardState);
                highlightValidMoves();
            }
        }
    }
}

function resetGame() {
    boardState = JSON.parse(JSON.stringify(initialBoard));
    turn = 'white';
    turnDisplay.textContent = "White's Turn";
    selectedSquare = null;
    validMoves = [];
    hasMoved = {
        'white': {
            'K': false,
            'R1': false,
            'R2': false,
        },
        'black': {
            'k': false,
            'r1': false,
            'r2': false,
        }
    };
    gameOver = false;
    gameOverDisplay.classList.add('hidden');
    highlightValidMoves();
    renderPieces();
}

createBoard();
renderPieces();

board.addEventListener('click', handleSquareClick);
newGameButton.addEventListener('click', resetGame);
