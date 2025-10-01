const WebSocket = require('ws');
const http = require('http');
const server = http.createServer();
const wss = new WebSocket.Server({ server });

let players = [];
let games = [];
let playerCount = 0;

wss.on('connection', function connection(ws) {
    playerCount++;
    const playerId = `player_${Date.now()}`;
    let currentPlayer = null;
    
    console.log(`Novo jogador conectado: ${playerId}`);
    broadcastPlayerCount();
    
    ws.on('message', function incoming(data) {
        try {
            const message = JSON.parse(data);
            handleMessage(ws, playerId, message);
        } catch (error) {
            console.error('Erro ao processar mensagem:', error);
        }
    });
    
    ws.on('close', function() {
        playerCount--;
        console.log(`Jogador desconectado: ${playerId}`);
        
        // Remover jogador da lista
        players = players.filter(p => p.id !== playerId);
        
        // Remover jogador de jogos ativos
        if (currentPlayer) {
            const gameIndex = games.findIndex(g => 
                g.players.X === currentPlayer || g.players.O === currentPlayer
            );
            
            if (gameIndex !== -1) {
                const game = games[gameIndex];
                games.splice(gameIndex, 1);
                
                // Notificar o outro jogador
                const otherPlayer = game.players.X === currentPlayer ? game.players.O : game.players.X;
                const otherWs = players.find(p => p.id === otherPlayer.id)?.ws;
                
                if (otherWs && otherWs.readyState === WebSocket.OPEN) {
                    otherWs.send(JSON.stringify({
                        type: 'game_over',
                        winner: null,
                        reason: 'Oponente desconectou'
                    }));
                }
            }
        }
        
        broadcastPlayerCount();
    });
    
    function handleMessage(ws, playerId, message) {
        switch (message.type) {
            case 'join_game':
                joinGame(ws, playerId, message.player_name);
                break;
                
            case 'make_move':
                makeMove(playerId, message.cell);
                break;
                
            case 'reset_game':
                resetGame(playerId);
                break;
        }
    }
    
    function joinGame(ws, playerId, playerName) {
        // Verificar se o jogador já está em um jogo
        if (currentPlayer) {
            ws.send(JSON.stringify({
                type: 'error',
                message: 'Você já está em um jogo'
            }));
            return;
        }
        
        // Criar novo jogador
        currentPlayer = {
            id: playerId,
            name: playerName,
            ws: ws
        };
        
        players.push(currentPlayer);
        
        // Encontrar jogo disponível ou criar novo
        let availableGame = games.find(game => !game.players.O);
        
        if (availableGame) {
            // Juntar-se ao jogo existente
            availableGame.players.O = currentPlayer;
            availableGame.board = ['', '', '', '', '', '', '', '', ''];
            availableGame.currentTurn = 'X';
            availableGame.active = true;
            
            // Notificar ambos os jogadores
            availableGame.players.X.ws.send(JSON.stringify({
                type: 'game_start',
                players: {
                    X: availableGame.players.X.name,
                    O: availableGame.players.O.name
                }
            }));
            
            availableGame.players.O.ws.send(JSON.stringify({
                type: 'game_joined',
                player_id: playerId,
                symbol: 'O'
            }));
            
            availableGame.players.O.ws.send(JSON.stringify({
                type: 'game_start',
                players: {
                    X: availableGame.players.X.name,
                    O: availableGame.players.O.name
                }
            }));
            
        } else {
            // Criar novo jogo
            const newGame = {
                players: { X: currentPlayer },
                board: ['', '', '', '', '', '', '', '', ''],
                currentTurn: 'X',
                active: false
            };
            
            games.push(newGame);
            
            ws.send(JSON.stringify({
                type: 'game_joined',
                player_id: playerId,
                symbol: 'X'
            }));
        }
        
        broadcastPlayerCount();
    }
    
    function makeMove(playerId, cellIndex) {
        const game = games.find(g => 
            (g.players.X && g.players.X.id === playerId) || 
            (g.players.O && g.players.O.id === playerId)
        );
        
        if (!game || !game.active) return;
        
        const playerSymbol = game.players.X.id === playerId ? 'X' : 'O';
        
        // Verificar se é a vez do jogador
        if (game.currentTurn !== playerSymbol) return;
        
        // Verificar se a célula está vazia
        if (game.board[cellIndex] !== '') return;
        
        // Fazer a jogada
        game.board[cellIndex] = playerSymbol;
        
        // Verificar se há um vencedor
        const winner = checkWinner(game.board);
        const winningCells = winner ? getWinningCells(game.board) : null;
        
        if (winner || !game.board.includes('')) {
            // Fim do jogo
            game.active = false;
            
            [game.players.X.ws, game.players.O.ws].forEach(ws => {
                if (ws && ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({
                        type: 'game_over',
                        winner: winner,
                        winning_cells: winningCells
                    }));
                }
            });
        } else {
            // Continuar o jogo
            game.currentTurn = game.currentTurn === 'X' ? 'O' : 'X';
            
            [game.players.X.ws, game.players.O.ws].forEach(ws => {
                if (ws && ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({
                        type: 'move_made',
                        board: game.board,
                        current_turn: game.currentTurn
                    }));
                }
            });
        }
    }
    
    function resetGame(playerId) {
        const gameIndex = games.findIndex(g => 
            (g.players.X && g.players.X.id === playerId) || 
            (g.players.O && g.players.O.id === playerId)
        );
        
        if (gameIndex !== -1) {
            const game = games[gameIndex];
            
            // Reiniciar o jogo
            game.board = ['', '', '', '', '', '', '', '', ''];
            game.currentTurn = 'X';
            game.active = true;
            
            [game.players.X.ws, game.players.O.ws].forEach(ws => {
                if (ws && ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({
                        type: 'game_start',
                        players: {
                            X: game.players.X.name,
                            O: game.players.O.name
                        }
                    }));
                }
            });
        }
    }
    
    function broadcastPlayerCount() {
        const message = JSON.stringify({
            type: 'players_online',
            count: playerCount
        });
        
        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    }
    
    function checkWinner(board) {
        // Verificar linhas
        for (let i = 0; i < 3; i++) {
            if (board[i*3] && board[i*3] === board[i*3+1] && board[i*3] === board[i*3+2]) {
                return board[i*3];
            }
        }
        
        // Verificar colunas
        for (let i = 0; i < 3; i++) {
            if (board[i] && board[i] === board[i+3] && board[i] === board[i+6]) {
                return board[i];
            }
        }
        
        // Verificar diagonais
        if (board[0] && board[0] === board[4] && board[0] === board[8]) {
            return board[0];
        }
        
        if (board[2] && board[2] === board[4] && board[2] === board[6]) {
            return board[2];
        }
        
        return null;
    }
    
    function getWinningCells(board) {
        // Verificar linhas
        for (let i = 0; i < 3; i++) {
            if (board[i*3] && board[i*3] === board[i*3+1] && board[i*3] === board[i*3+2]) {
                return [i*3, i*3+1, i*3+2];
            }
        }
        
        // Verificar colunas
        for (let i = 0; i < 3; i++) {
            if (board[i] && board[i] === board[i+3] && board[i] === board[i+6]) {
                return [i, i+3, i+6];
            }
        }
        
        // Verificar diagonais
        if (board[0] && board[0] === board[4] && board[0] === board[8]) {
            return [0, 4, 8];
        }
        
        if (board[2] && board[2] === board[4] && board[2] === board[6]) {
            return [2, 4, 6];
        }
        
        return null;
    }
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
    console.log(`Servidor WebSocket rodando na porta ${PORT}`);
});