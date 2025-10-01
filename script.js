// Variáveis globais
let socket = null;
let currentPlayer = null;
let gameActive = false;
let playerSymbol = null;
let isMyTurn = false;

// Inicialização quando a página carrega
document.addEventListener('DOMContentLoaded', function() {
    initializeGameBoard();
    connectToServer();
});

// Conectar ao servidor WebSocket
function connectToServer() {
    // Em um ambiente real, substitua pela URL do seu servidor WebSocket
    const wsUrl = 'ws://localhost:8080';
    
    try {
        socket = new WebSocket(wsUrl);
        
        socket.onopen = function() {
            console.log('Conectado ao servidor');
            document.getElementById('connectionStatus').textContent = 'Conectado ao servidor';
            document.getElementById('connectionStatus').className = 'connection-status connected';
        };
        
        socket.onmessage = function(event) {
            const message = JSON.parse(event.data);
            handleServerMessage(message);
        };
        
        socket.onclose = function() {
            console.log('Conexão fechada');
            document.getElementById('connectionStatus').textContent = 'Desconectado do servidor';
            document.getElementById('connectionStatus').className = 'connection-status disconnected';
            
            // Tentar reconectar após 5 segundos
            setTimeout(connectToServer, 5000);
        };
        
        socket.onerror = function(error) {
            console.error('Erro na conexão WebSocket:', error);
            document.getElementById('connectionStatus').textContent = 'Erro na conexão';
            document.getElementById('connectionStatus').className = 'connection-status disconnected';
        };
    } catch (error) {
        console.error('Erro ao conectar:', error);
        // Em caso de erro, simular um servidor local
        simulateServer();
    }
}

// Simulação de servidor para demonstração
function simulateServer() {
    console.log('Usando servidor simulado (demonstração)');
    document.getElementById('connectionStatus').textContent = 'Modo de demonstração (servidor simulado)';
    document.getElementById('connectionStatus').className = 'connection-status connected';
    
    // Simular recebimento de mensagens do servidor
    setTimeout(() => {
        const message = { type: 'players_online', count: 1 };
        handleServerMessage(message);
    }, 1000);
}

// Inicializar o tabuleiro do jogo
function initializeGameBoard() {
    const gameBoard = document.getElementById('gameBoard');
    gameBoard.innerHTML = '';
    
    for (let i = 0; i < 9; i++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.dataset.index = i;
        cell.addEventListener('click', () => makeMove(i));
        gameBoard.appendChild(cell);
    }
}

// Processar mensagens do servidor
function handleServerMessage(message) {
    console.log('Mensagem recebida:', message);
    
    switch (message.type) {
        case 'players_online':
            document.getElementById('playerList').textContent = `Jogadores online: ${message.count}`;
            break;
            
        case 'game_joined':
            currentPlayer = message.player_id;
            playerSymbol = message.symbol;
            document.getElementById('gameStatus').textContent = 
                `Você é o jogador ${playerSymbol}. Aguardando oponente...`;
            document.getElementById('joinButton').disabled = true;
            break;
            
        case 'game_start':
            gameActive = true;
            const playerXName = message.players.X || 'Jogador X';
            const playerOName = message.players.O || 'Jogador O';
            
            document.getElementById('playerXName').textContent = playerXName;
            document.getElementById('playerOName').textContent = playerOName;
            
            if (playerSymbol === 'X') {
                isMyTurn = true;
                document.getElementById('playerX').classList.add('active');
                document.getElementById('gameStatus').textContent = 'Sua vez!';
            } else {
                isMyTurn = false;
                document.getElementById('playerO').classList.add('active');
                document.getElementById('gameStatus').textContent = 'Vez do jogador X';
            }
            break;
            
        case 'move_made':
            updateBoard(message.board);
            isMyTurn = message.current_turn === playerSymbol;
            updateTurnIndicator(message.current_turn);
            break;
            
        case 'game_over':
            gameActive = false;
            isMyTurn = false;
            
            if (message.winner) {
                if (message.winner === playerSymbol) {
                    document.getElementById('gameStatus').textContent = 'Você venceu! Parabéns!';
                } else {
                    document.getElementById('gameStatus').textContent = `Jogador ${message.winner} venceu!`;
                }
                highlightWinningCells(message.winning_cells);
            } else {
                document.getElementById('gameStatus').textContent = 'Empate!';
            }
            
            document.getElementById('resetButton').disabled = false;
            break;
            
        case 'error':
            alert(`Erro: ${message.message}`);
            break;
    }
}

// Entrar no jogo
function joinGame() {
    if (socket && socket.readyState === WebSocket.OPEN) {
        const message = {
            type: 'join_game',
            player_name: `Jogador${Math.floor(Math.random() * 1000)}`
        };
        socket.send(JSON.stringify(message));
    } else {
        // Simular entrada no jogo em modo de demonstração
        const message = {
            type: 'game_joined',
            player_id: 'demo_player',
            symbol: 'X'
        };
        handleServerMessage(message);
        
        // Simular início do jogo após 2 segundos
        setTimeout(() => {
            const startMessage = {
                type: 'game_start',
                players: {
                    X: 'Você (Demo)',
                    O: 'Oponente (Demo)'
                }
            };
            handleServerMessage(startMessage);
        }, 2000);
    }
}

// Fazer uma jogada
function makeMove(cellIndex) {
    if (!gameActive || !isMyTurn) return;
    
    const cells = document.querySelectorAll('.cell');
    if (cells[cellIndex].textContent !== '') return;
    
    if (socket && socket.readyState === WebSocket.OPEN) {
        const message = {
            type: 'make_move',
            cell: cellIndex
        };
        socket.send(JSON.stringify(message));
    } else {
        // Simular jogada em modo de demonstração
        const demoBoard = ['', '', '', '', '', '', '', '', ''];
        demoBoard[cellIndex] = playerSymbol;
        
        // Alternar turno
        const nextTurn = playerSymbol === 'X' ? 'O' : 'X';
        
        const moveMessage = {
            type: 'move_made',
            board: demoBoard,
            current_turn: nextTurn
        };
        handleServerMessage(moveMessage);
        
        // Simular jogada do oponente após 1 segundo
        if (nextTurn !== playerSymbol) {
            setTimeout(() => {
                const availableCells = demoBoard
                    .map((cell, index) => cell === '' ? index : -1)
                    .filter(index => index !== -1);
                
                if (availableCells.length > 0) {
                    const randomCell = availableCells[Math.floor(Math.random() * availableCells.length)];
                    demoBoard[randomCell] = nextTurn;
                    
                    const nextNextTurn = nextTurn === 'X' ? 'O' : 'X';
                    
                    const opponentMove = {
                        type: 'move_made',
                        board: demoBoard,
                        current_turn: nextNextTurn
                    };
                    handleServerMessage(opponentMove);
                    
                    // Verificar se há um vencedor após a jogada do oponente
                    checkGameResult(demoBoard);
                }
            }, 1000);
        }
        
        // Verificar se há um vencedor após a jogada do jogador
        checkGameResult(demoBoard);
    }
}

// Atualizar o tabuleiro
function updateBoard(board) {
    const cells = document.querySelectorAll('.cell');
    cells.forEach((cell, index) => {
        cell.textContent = board[index];
        cell.className = 'cell';
        if (board[index] === 'X') {
            cell.classList.add('x');
        } else if (board[index] === 'O') {
            cell.classList.add('o');
        }
    });
}

// Atualizar indicador de turno
function updateTurnIndicator(currentTurn) {
    if (currentTurn === 'X') {
        document.getElementById('playerX').classList.add('active');
        document.getElementById('playerO').classList.remove('active');
        document.getElementById('gameStatus').textContent = 
            currentTurn === playerSymbol ? 'Sua vez!' : 'Vez do jogador X';
    } else {
        document.getElementById('playerO').classList.add('active');
        document.getElementById('playerX').classList.remove('active');
        document.getElementById('gameStatus').textContent = 
            currentTurn === playerSymbol ? 'Sua vez!' : 'Vez do jogador O';
    }
}

// Destacar células vencedoras
function highlightWinningCells(winningCells) {
    if (!winningCells) return;
    
    winningCells.forEach(index => {
        const cell = document.querySelector(`.cell[data-index="${index}"]`);
        cell.classList.add('winner');
    });
}

// Verificar resultado do jogo (para modo de demonstração)
function checkGameResult(board) {
    // Verificar linhas
    for (let i = 0; i < 3; i++) {
        if (board[i*3] && board[i*3] === board[i*3+1] && board[i*3] === board[i*3+2]) {
            endGame(board[i*3], [i*3, i*3+1, i*3+2]);
            return;
        }
    }
    
    // Verificar colunas
    for (let i = 0; i < 3; i++) {
        if (board[i] && board[i] === board[i+3] && board[i] === board[i+6]) {
            endGame(board[i], [i, i+3, i+6]);
            return;
        }
    }
    
    // Verificar diagonais
    if (board[0] && board[0] === board[4] && board[0] === board[8]) {
        endGame(board[0], [0, 4, 8]);
        return;
    }
    
    if (board[2] && board[2] === board[4] && board[2] === board[6]) {
        endGame(board[2], [2, 4, 6]);
        return;
    }
    
    // Verificar empate
    if (!board.includes('')) {
        endGame(null);
    }
}

// Finalizar jogo (para modo de demonstração)
function endGame(winner, winningCells = null) {
    gameActive = false;
    isMyTurn = false;
    
    const gameOverMessage = {
        type: 'game_over',
        winner: winner,
        winning_cells: winningCells
    };
    handleServerMessage(gameOverMessage);
}

// Reiniciar o jogo
function resetGame() {
    initializeGameBoard();
    document.getElementById('gameStatus').textContent = 'Aguardando jogadores...';
    document.getElementById('playerX').classList.remove('active');
    document.getElementById('playerO').classList.remove('active');
    document.getElementById('playerXName').textContent = 'Aguardando...';
    document.getElementById('playerOName').textContent = 'Aguardando...';
    document.getElementById('resetButton').disabled = true;
    document.getElementById('joinButton').disabled = false;
    
    if (socket && socket.readyState === WebSocket.OPEN) {
        const message = {
            type: 'reset_game'
        };
        socket.send(JSON.stringify(message));
    }
}