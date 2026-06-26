const GAMES = [
    {id:'smb',name:'OG Super Mario Bros',icon:'🎮',description:'The legendary NES classic.',file:'games/mario.html',instructions:'Arrow Keys to move'},
    {id:'snake',name:'Neon Snake',icon:'🐍',description:'Classic snake game with neon graphics.',file:'games/snake.html',instructions:'WASD or Arrows to move'},
    {id:'memory',name:'Matrix Match',icon:'🧠',description:'Memory matching card game.',file:'games/memory.html',instructions:'Click tiles to match pairs'},
    {id:'pong',name:'Pong Protocols',icon:'🏓',description:'Classic Pong arcade game.',file:'games/pong.html',instructions:'W/S to move paddle'},
    {id:'tetris',name:'Tetromino Stack',icon:'🧩',description:'Tetris-style block stacking.',file:'games/tetris.html',instructions:'Arrows to move, Space to rotate'},
    {id:'minesweeper',name:'Minefield Scan',icon:'💣',description:'Minesweeper puzzle game.',file:'games/minesweeper.html',instructions:'Click to reveal, Right-click to flag'},
    {id:'breakout',name:'Brick Breaker Matrix',icon:'🧱',description:'Breakout brick breaker game.',file:'games/breakout.html',instructions:'Move paddle to bounce ball'}
];

function loadGamesGrid() {
    const gamesGrid = document.getElementById('gamesGrid');
    gamesGrid.innerHTML = GAMES.map((game, idx) => `
        <div onclick="playGame('${game.id}')" class="game-card p-8 rounded-2xl cursor-pointer group flex flex-col justify-between">
            <div>
                <div class="text-4xl mb-4">${game.icon}</div>
                <h3 class="text-2xl font-black font-display mb-2 uppercase">${game.name}</h3>
                <p class="text-sm text-gray-400 leading-relaxed">${game.description}</p>
                <div class="text-xs text-yellow-400 mt-3">⭐ ${getGameAverageRating(game.id)} • ${getGameReviews(game.id).length} reviews</div>
            </div>
            <div class="mt-6 font-display text-xs uppercase">Launch →</div>
        </div>
    `).join('');
}

function playGame(gameId) {
    const game = GAMES.find(g => g.id === gameId);
    if (!game) return;

    currentGameId = gameId;
    currentRating = 0;
    
    document.getElementById('gameTitle').textContent = game.name;
    document.getElementById('gameInstructions').textContent = game.instructions;
    document.getElementById('gameIframe').innerHTML = `<iframe src="${game.file}" style="width:100%;height:600px;border:2px solid #00ffcc;border-radius:0.5rem;background:#000;"></iframe>`;
    
    loadGameReviews();
    showSection('gamePlayer');

    const currentUser = getCurrentUser();
    if (currentUser) {
        const users = getAllUsers();
        const userIndex = users.findIndex(u => u.id === currentUser.id);
        if (userIndex !== -1) {
            if (!users[userIndex].gamesPlayed) users[userIndex].gamesPlayed = [];
            if (!users[userIndex].gamesPlayed.includes(gameId)) {
                users[userIndex].gamesPlayed.push(gameId);
                saveUsers(users);
            }
        }
    }
}

function loadGameReviews() {
    const reviews = getGameReviews(currentGameId);
    const reviewsContainer = document.getElementById('gameReviews');
    if (reviews.length === 0) {
        reviewsContainer.innerHTML = '<p class="text-gray-400">No reviews yet!</p>';
        return;
    }
    reviewsContainer.innerHTML = reviews.map(review => `
        <div class="bg-black/30 p-4 rounded-lg border border-white/10">
            <div class="flex justify-between mb-2">
                <span class="font-bold text-cyan-400">${review.username}</span>
                <span class="text-yellow-400">⭐${review.rating}</span>
            </div>
            <p class="text-sm text-gray-300">${review.text}</p>
        </div>
    `).join('');
}