 Jogo da Velha Multiplayer com WebSocket
Um jogo da velha multiplayer em tempo real desenvolvido com WebSocket, permitindo que dois jogadores se conectem e joguem simultaneamente através do navegador.

https://img.shields.io/badge/Status-Funcionando-green https://img.shields.io/badge/Node.js-18+-green https://img.shields.io/badge/WebSocket-Real--Time-blue

 Características
 Multiplayer em tempo real usando WebSocket

 Interface responsiva e moderna

 Sistema de turnos automático

 Detecção de vitória/empate inteligente

 Modo demonstração para teste individual

 Reconexão automática em caso de desconexão

 Indicadores visuais de jogador ativo e células vencedoras

 Contador de jogadores online

 Como Executar
Pré-requisitos
Node.js 14+ instalado

Navegador moderno com suporte a WebSocket

Instalação e Execução
Clone o repositório:

bash
git clone https://github.com/seu-usuario/jogo-da-velha-websocket.git
cd jogo-da-velha-websocket
Instale as dependências:

bash
npm install
Execute o servidor:

bash
# Modo produção
npm start

# Ou modo desenvolvimento (com auto-reload)
npm run dev
Acesse o jogo:
Abra seu navegador e visite: http://localhost:8080

Modo Demonstração
Se você quiser testar sozinho, o jogo possui um modo demonstração que funciona mesmo sem o servidor WebSocket. Basta abrir o arquivo index.html diretamente no navegador.

 Como Jogar
Conectar: Abra o jogo no navegador

Participar: Clique no botão "Participar"

Aguardar: Espere por um segundo jogador

Jogar: Quando o jogo iniciar, clique em uma célula vazia para fazer sua jogada

Objetivo: Formar uma linha, coluna ou diagonal com seu símbolo (X ou O)

 Estrutura do Projeto
text
jogo-da-velha-websocket/
├── index.html          # Interface principal do jogo
├── style.css           # Estilos e design responsivo
├── script.js           # Lógica do cliente (frontend)
├── server.js           # Servidor WebSocket (backend)
├── package.json        # Configurações e dependências
└── README.md           # Este arquivo
 Tecnologias Utilizadas
Frontend
HTML5 - Estrutura semântica

CSS3 - Estilos e animações

JavaScript Vanilla - Lógica do cliente

WebSocket API - Comunicação em tempo real

Backend
Node.js - Ambiente de execução

WebSocket (ws) - Servidor WebSocket

HTTP - Servidor web básico

 Protocolo de Comunicação
O jogo utiliza mensagens JSON para comunicação cliente-servidor:

Mensagens do Cliente para Servidor
javascript
// Entrar no jogo
{ type: 'join_game', player_name: 'NomeJogador' }

// Fazer jogada
{ type: 'make_move', cell: 4 }

// Reiniciar jogo
{ type: 'reset_game' }
Mensagens do Servidor para Cliente
javascript
// Contador de jogadores
{ type: 'players_online', count: 5 }

// Jogador entrou
{ type: 'game_joined', player_id: 'id123', symbol: 'X' }

// Jogo iniciado
{ type: 'game_start', players: { X: 'Jogador1', O: 'Jogador2' } }

// Jogada realizada
{ type: 'move_made', board: [...], current_turn: 'X' }

// Fim de jogo
{ type: 'game_over', winner: 'X', winning_cells: [0,1,2] }
 Funcionalidades da Interface
Design Responsivo - Funciona em desktop e mobile

Feedback Visual - Animações e transições suaves

Status em Tempo Real - Indicadores de conexão e turno

Destaque de Vitória - Células vencedoras pulsantes

Modo Escuro/Claro - Design moderno com gradientes

 Fluxo do Jogo
Conexão → Cliente conecta ao servidor WebSocket

Participação → Jogador clica em "Participar"

Emparelhamento → Servidor emparelha dois jogadores

Jogo → Turnos alternados até vitória ou empate

Reinício → Nova partida pode ser iniciada

 Desenvolvimento
Adicionando Novas Funcionalidades
Modifique o servidor em server.js

Atualize o cliente em script.js

Teste a comunicação entre cliente e servidor

Variáveis de Ambiente (Opcional)
Crie um arquivo .env para configurações:

env
PORT=8080
MAX_PLAYERS=100
