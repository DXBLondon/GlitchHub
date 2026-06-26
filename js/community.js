function rateGame(gameId, rating, reviewText) {
    const currentUser = getCurrentUser();
    if (!currentUser) return;

    const game = GAMES.find(g => g.id === gameId);
    if (!game) return;

    const review = {gameId,gameName:game.name,rating,text:reviewText,username:currentUser.username,userId:currentUser.id,createdAt:new Date().toISOString()};
    
    const users = getAllUsers();
    const userIndex = users.findIndex(u => u.id === currentUser.id);
    if (userIndex !== -1) {
        if (!users[userIndex].reviews) users[userIndex].reviews = [];
        users[userIndex].reviews.push(review);
        saveUsers(users);
    }

    const allReviews = JSON.parse(localStorage.getItem('allReviews')) || [];
    allReviews.push(review);
    localStorage.setItem('allReviews', JSON.stringify(allReviews));
}

function getGameReviews(gameId) {
    const allReviews = JSON.parse(localStorage.getItem('allReviews')) || [];
    return allReviews.filter(r => r.gameId === gameId).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function getGameAverageRating(gameId) {
    const reviews = getGameReviews(gameId);
    if (reviews.length === 0) return '0';
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    return (sum / reviews.length).toFixed(1);
}

function loadCommunity() {
    const communityContent = document.getElementById('communityContent');
    
    const users = getAllUsers();
    const leaderboard = users
        .map(u => ({username:u.username,avatar:u.avatar||'👤',reviews:u.reviews?.length||0,followers:u.followers?.length||0}))
        .sort((a,b) => (b.reviews+b.followers) - (a.reviews+a.followers))
        .slice(0, 10);

    const allReviews = JSON.parse(localStorage.getItem('allReviews')) || [];
    const topGames = GAMES.map(game => ({
        ...game,
        rating:getGameAverageRating(game.id),
        reviewCount:getGameReviews(game.id).length
    })).sort((a,b) => b.rating - a.rating).slice(0, 10);

    const recentReviews = allReviews.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);

    communityContent.innerHTML = `
        <div class="bg-slate-950/60 p-6 rounded-lg border border-white/10">
            <h3 class="text-2xl font-black font-display mb-4 text-cyan-400">🏆 LEADERBOARD</h3>
            <div class="space-y-3">
                ${leaderboard.map((u,i) => `<div class="flex justify-between p-3 bg-black/30 rounded"><div><span class="text-yellow-400">#${i+1}</span> ${u.avatar} <span>${u.username}</span></div></div>`).join('')}
            </div>
        </div>
        <div class="bg-slate-950/60 p-6 rounded-lg border border-white/10">
            <h3 class="text-2xl font-black font-display mb-4 text-pink-400">⭐ TOP GAMES</h3>
            ${topGames.map(g => `<div class="p-3 bg-black/30 rounded mb-2"><div class="flex justify-between"><div>${g.icon} ${g.name}</div><div class="text-yellow-400">${g.rating}⭐</div></div></div>`).join('')}
        </div>
        <div class="bg-slate-950/60 p-6 rounded-lg border border-white/10">
            <h3 class="text-2xl font-black font-display mb-4 text-cyan-400">💬 RECENT</h3>
            ${recentReviews.map(r => `<div class="p-3 bg-black/30 rounded mb-2"><div class="text-sm"><span class="text-cyan-400 font-bold">${r.username}</span> on <span class="text-yellow-400">${r.gameName}</span></div><p class="text-xs text-gray-400">${r.text}</p></div>`).join('')}
        </div>
    `;
}