// Шахматные правила и движения фигур
class ChessRules {
    static getPossibleMoves(piece, fromRow, fromCol, board) {
        const moves = [];
        const pieceType = piece.type[1]; // K, Q, R, B, N, P
        const pieceColor = piece.type[0]; // w или b

        switch (pieceType) {
            case 'P': // Пешка
                return this.getPawnMoves(fromRow, fromCol, pieceColor, board);
            case 'N': // Конь
                return this.getKnightMoves(fromRow, fromCol, pieceColor, board);
            case 'B': // Слон
                return this.getBishopMoves(fromRow, fromCol, pieceColor, board);
            case 'R': // Ладья
                return this.getRookMoves(fromRow, fromCol, pieceColor, board);
            case 'Q': // Ферзь
                return this.getQueenMoves(fromRow, fromCol, pieceColor, board);
            case 'K': // Король
                return this.getKingMoves(fromRow, fromCol, pieceColor, board);
            default:
                return [];
        }
    }

    static getPawnMoves(row, col, color, board) {
        const moves = [];
        const direction = color === 'w' ? -1 : 1;
        const startRow = color === 'w' ? 6 : 1;

        // Ход вперед на 1 клетку
        if (this.isValidPosition(row + direction, col) && !this.getPieceAt(row + direction, col, board)) {
            moves.push({ row: row + direction, col: col });

            // Ход вперед на 2 клетки из начальной позиции
            if (row === startRow && !this.getPieceAt(row + 2 * direction, col, board)) {
                moves.push({ row: row + 2 * direction, col: col });
            }
        }

        // Взятие по диагонали
        for (let dcol of [-1, 1]) {
            const newRow = row + direction;
            const newCol = col + dcol;
            if (this.isValidPosition(newRow, newCol)) {
                const targetPiece = this.getPieceAt(newRow, newCol, board);
                if (targetPiece && targetPiece.type[0] !== color) {
                    moves.push({ row: newRow, col: newCol });
                }
            }
        }

        return moves;
    }

    static getKnightMoves(row, col, color, board) {
        const moves = [];
        const knightMoves = [
            [-2, -1], [-2, 1], [-1, -2], [-1, 2],
            [1, -2], [1, 2], [2, -1], [2, 1]
        ];

        for (let [dr, dc] of knightMoves) {
            const newRow = row + dr;
            const newCol = col + dc;
            if (this.isValidPosition(newRow, newCol)) {
                const targetPiece = this.getPieceAt(newRow, newCol, board);
                if (!targetPiece || targetPiece.type[0] !== color) {
                    moves.push({ row: newRow, col: newCol });
                }
            }
        }

        return moves;
    }

    static getBishopMoves(row, col, color, board) {
        return this.getLinearMoves(row, col, color, board, [
            [-1, -1], [-1, 1], [1, -1], [1, 1]
        ]);
    }

    static getRookMoves(row, col, color, board) {
        return this.getLinearMoves(row, col, color, board, [
            [-1, 0], [1, 0], [0, -1], [0, 1]
        ]);
    }

    static getQueenMoves(row, col, color, board) {
        return this.getLinearMoves(row, col, color, board, [
            [-1, -1], [-1, 1], [1, -1], [1, 1],
            [-1, 0], [1, 0], [0, -1], [0, 1]
        ]);
    }

    static getKingMoves(row, col, color, board) {
        const moves = [];
        for (let dr of [-1, 0, 1]) {
            for (let dc of [-1, 0, 1]) {
                if (dr === 0 && dc === 0) continue;
                const newRow = row + dr;
                const newCol = col + dc;
                if (this.isValidPosition(newRow, newCol)) {
                    const targetPiece = this.getPieceAt(newRow, newCol, board);
                    if (!targetPiece || targetPiece.type[0] !== color) {
                        moves.push({ row: newRow, col: newCol });
                    }
                }
            }
        }
        return moves;
    }

    static getLinearMoves(row, col, color, board, directions) {
        const moves = [];
        
        for (let [dr, dc] of directions) {
            let newRow = row + dr;
            let newCol = col + dc;
            
            while (this.isValidPosition(newRow, newCol)) {
                const targetPiece = this.getPieceAt(newRow, newCol, board);
                
                if (!targetPiece) {
                    moves.push({ row: newRow, col: newCol });
                } else {
                    if (targetPiece.type[0] !== color) {
                        moves.push({ row: newRow, col: newCol });
                    }
                    break;
                }
                
                newRow += dr;
                newCol += dc;
            }
        }
        
        return moves;
    }

    static isValidPosition(row, col) {
        return row >= 0 && row < 8 && col >= 0 && col < 8;
    }

    static getPieceAt(row, col, board) {
        return board.find(piece => piece.row === row && piece.col === col);
    }

    // Проверка, атакует ли фигура указанную позицию
    static isSquareAttacked(row, col, attackerColor, board) {
        for (let piece of board) {
            if (piece.type[0] === attackerColor) {
                const moves = this.getPossibleMoves(piece, piece.row, piece.col, board);
                if (moves.some(move => move.row === row && move.col === col)) {
                    return true;
                }
            }
        }
        return false;
    }

    // Получение всех возможных взаимодействий для фигуры
    static getPieceInteractions(piece, board) {
        const interactions = [];
        const moves = this.getPossibleMoves(piece, piece.row, piece.col, board);
        
        for (let move of moves) {
            const targetPiece = this.getPieceAt(move.row, move.col, board);
            if (targetPiece) {
                interactions.push({
                    type: 'attack',
                    attacker: piece,
                    target: targetPiece,
                    from: { row: piece.row, col: piece.col },
                    to: { row: move.row, col: move.col }
                });
            }
        }

        // Также проверяем, атакована ли фигура
        for (let otherPiece of board) {
            if (otherPiece !== piece && otherPiece.type[0] !== piece.type[0]) {
                const moves = this.getPossibleMoves(otherPiece, otherPiece.row, otherPiece.col, board);
                if (moves.some(move => move.row === piece.row && move.col === piece.col)) {
                    interactions.push({
                        type: 'attacked',
                        attacker: otherPiece,
                        target: piece,
                        from: { row: otherPiece.row, col: otherPiece.col },
                        to: { row: piece.row, col: piece.col }
                    });
                }
            }
        }

        return interactions;
    }
}