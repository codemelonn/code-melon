// DOM file

/* 
    canvas:         the main game board
    nextCanvas:     next falling piece 
    context:        2d rendering 
    nextContext:    2d rendering 
*/ 

/* -------------------- SOCKET SETUP --------------------- */ 

const socket = io(); 

/* -------------------- SOCKET SETUP --------------------- */ 
let currentRoomCode = null;
/* -------------------- PLAYER SETUP --------------------- */ 
class Player {

    constructor(context, nextContext, playerID) {
        this.context = context; 
        this.nextContext = nextContext; 
        this.playerID = playerID; 

        // create board for player 
        this.board = new Board(context, nextContext, playerID); 

        this.score = 0; 
        this.lines = 0; 
        this.level = 0; 
        this.status = false; 
        this.time = { start: performance.now(), elapsed: 0, level: level[0] }; 
    }

    // reset player stats and board
    reset() {
        this.score = 0; 
        this.lines = 0; 
        this.level = 0; 
        this.status = false; 
        this.board.resetBoard(); 
        this.time.start = performance.now(); 
    }

    animate(now = 0) {
        this.time.elapsed = now - this.time.start;
    
        if (!this.status && this.time.elapsed > this.time.level) {
            this.time.start = now;
    
            if (!this.board.fall()) {
                this.status = true;
                this.endGame();
                return; // Stop animating if game over
            }
        }
        
        this.updateScore(); 
        emitGameState(); 
        this.board.draw();
    
        if (!this.status) {
            requestAnimationFrame(this.animate.bind(this));
        }
    }
    
    endGame() {
        this.context.font = '1px "Press Start 2P"'; 
        this.context.fillStyle = 'red';
        this.context.textAlign = 'center';
        this.context.fillText('GAME OVER', COLUMNS / 2, 10);

        // show the winner
        socket.emit("playerDone", {
            player: this.playerID, 
            roomCode: currentRoomCode, 
            score: this.score
        });
    }
        
    updateScore() {
        // Sync stats from the board
        this.score = this.board.score;
        this.lines = this.board.lines;
        this.level = this.board.level;
    
        // Update the UI
        updatePlayerScore(this.playerID);
    }
    
}

/* -------------------- ------------ --------------------- */ 


/* -------------------- PLAYER BOARDS -------------------- */ 

// Calculate size of canvas from columns & rows.
function setupCanvas(canvas, context) {
    canvas.width = COLUMNS * BLOCK_SIZE;
    canvas.height = ROWS * BLOCK_SIZE;
    context.scale(BLOCK_SIZE, BLOCK_SIZE);
}

// player 1 board
const canvas = document.getElementById('board');
const context = canvas.getContext('2d');
const nextCanvas = document.getElementById('next'); 
const nextContext = nextCanvas.getContext('2d'); 
setupCanvas(canvas, context);
setupCanvas(nextCanvas, nextContext);


// player 2 board 
const p2canvas = document.getElementById('p2board'); 
const p2context = p2canvas.getContext('2d'); 
const p2nextCanvas = document.getElementById('p2next'); 
const p2nextContext = p2nextCanvas.getContext('2d'); 
setupCanvas(p2canvas, p2context);
setupCanvas(p2nextCanvas, p2nextContext);

const player1 = new Player(context, nextContext, 'player1'); 
const player2 = new Player(p2context, p2nextContext, 'player2'); 

/* -------------------- ------------- -------------------- */ 

/* -------------------- NEW GAME SETUP -------------------- */ 

const generateCode = document.getElementById('generateCodeButton'); 
const joinGameButton = document.getElementById('joinGameButton'); 
const gameCodeInput = document.getElementById('gameCodeInput'); 
const readyButton = document.getElementById("readyButton"); 

// track ready state
let currentPlayer = null; 
let spoofPlayer = null; 

let readyState = {
    player1: false, 
    player2: false
};

joinGameButton.addEventListener("click", () => {
    console.log("join game button clicked"); 

    const givenCode = gameCodeInput.value.trim().toUpperCase(); 

    if (givenCode) {
        console.log("Joining the game with code: ", givenCode); 
        socket.emit("joinRoom", givenCode); 
    }
});

generateCode.addEventListener("click", () => {
    console.log("generate code button clicked"); 

    const roomCode = generateRandomCode(); 
    console.log(`Code Generated: ${roomCode}`); 
    socket.emit("joinRoom", roomCode); 

    document.getElementById("gameCodeDisplay").textContent = `${roomCode}`; 
}); 

readyButton.addEventListener("click", () => {
    socket.emit("playerReady", {
        player: currentPlayer,
        roomCode: currentRoomCode
    });
      
    readyButton.disabled = true; 
    readyButton.textContent = "Waiting for other player..."; 
});


/* -------------------- -------------- -------------------- */ 


socket.on("roomFull", () => {
    alert("Room is already full!");
    console.log("Room full: can't join.");
});

socket.on("bothPlayersReady", () => {
    let countdown = 3;
    const countdownText = document.createElement("h2");
    countdownText.id = "countdownText";
    countdownText.style = `
        position: fixed;
        top: 40%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: black;
        color: white;
        font-size: 32px;
        padding: 20px;
        z-index: 9999;
    `;

    document.body.appendChild(countdownText);
  
    const countdownInterval = setInterval(() => {
      countdownText.textContent = `Game starts in ${countdown}...`;
      countdown--;
  
      if (countdown < 0) {
        clearInterval(countdownInterval);
        countdownText.remove();
  
        spoofPlayer.reset(); 
        requestAnimationFrame(spoofPlayer.animate.bind(spoofPlayer)); 

      }
    }, 1000);
});


socket.on("startGame", ({ player, roomCode }) => {
    console.log(`You are ${player} in room ${roomCode}`);
    currentPlayer = player;
    currentRoomCode = roomCode; 

    // Hide waiting screen, show game screen
    document.getElementById("waitingScreen").style.display = "none";
    document.getElementById("gameScreen").style.display = "block";

    if (player === "player1") {
        spoofPlayer = new Player(context, nextContext, "player1");
        document.querySelector(".p2-right-side").style.opacity = 0.4;
    } else if (player === "player2") {
        spoofPlayer = new Player(p2context, p2nextContext, "player2");
        document.querySelector(".p1-right-side").style.opacity = 0.4;
    }
});

function emitGameState() {
    const boardState = spoofPlayer.board.grid; 
    const { score, lines, level } = spoofPlayer; 

    socket.emit("gameUpdate", {
        roomCode: currentRoomCode,
        player: currentPlayer, 
        board: boardState, 
        score, 
        lines,
        level
    }); 
}

socket.on("opponentUpdate", ({ player, board, score, lines, level }) => {
    // Determine which canvas to draw the opponent's board into
    const isOpponent = player !== currentPlayer;

    const targetCanvas = currentPlayer === "player1" ? p2canvas : canvas;
    const targetContext = currentPlayer === "player1" ? p2context : context;

    const blockSize = BLOCK_SIZE;
    targetContext.clearRect(0, 0, targetCanvas.width, targetCanvas.height);

    // Draw the opponent's grid
    board.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value > 0) {
                targetContext.fillStyle = colors[value];
                targetContext.fillRect(x, y, 1, 1);
            }
        });
    });

    // Update opponent’s UI stats
    const opponentID = currentPlayer === "player1" ? "player2" : "player1";
    document.getElementById(`${opponentID}-score`).textContent = score;
    document.getElementById(`${opponentID}-lines`).textContent = lines;
    document.getElementById(`${opponentID}-level`).textContent = level;
});

socket.on("gameOverResult", ({ winner, scores }) => {
    const msg = 
      winner === "tie"
        ? "🤝 It's a tie!"
        : winner === currentPlayer
        ? "🏆 You win!"
        : "😓 You lose!";
  
    const winnerBanner = document.createElement("div");
    winnerBanner.style = `
      position: fixed;
      top: 40%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: black;
      color: white;
      font-size: 32px;
      padding: 20px;
      z-index: 9999;
      border: 4px solid white;
    `;
    winnerBanner.textContent = msg;
  
    document.body.appendChild(winnerBanner);
});
  
  

/* -------------------- ------------- -------------------- */ 


let scoreValues = {
    score: 0, 
    lines: 0, 
    level: 0,
};

/*
    finds html element with matching id (score, lines, level)
    then, updates the values on the screen 
*/
function updateScore(key, value) {
    const element = document.getElementById(key); 
    if (element) {
        element.textContent = value; 
    }
}

/*
    proxy: 
    automatically updates UI when [] changes 
    no need to manually call updateScore() 
*/
let scoreStatus = new Proxy(scoreValues, { 
    set: (target, key, value) => {
        target[key] = value; 
        updateScore(key, value); 
        return true;
    },
});

// event handler to move pieces for each player 
function handleKeyEvent(event) {
    // do this so that we can accept users typing into the code area 
    const activeElement = document.activeElement;
    const isTyping = activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA');

    if (isTyping) return;

    event.preventDefault(); 

    if (spoofPlayer) {
        spoofPlayer.board.movePiece(event.keyCode, true);
    }
}

// ensure one listener is active 
document.addEventListener('keydown', (event) => {
    const activeElement = document.activeElement; 
    const isTyping = activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA'); 

    if (!isTyping) {
        handleKeyEvent(event); 
    }
}); 


/*
    clears the board to make sure that there are no ghosts
    then calls draw() to redraw with the updated piece 
*/
function draw() { 
    const {width, height} = canvas;
    context.clearRect(0, 0, width, height); 
    player1.board.draw();

    const p2width = p2canvas.width; 
    const p2height = p2canvas.height; 
    p2context.clearRect(0,0, p2width, p2height); 
    player2.p2board.draw(); 
}

function updatePlayerScore(playerID) {
    if (!spoofPlayer || spoofPlayer.playerID !== playerID) return;

    document.getElementById(`${playerID}-score`).textContent = spoofPlayer.score;
    document.getElementById(`${playerID}-lines`).textContent = spoofPlayer.lines;
    document.getElementById(`${playerID}-level`).textContent = spoofPlayer.level;
}


function generateRandomCode(length = 6) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < length; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

function play() {
    player1.reset();
    requestAnimationFrame(player1.animate.bind(player1));
    console.log("Starting animation for player 1"); 
}

  