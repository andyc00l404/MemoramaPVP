const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Almacenar salas de espera y partidas activas
const waitingRooms = new Map(); // roomId -> [socket1, socket2]
const activeGames = new Map(); // roomId -> gameState
const playerSelections = new Map(); // roomId -> {player1: category, player2: category}

// Categorías disponibles
const categories = {
  'animales': ['🐶', '🐱', '🦁', '🐘', '🐼', '🐨', '🐸', '🦊', '🐰', '🐻', '🐯', '🐮'],
  'frutas': ['🍎', '🍊', '🍌', '🍇', '🍓', '🥝', '🍑', '🍒', '🥥', '🍍', '🍉', '🍋'],
  'paises': ['🇺🇸', '🇲🇽', '🇪🇸', '🇫🇷', '🇬🇧', '🇯🇵', '🇰🇷', '🇧🇷', '🇦🇷', '🇨🇦', '🇦🇺', '🇩🇪'],
  'transporte': ['🚗', '✈️', '🚂', '🚢', '🚁', '🏍️', '🚌', '🚑', '🚓', '🚚', '🚜', '🛴']
};

// Función para crear tablero de juego
function createGameBoard(category) {
  const emojis = categories[category];
  const pairs = emojis.slice(0, 8); // 8 pares = 16 cartas
  const cards = [...pairs, ...pairs]; // Duplicar para formar pares
  return shuffleArray(cards);
}

function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

io.on('connection', (socket) => {
  console.log('Usuario conectado:', socket.id);

  // Usuario busca partida
  socket.on('search-game', (data) => {
    const { playerName } = data;
    socket.playerName = playerName;
    
    // Buscar sala de espera disponible
    let availableRoom = null;
    for (const [roomId, players] of waitingRooms.entries()) {
      if (players.length === 1) {
        availableRoom = roomId;
        break;
      }
    }
    
    if (availableRoom) {
      // Unirse a sala existente
      const players = waitingRooms.get(availableRoom);
      players.push(socket);
      socket.join(availableRoom);
      
      const player1 = players[0];
      const player2 = players[1];
      
      // Inicializar selecciones
      playerSelections.set(availableRoom, { player1: null, player2: null });
      
      // Notificar match encontrado
      io.to(availableRoom).emit('match-found', {
        player1Name: player1.playerName,
        player2Name: player2.playerName
      });
      
      waitingRooms.delete(availableRoom);
    } else {
      // Crear nueva sala
      const roomId = `room_${Date.now()}_${socket.id}`;
      waitingRooms.set(roomId, [socket]);
      socket.join(roomId);
      
      socket.emit('waiting-for-match');
    }
  });

  // Usuario selecciona categoría
  socket.on('select-category', (data) => {
    const { category } = data;
    const roomId = Array.from(socket.rooms)[1];
    
    if (!roomId || !playerSelections.has(roomId)) return;
    
    const selections = playerSelections.get(roomId);
    const players = Array.from(io.sockets.adapter.rooms.get(roomId));
    
    // Determinar si es player1 o player2
    const isPlayer1 = players[0] === socket.id;
    if (isPlayer1) {
      selections.player1 = category;
    } else {
      selections.player2 = category;
    }
    
    // Notificar selección
    socket.to(roomId).emit('opponent-selected-category', { category });
    
    // Verificar si ambos han seleccionado
    if (selections.player1 && selections.player2) {
      let finalCategory;
      
      if (selections.player1 === selections.player2) {
        // Misma categoría
        finalCategory = selections.player1;
      } else {
        // Sorteo entre las dos categorías
        const categories = [selections.player1, selections.player2];
        finalCategory = categories[Math.floor(Math.random() * 2)];
      }
      
      // Crear juego
      setTimeout(() => {
        const gameState = {
          roomId,
          category: finalCategory,
          players: [
            { id: players[0], name: io.sockets.sockets.get(players[0]).playerName, score: 0, isTurn: true },
            { id: players[1], name: io.sockets.sockets.get(players[1]).playerName, score: 0, isTurn: false }
          ],
          cards: createGameBoard(finalCategory),
          flippedCards: [],
          currentPlayer: 0,
          gameStarted: false,
          selectedCategories: {
            player1: selections.player1,
            player2: selections.player2
          }
        };
        
        activeGames.set(roomId, gameState);
        playerSelections.delete(roomId);
        
        io.to(roomId).emit('category-selected', {
          finalCategory,
          player1Category: selections.player1,
          player2Category: selections.player2,
          isRandom: selections.player1 !== selections.player2
        });
        
        // Iniciar juego después de mostrar resultado
        setTimeout(() => {
          gameState.gameStarted = true;
          io.to(roomId).emit('game-start', {
            cards: gameState.cards,
            currentPlayer: gameState.players[gameState.currentPlayer],
            category: finalCategory
          });
        }, 4000);
      }, 2000);
    }
  });

  // Voltear carta
  socket.on('flip-card', (data) => {
    const { cardIndex } = data;
    const roomId = Array.from(socket.rooms)[1]; // La primera sala es el socket.id
    
    if (!roomId || !activeGames.has(roomId)) return;
    
    const game = activeGames.get(roomId);
    const playerIndex = game.players.findIndex(p => p.id === socket.id);
    
    // Verificar si es el turno del jugador
    if (playerIndex !== game.currentPlayer) {
      socket.emit('error', { message: 'No es tu turno' });
      return;
    }
    
    // Verificar si la carta ya está volteada
    if (game.flippedCards.some(card => card.index === cardIndex)) {
      socket.emit('error', { message: 'Esta carta ya está volteada' });
      return;
    }
    
    // Verificar que no se hayan volteado más de 2 cartas en este turno
    if (game.flippedCards.length >= 2) {
      socket.emit('error', { message: 'Ya has volteado 2 cartas este turno' });
      return;
    }
    
    // Agregar carta volteada
    game.flippedCards.push({
      index: cardIndex,
      emoji: game.cards[cardIndex],
      playerId: socket.id
    });
    
    // Notificar a todos en la sala
    io.to(roomId).emit('card-flipped', {
      cardIndex,
      emoji: game.cards[cardIndex],
      playerName: game.players[playerIndex].name
    });
    
    // Si se han volteado 2 cartas, verificar par
    if (game.flippedCards.length === 2) {
      const [card1, card2] = game.flippedCards;
      
      if (card1.emoji === card2.emoji) {
        // Par encontrado
        game.players[playerIndex].score++;
        game.flippedCards = [];
        
        io.to(roomId).emit('pair-found', {
          playerName: game.players[playerIndex].name,
          score: game.players[playerIndex].score,
          cardIndices: [card1.index, card2.index]
        });
        
        // Verificar si el juego terminó
        const totalPairs = game.cards.length / 2;
        const foundPairs = game.players.reduce((sum, player) => sum + player.score, 0);
        
        if (foundPairs >= totalPairs) {
          const winner = game.players[0].score > game.players[1].score ? game.players[0] : 
                        game.players[1].score > game.players[0].score ? game.players[1] : null;
          
          io.to(roomId).emit('game-end', {
            winner,
            scores: game.players.map(p => ({ name: p.name, score: p.score }))
          });
          
          activeGames.delete(roomId);
          return;
        }
        
        // El mismo jugador sigue (encontró par)
        io.to(roomId).emit('turn-update', {
          currentPlayer: game.players[game.currentPlayer]
        });
        
      } else {
        // No es par, cambiar turno
        setTimeout(() => {
          game.flippedCards = [];
          game.currentPlayer = game.currentPlayer === 0 ? 1 : 0;
          
          io.to(roomId).emit('cards-reset');
          io.to(roomId).emit('turn-update', {
            currentPlayer: game.players[game.currentPlayer]
          });
        }, 2000);
      }
    }
  });

  // Solicitar jugar de nuevo
  socket.on('play-again', () => {
    const roomId = Array.from(socket.rooms)[1];
    if (roomId && activeGames.has(roomId)) {
      socket.to(roomId).emit('play-again-request', {
        playerName: socket.playerName
      });
    }
  });

  // Aceptar jugar de nuevo
  socket.on('accept-play-again', () => {
    const roomId = Array.from(socket.rooms)[1];
    if (roomId && activeGames.has(roomId)) {
      const game = activeGames.get(roomId);
      const newGameState = {
        ...game,
        players: game.players.map(p => ({ ...p, score: 0 })),
        cards: createGameBoard(game.category),
        flippedCards: [],
        currentPlayer: 0,
        gameStarted: false
      };
      
      activeGames.set(roomId, newGameState);
      
      setTimeout(() => {
        newGameState.gameStarted = true;
        io.to(roomId).emit('game-start', {
          cards: newGameState.cards,
          currentPlayer: newGameState.players[newGameState.currentPlayer],
          category: newGameState.category
        });
      }, 2000);
    }
  });

  socket.on('disconnect', () => {
    console.log('Usuario desconectado:', socket.id);
    
    // Limpiar salas de espera
    waitingRooms.forEach((waitingList, roomId) => {
      const index = waitingList.findIndex(s => s.id === socket.id);
      if (index !== -1) {
        waitingList.splice(index, 1);
        if (waitingList.length === 0) {
          waitingRooms.delete(roomId);
        }
      }
    });
    
    // Limpiar selecciones de categorías
    playerSelections.forEach((selections, roomId) => {
      const players = Array.from(io.sockets.adapter.rooms.get(roomId));
      if (players && players.includes(socket.id)) {
        socket.to(roomId).emit('opponent-disconnected');
        playerSelections.delete(roomId);
      }
    });
    
    // Limpiar partidas activas
    activeGames.forEach((game, roomId) => {
      if (game.players.some(p => p.id === socket.id)) {
        socket.to(roomId).emit('opponent-disconnected');
        activeGames.delete(roomId);
      }
    });
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
