const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path"); 
const helmet = require("helmet"); 

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const frontendFilesPath = path.join(__dirname, "..", "frontend"); 

const finalScores = {};

app.use(express.static(frontendFilesPath));
app.use(helmet()); 

app.get("/", (req, res, next) => {
  res.sendFile(path.join(frontendFilesPath, "index.html")); 
});

app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"], 
      styleSrc: ["'self'", "https://fonts.googleapis.com"], // Allow Google Fonts
      fontSrc: ["'self'", "https://fonts.gstatic.com"], 
      scriptSrc: [
        "'self'",
        "https://cdn.socket.io", // Allow scripts from the Socket.io CDN
        "https://cdnjs.cloudflare.com", 
      ],
      scriptSrcElem: [
        "'self'",
        "https://cdn.socket.io", // Allow scripts in elements like the socket.io min.js
        "https://cdnjs.cloudflare.com", 
      ],
      imgSrc: ["'self'", "data:"], // Allow images like favicon.ico and base64-encoded images
      connectSrc: ["'self'", "https://cdn.socket.io"], 
    },
  })
);

const roomStatus = {}; 

io.on("connection", (socket) => {
  console.log("A user has connected"); 

  socket.on("joinRoom", (roomCode) => {
    const currRoom = io.sockets.adapter.rooms.get(roomCode); 
    const currClients = currRoom ? currRoom.size : 0;
  
    if (currClients >= 2) {
      socket.emit("roomFull");
      return;
    }
  
    socket.join(roomCode);
    console.log(`User joined room ${roomCode} (${currClients + 1}/2)`);
  
    if (currClients + 1 === 1) {
      socket.emit("waitingForPlayer");
    } else if (currClients + 1 === 2) {

      // assign player numbers to those who are in the room
      // player1 is automatically the person who generated the code

      const clients = Array.from(io.sockets.adapter.rooms.get(roomCode));
      if (clients.length === 2) {
        io.to(clients[0]).emit("startGame", { player: "player1", roomCode });
        io.to(clients[1]).emit("startGame", { player: "player2", roomCode });
      }
    }

  });

  socket.on("playerReady", ({ player, roomCode }) => {
    if (!roomCode) return;
  

    if (!roomStatus[roomCode]) {
      roomStatus[roomCode] = {
        player1: false, 
        player2: false
      };
    }

    roomStatus[roomCode][player] = true; 

    if (roomStatus[roomCode].player1 && roomStatus[roomCode].player2) {
      io.to(roomCode).emit("bothPlayersReady"); 
      console.log("Received bothPlayersReady");
    }
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected"); 
  });

  socket.on("gameUpdate", ({ roomCode, player, board, score, lines, level }) => {
    socket.to(roomCode).emit("opponentUpdate", {
      player,
      board,
      score,
      lines,
      level
    });

  });

  socket.on("playerDone", ({ player, roomCode, score }) => {
    if (!finalScores[roomCode]) {
      finalScores[roomCode] = {};
    }
  
    finalScores[roomCode][player] = score;
  
    const final = finalScores[roomCode];
  
    if (final.player1 !== undefined && final.player2 !== undefined) {
      let winner;
  
      if (final.player1 > final.player2) {
        winner = "player1";
      } else if (final.player2 > final.player1) {
        winner = "player2";
      } else {
        winner = "tie";
      }
  
      io.to(roomCode).emit("gameOverResult", { winner, scores: final });
  
      // Optional: clean up
      delete finalScores[roomCode];
      delete roomStatus[roomCode];
    }
  });
  
  
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

