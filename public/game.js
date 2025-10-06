class MemoramaGame {
    constructor() {
        this.socket = null;
        this.playerName = '';
        this.selectedCategory = '';
        this.gameState = null;
        this.gameTimer = null;
        this.startTime = null;
        this.isMyTurn = false;
        this.flippedCards = [];
        
        this.initializeElements();
        this.setupEventListeners();
        this.connectToServer();
        this.initializeEmojiSupport();
    }

    initializeElements() {
        // Pantallas
        this.screens = {
            welcome: document.getElementById('welcome-screen'),
            waiting: document.getElementById('waiting-screen'),
            matchFound: document.getElementById('match-found-screen'),
            categorySelection: document.getElementById('category-selection-screen'),
            categoryResult: document.getElementById('category-result-screen'),
            game: document.getElementById('game-screen'),
            result: document.getElementById('result-screen')
        };

        // Elementos de bienvenida
        this.playerNameInput = document.getElementById('player-name');
        this.searchGameBtn = document.getElementById('search-game-btn');
        this.cancelSearchBtn = document.getElementById('cancel-search-btn');

        // Elementos de match encontrado
        this.player1MatchName = document.getElementById('player1-match-name');
        this.player2MatchName = document.getElementById('player2-match-name');

        // Elementos de selección de categoría
        this.categoryCards = document.querySelectorAll('.category-card');
        this.mySelectionStatus = document.getElementById('my-selection-status');
        this.opponentSelectionStatus = document.getElementById('opponent-selection-status');

        // Elementos de resultado de categoría
        this.finalCategoryEmoji = document.getElementById('final-category-emoji');
        this.finalCategoryName = document.getElementById('final-category-name');
        this.myCategoryChoice = document.getElementById('my-category-choice');
        this.opponentCategoryChoice = document.getElementById('opponent-category-choice');
        this.randomResult = document.getElementById('random-result');
        this.gameCountdown = document.getElementById('game-countdown');

        // Elementos del juego
        this.gameBoard = document.getElementById('game-board');
        this.currentCategorySpan = document.getElementById('current-category');
        this.gameTimerSpan = document.getElementById('game-timer');
        
        // Información de jugadores
        this.player1Name = document.getElementById('player1-name');
        this.player1Score = document.getElementById('player1-score');
        this.player1Info = document.getElementById('player1-info');
        this.player1Turn = document.getElementById('player1-turn');
        
        this.player2Name = document.getElementById('player2-name');
        this.player2Score = document.getElementById('player2-score');
        this.player2Info = document.getElementById('player2-info');
        this.player2Turn = document.getElementById('player2-turn');
        
        // Indicadores de turno
        this.currentTurnIndicator = document.getElementById('current-turn-indicator');
        this.currentTurnText = document.getElementById('current-turn-text');
        
        // Resultado
        this.resultTitle = document.getElementById('result-title');
        this.resultTrophy = document.getElementById('result-trophy');
        this.resultPlayer1Name = document.getElementById('result-player1-name');
        this.resultPlayer1Score = document.getElementById('result-player1-score');
        this.resultPlayer2Name = document.getElementById('result-player2-name');
        this.resultPlayer2Score = document.getElementById('result-player2-score');
        this.resultMessage = document.getElementById('result-message');
        
        // Botones de resultado
        this.playAgainBtn = document.getElementById('play-again-btn');
        this.newGameBtn = document.getElementById('new-game-btn');
        
        // Modal de jugar de nuevo
        this.playAgainModal = document.getElementById('play-again-modal');
        this.playAgainMessage = document.getElementById('play-again-message');
        this.acceptPlayAgainBtn = document.getElementById('accept-play-again');
        this.declinePlayAgainBtn = document.getElementById('decline-play-again');
        
        // Notificaciones
        this.notificationsContainer = document.getElementById('notifications');
    }

    initializeEmojiSupport() {
        // Inicializar Twemoji para asegurar compatibilidad de emojis
        if (typeof twemoji !== 'undefined') {
            twemoji.parse(document.body, {
                folder: 'svg',
                ext: '.svg',
                size: 'svg',
                callback: function(icon, options, variant) {
                    // Asegurar que las banderas se rendericen correctamente
                    if (icon.indexOf('1f1') !== -1) {
                        return 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/' + icon + '.svg';
                    }
                    return false;
                }
            });
        }
    }

    setupEventListeners() {
        // Input de nombre de jugador
        this.playerNameInput.addEventListener('input', () => {
            this.validateForm();
        });

        // Selección de categoría (en pantalla de selección)
        this.categoryCards.forEach(card => {
            card.addEventListener('click', () => {
                this.selectCategory(card);
            });
        });

        // Botón buscar partida
        this.searchGameBtn.addEventListener('click', () => {
            this.searchGame();
        });

        // Botón cancelar búsqueda
        this.cancelSearchBtn.addEventListener('click', () => {
            this.cancelSearch();
        });

        // Botones de resultado
        this.playAgainBtn.addEventListener('click', () => {
            this.requestPlayAgain();
        });

        this.newGameBtn.addEventListener('click', () => {
            this.goToWelcomeScreen();
        });

        // Modal de jugar de nuevo
        this.acceptPlayAgainBtn.addEventListener('click', () => {
            this.acceptPlayAgain();
        });

        this.declinePlayAgainBtn.addEventListener('click', () => {
            this.declinePlayAgain();
        });

        // Cerrar modal al hacer clic fuera
        this.playAgainModal.addEventListener('click', (e) => {
            if (e.target === this.playAgainModal) {
                this.closePlayAgainModal();
            }
        });
    }

    connectToServer() {
        this.socket = io();

        // Eventos del servidor
        this.socket.on('waiting-for-match', () => {
            this.showScreen('waiting');
        });

        this.socket.on('match-found', (data) => {
            this.showMatchFound(data);
        });

        this.socket.on('opponent-selected-category', (data) => {
            this.handleOpponentSelectedCategory(data);
        });

        this.socket.on('category-selected', (data) => {
            this.showCategoryResult(data);
        });

        this.socket.on('game-start', (data) => {
            this.startGame(data);
        });

        this.socket.on('card-flipped', (data) => {
            this.handleCardFlipped(data);
        });

        this.socket.on('pair-found', (data) => {
            this.handlePairFound(data);
        });

        this.socket.on('cards-reset', () => {
            this.resetFlippedCards();
        });

        this.socket.on('turn-update', (data) => {
            this.updateTurn(data);
        });

        this.socket.on('game-end', (data) => {
            this.endGame(data);
        });

        this.socket.on('play-again-request', (data) => {
            this.showPlayAgainModal(data);
        });

        this.socket.on('opponent-disconnected', () => {
            this.showNotification('Tu oponente se desconectó', 'warning');
            setTimeout(() => {
                this.goToWelcomeScreen();
            }, 3000);
        });

        this.socket.on('error', (data) => {
            this.showNotification(data.message, 'error');
        });
    }

    validateForm() {
        const hasName = this.playerNameInput.value.trim().length > 0;
        
        this.searchGameBtn.disabled = !hasName;
    }

    selectCategory(card) {
        // Remover selección anterior
        this.categoryCards.forEach(c => c.classList.remove('selected'));
        
        // Seleccionar nueva categoría
        card.classList.add('selected');
        this.selectedCategory = card.dataset.category;
        
        // Enviar selección al servidor
        this.socket.emit('select-category', {
            category: this.selectedCategory
        });
        
        // Actualizar estado visual
        this.mySelectionStatus.classList.remove('waiting');
        this.mySelectionStatus.classList.add('selected');
    }

    searchGame() {
        this.playerName = this.playerNameInput.value.trim();
        
        if (!this.playerName) {
            this.showNotification('Por favor ingresa tu nombre', 'error');
            return;
        }

        this.socket.emit('search-game', {
            playerName: this.playerName
        });
    }

    cancelSearch() {
        this.socket.disconnect();
        this.connectToServer();
        this.showScreen('welcome');
    }

    showMatchFound(data) {
        // Determinar nombres de jugadores
        const isPlayer1 = data.player1Name === this.playerName;
        
        this.player1MatchName.textContent = isPlayer1 ? this.playerName : data.player1Name;
        this.player2MatchName.textContent = isPlayer1 ? data.player2Name : this.playerName;
        
        this.showScreen('matchFound');
        
        // Transición a selección de categoría
        setTimeout(() => {
            this.showScreen('categorySelection');
        }, 2000);
    }

    handleOpponentSelectedCategory(data) {
        this.opponentSelectionStatus.classList.remove('waiting');
        this.opponentSelectionStatus.classList.add('selected');
    }

    showCategoryResult(data) {
        // Configurar resultado de categoría
        this.finalCategoryEmoji.textContent = this.getCategoryEmoji(data.finalCategory);
        this.finalCategoryName.textContent = this.getCategoryName(data.finalCategory);
        
        // Mostrar selecciones
        this.myCategoryChoice.textContent = this.getCategoryName(data.player1Category);
        this.opponentCategoryChoice.textContent = this.getCategoryName(data.player2Category);
        
        // Mostrar si fue sorteo
        if (data.isRandom) {
            this.randomResult.style.display = 'flex';
        } else {
            this.randomResult.style.display = 'none';
        }
        
        this.showScreen('categoryResult');
        
        // Iniciar countdown
        let countdown = 4;
        this.gameCountdown.textContent = countdown;
        
        const countdownInterval = setInterval(() => {
            countdown--;
            this.gameCountdown.textContent = countdown;
            
            if (countdown <= 0) {
                clearInterval(countdownInterval);
            }
        }, 1000);
    }

    startGame(data) {
        this.gameState = data;
        this.showScreen('game');
        
        // Crear tablero de juego
        this.createGameBoard(data.cards);
        
        // Configurar jugadores
        this.setupPlayers();
        
        // Iniciar temporizador
        this.startGameTimer();
        
        // Juego iniciado sin notificación
    }

    createGameBoard(cards) {
        this.gameBoard.innerHTML = '';
        
        cards.forEach((emoji, index) => {
            const card = document.createElement('div');
            card.className = 'memory-card';
            card.dataset.index = index;
            card.dataset.emoji = emoji;
            card.innerHTML = '<i class="fas fa-question"></i>';
            
            card.addEventListener('click', () => {
                this.flipCard(index);
            });
            
            this.gameBoard.appendChild(card);
        });
        
        // Procesar emojis con Twemoji después de crear el tablero
        if (typeof twemoji !== 'undefined') {
            twemoji.parse(this.gameBoard, {
                folder: 'svg',
                ext: '.svg',
                size: 'svg'
            });
        }
    }

    setupPlayers() {
        // Configurar información de jugadores
        const isPlayer1 = this.socket.id === this.gameState.currentPlayer.id;
        
        this.player1Name.textContent = isPlayer1 ? this.playerName : this.gameState.currentPlayer.name;
        this.player2Name.textContent = isPlayer1 ? this.gameState.currentPlayer.name : this.playerName;
        
        // Actualizar turno
        this.updateTurn(this.gameState);
    }

    flipCard(cardIndex) {
        if (!this.isMyTurn) {
            return;
        }

        const card = document.querySelector(`[data-index="${cardIndex}"]`);
        if (card.classList.contains('flipped') || card.classList.contains('matched')) {
            return;
        }

        // Verificar que no se hayan volteado más de 2 cartas en este turno
        if (this.flippedCards.length >= 2) {
            return;
        }

        this.socket.emit('flip-card', { cardIndex: parseInt(cardIndex) });
    }

    handleCardFlipped(data) {
        const card = document.querySelector(`[data-index="${data.cardIndex}"]`);
        
        // Agregar a cartas volteadas
        this.flippedCards.push(data.cardIndex);
        
        // Paso 1: Girar la carta sin revelar
        card.classList.add('flipped');
        
        // Paso 2: Después de la animación, revelar el emoji
        setTimeout(() => {
            card.innerHTML = data.emoji;
            
            // Procesar emoji con Twemoji si está disponible
            if (typeof twemoji !== 'undefined') {
                twemoji.parse(card, {
                    folder: 'svg',
                    ext: '.svg',
                    size: 'svg'
                });
            }
        }, 150); // Mitad de la duración de la animación CSS
        
        // Deshabilitar otras cartas si ya se voltearon 2
        if (this.flippedCards.length >= 2 && this.isMyTurn) {
            this.disableRemainingCards();
        }
    }

    disableRemainingCards() {
        const allCards = document.querySelectorAll('.memory-card');
        allCards.forEach(card => {
            if (!card.classList.contains('flipped') && !card.classList.contains('matched')) {
                card.classList.add('disabled');
            }
        });
    }

    enableAllCards() {
        const allCards = document.querySelectorAll('.memory-card');
        allCards.forEach(card => {
            card.classList.remove('disabled');
        });
    }

    handlePairFound(data) {
        // Marcar cartas como encontradas
        data.cardIndices.forEach(index => {
            const card = document.querySelector(`[data-index="${index}"]`);
            card.classList.add('matched');
        });
        
        // Actualizar puntuación
        this.updateScore(data.playerName, data.score);
        
        // Limpiar cartas volteadas
        this.flippedCards = [];
        
        // Habilitar todas las cartas para el siguiente turno
        this.enableAllCards();
    }

    resetFlippedCards() {
        // Voltear cartas de vuelta
        this.flippedCards.forEach(index => {
            const card = document.querySelector(`[data-index="${index}"]`);
            if (!card.classList.contains('matched')) {
                card.classList.remove('flipped');
                card.innerHTML = '<i class="fas fa-question"></i>';
            }
        });
        
        this.flippedCards = [];
        
        // Habilitar todas las cartas para el siguiente turno
        this.enableAllCards();
    }

    updateTurn(data) {
        this.isMyTurn = data.currentPlayer.id === this.socket.id;
        
        // Habilitar todas las cartas para el nuevo turno
        this.enableAllCards();
        
        // Actualizar indicadores visuales
        if (this.isMyTurn) {
            this.currentTurnText.textContent = 'Tu turno';
            this.currentTurnIndicator.style.background = 'var(--gradient-primary)';
        } else {
            this.currentTurnText.textContent = `Turno de ${data.currentPlayer.name}`;
            this.currentTurnIndicator.style.background = 'var(--surface-light)';
        }
        
        // Actualizar información de jugadores
        const isPlayer1 = this.player1Name.textContent === this.playerName;
        const currentPlayerIsPlayer1 = data.currentPlayer.id === this.socket.id ? isPlayer1 : !isPlayer1;
        
        if (currentPlayerIsPlayer1) {
            this.player1Info.classList.add('current-player');
            this.player1Turn.style.opacity = '1';
            this.player2Info.classList.remove('current-player');
            this.player2Turn.style.opacity = '0';
        } else {
            this.player2Info.classList.add('current-player');
            this.player2Turn.style.opacity = '1';
            this.player1Info.classList.remove('current-player');
            this.player1Turn.style.opacity = '0';
        }
    }

    updateScore(playerName, score) {
        const isPlayer1 = this.player1Name.textContent === playerName;
        
        if (isPlayer1) {
            this.player1Score.textContent = score;
        } else {
            this.player2Score.textContent = score;
        }
    }

    startGameTimer() {
        this.startTime = Date.now();
        
        this.gameTimer = setInterval(() => {
            const elapsed = Date.now() - this.startTime;
            const minutes = Math.floor(elapsed / 60000);
            const seconds = Math.floor((elapsed % 60000) / 1000);
            
            this.gameTimerSpan.textContent = 
                `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }, 1000);
    }

    endGame(data) {
        clearInterval(this.gameTimer);
        
        // Determinar resultado
        const isPlayer1 = this.player1Name.textContent === this.playerName;
        const myScore = isPlayer1 ? parseInt(this.player1Score.textContent) : parseInt(this.player2Score.textContent);
        const opponentScore = isPlayer1 ? parseInt(this.player2Score.textContent) : parseInt(this.player1Score.textContent);
        
        // Configurar resultado
        this.resultPlayer1Name.textContent = this.player1Name.textContent;
        this.resultPlayer1Score.textContent = this.player1Score.textContent;
        this.resultPlayer2Name.textContent = this.player2Name.textContent;
        this.resultPlayer2Score.textContent = this.player2Score.textContent;
        
        if (data.winner) {
            if (data.winner.name === this.playerName) {
                this.resultTitle.textContent = '¡Ganaste!';
                this.resultMessage.textContent = '¡Felicitaciones por tu victoria!';
                this.resultTrophy.style.color = '#f59e0b'; // Oro
                // Sin notificación de victoria
            } else {
                this.resultTitle.textContent = '¡Perdiste!';
                this.resultMessage.textContent = `¡Bien jugado! ${data.winner.name} ganó esta vez.`;
                this.resultTrophy.style.color = '#6b7280'; // Gris
                // Sin notificación de derrota
            }
        } else {
            this.resultTitle.textContent = '¡Empate!';
            this.resultMessage.textContent = '¡Excelente juego! Ambos jugaron muy bien.';
            this.resultTrophy.style.color = '#10b981'; // Verde
            // Sin notificación de empate
        }
        
        this.showScreen('result');
    }

    requestPlayAgain() {
        this.socket.emit('play-again');
        // Sin notificación de solicitud
    }

    showPlayAgainModal(data) {
        this.playAgainMessage.textContent = `${data.playerName} quiere jugar de nuevo. ¿Aceptas?`;
        this.playAgainModal.classList.add('active');
    }

    acceptPlayAgain() {
        this.socket.emit('accept-play-again');
        this.closePlayAgainModal();
        // Sin notificación de jugar de nuevo
    }

    declinePlayAgain() {
        this.closePlayAgainModal();
        this.goToWelcomeScreen();
    }

    closePlayAgainModal() {
        this.playAgainModal.classList.remove('active');
    }

    goToWelcomeScreen() {
        this.socket.disconnect();
        this.connectToServer();
        this.showScreen('welcome');
        this.resetGame();
    }

    resetGame() {
        // Limpiar formulario
        this.playerNameInput.value = '';
        this.selectedCategory = '';
        this.categoryCards.forEach(c => c.classList.remove('selected'));
        this.searchGameBtn.disabled = true;
        
        // Resetear estado del juego
        this.gameState = null;
        this.isMyTurn = false;
        this.flippedCards = [];
        
        // Limpiar temporizador
        if (this.gameTimer) {
            clearInterval(this.gameTimer);
            this.gameTimer = null;
        }
        
        // Limpiar tablero
        this.gameBoard.innerHTML = '';
        
        // Resetear puntuaciones
        this.player1Score.textContent = '0';
        this.player2Score.textContent = '0';
        
        // Resetear indicadores de turno
        this.player1Info.classList.remove('current-player');
        this.player2Info.classList.remove('current-player');
        this.player1Turn.style.opacity = '0';
        this.player2Turn.style.opacity = '0';
        
        // Resetear estados de selección
        this.mySelectionStatus.classList.remove('selected');
        this.mySelectionStatus.classList.add('waiting');
        this.opponentSelectionStatus.classList.remove('selected');
        this.opponentSelectionStatus.classList.add('waiting');
        
        // Limpiar selección de categoría
        this.randomResult.style.display = 'none';
    }

    showScreen(screenName) {
        // Ocultar todas las pantallas
        Object.values(this.screens).forEach(screen => {
            screen.classList.remove('active');
        });
        
        // Mostrar pantalla seleccionada
        this.screens[screenName].classList.add('active');
    }

    getCategoryName(category) {
        const names = {
            'animales': 'Animales',
            'frutas': 'Frutas',
            'paises': 'Países',
            'transporte': 'Transporte'
        };
        return names[category] || category;
    }

    getCategoryEmoji(category) {
        const emojis = {
            'animales': '🐾',
            'frutas': '🍎',
            'paises': '🌍',
            'transporte': '🚗'
        };
        return emojis[category] || '🎯';
    }

    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        const icon = type === 'success' ? 'check-circle' : 
                    type === 'error' ? 'exclamation-circle' : 
                    type === 'warning' ? 'exclamation-triangle' : 'info-circle';
        
        notification.innerHTML = `
            <i class="fas fa-${icon}"></i>
            <span>${message}</span>
        `;
        
        this.notificationsContainer.appendChild(notification);
        
        // Remover notificación después de 5 segundos
        setTimeout(() => {
            notification.style.animation = 'slideIn 0.3s ease reverse';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 5000);
    }
}

// Inicializar el juego cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    new MemoramaGame();
});
