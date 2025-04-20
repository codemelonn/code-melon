
/* ----------------- Board ----------------- */ 
class Board {

    /*
        - takes 2 board contexts
        - creates an empty grid with getNewBoard() 
        - generates next piece and current piece 
    */
    constructor(context, nextContext, playerID) {
        this.context = context; 
        this.nextContext = nextContext; 
        this.grid = this.getNewBoard(); 
        this.playerID = playerID; 
        this.setNextPiece();
        this.setThisPiece();  
    }

    resetBoard() {
        this.grid = this.getNewBoard(); 
        this.setNextPiece(); 
        this.setThisPiece(); 
    }

    //creates 2d array (rows x columns) filled with 0
    getNewBoard() {
        return Array.from({length: ROWS}, () => Array(COLUMNS).fill(0)); 
    }

    /*
        - loops through this.grid to draw all existing frozen pieces
        - draws the active piece 
    */
    draw() {
        // Clear the canvas first
        const { width, height } = this.context.canvas;
        this.context.clearRect(0, 0, width, height);

        // Draw frozen grid
        this.grid.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value > 0) {
                    this.context.fillStyle = colors[value];      
                    this.context.fillRect(x, y, 1, 1); 
                }
            });
        });

        // Draw active piece
        this.piece.draw();
    }


    /*
        - uses moves[keyCode] to determine how the piece will move 
        - hard drop will make the piece fall instantly 
        - soft drop has controlled falling 
    */
    movePiece(keyCode) {
        const moveAction = moves[keyCode];

        if (moveAction) {
            let newPos = moveAction(this.piece); 

            if (keyCode === keys.space) {
                while(this.isValid(newPos)) {
                    this.piece.move(newPos); 
                    this.updateScore('hard_drop'); 
                    newPos = moveAction(this.piece); 
                }
            }
            
            if (this.isValid(newPos)) {
                this.piece.move(newPos); 

                if (keyCode === keys.down) {
                    this.updateScore('soft_drop');
                }
            }

        }

        if (shouldDrawAndEmit && spoofPlayer && spoofPlayer.board === this) {
            spoofPlayer.updateScore();       //  sync player stats
            this.draw();                     //  update visuals
            emitGameState();                 //  send to opponent
        }
    }

    /*
        falling function
        - moves the piece one row down 
        - if collision, freeze the piece & clearLines() 
        - if the piece is stuck at top, endGame() 
    */
    fall() { 
        const newPos = moves[keys.down](this.piece); 

        if (this.isValid(newPos)) {
            this.piece.move(newPos); 
        } else { 
            this.freeze(); 
            // debugging 
            console.log(this.grid); 
            this.clear(); 
            
            if (this.piece.y === 0) {
                return false; 
            }
            this.setThisPiece(); 
        }
        return true;
    }

    /*
        - landing pieces become part of the grid 
        - makes sure the piece stays within boundaries 
    */
    freeze() { 
        this.piece.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value > 0) {
                    // Calculate the grid coordinates based on piece's position
                    const gridX = this.piece.x + x;
                    const gridY = this.piece.y + y;
    
                    // Make sure the piece doesn't go out of bounds
                    if (gridX >= 0 && gridX < COLUMNS && gridY >= 0 && gridY < ROWS) {
                        this.grid[gridY][gridX] = value;
                    }
                }
            });
        });
    }
    
    /*
        - if a row is completely filled, remove it 
        - a new empty row is added to the top 
        - the scores and level progression are updated 
    */
    clear() { 
        let lines = 0
        this.grid.forEach((row, y) => {
            if (row.every((value) => value > 0)) {
                lines++; 
                this.grid.splice(y, 1); 
                this.grid.unshift(Array(COLUMNS).fill(0)); 
            }
        }); 

        if (lines > 0) {
            this.updateScore('clear', lines); 
        }
    }

/*  -------------------- Next Piece -------------------- */ 
/*
    - sets the next piece
    - shows it in a preview box 
    - smooth transitions ensured here 
*/
    setNextPiece() { 
        const {width, height} = this.nextContext.canvas; 
        this.nextPiece = new Piece(this.nextContext); 

        this.nextContext.clearRect(0, 0, width, height); 
        this.nextPiece.draw(); 
    }

    setThisPiece() { 
        this.piece = this.nextPiece; 
        this.piece.context = this.context; 

        this.piece.x = 3; 
        this.setNextPiece(); 
    }

    updateScore(action, lines = 0) {
        if (!this.score) this.score = 0;
        if (!this.lines) this.lines = 0;
        if (!this.level) this.level = 0;
    
        if (action === 'hard_drop') {
            this.score += points.hard_drop;
        } else if (action === 'soft_drop') {
            this.score += points.soft_drop;
        } else if (action === 'clear') {
            this.score += this.getClearPoints(lines);
            this.lines += lines;
    
            if (this.lines >= lines_per_level) {
                this.level++;
                this.lines -= lines_per_level;
            }
        }

        if (spoofPlayer && spoofPlayer.board === this) {
            spoofPlayer.updateScore();
        }

    }
    
    
    


    // score calculation 
    getClearPoints(lines) {
        const clearPoints = amountPoints[lines] ?? 0; 
        return (this.level + 1) * clearPoints; 
    }


/*  --------------------- ---------- --------------------- */ 

/* ------------------ Validity Indicators ---------------- */ 

    // checks if inside board 
    isInside(x, y) {
        return x >= -1 && x < COLUMNS && y < ROWS; 
    }

    // checks if pos is empty 
    isNotFilled(x, y) {
        return this.grid[y] && this.grid[y][x] === 0; 
    }

    // ensures no collision 
    isValid(piece) {
        return piece.shape.every((row, dy) => {
            return row.every((value, dx) => {
                const x = piece.x + dx; 
                const y = piece.y + dy; 
                return value === 0 || (this.isInside(x, y) && this.isNotFilled(x, y));
            });
        });
    }
/* --------------- ------------------ --------------- */

}

/*  ----------------- Return to Menu ----------------- */ 