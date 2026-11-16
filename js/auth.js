class User {
    constructor(username, password) {
        this.id = (typeof crypto !== 'undefined' && crypto.randomUUID)
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
        this.username = username.trim();
        this.password = password;
        this.bio = '';
        this.avatar = '👤';
        this.followers = [];
        this.following = [];
        this.gamesPlayed = [];
        this.reviews = [];
        this.highScores = [];
        this.createdAt = new Date().toISOString();
    }
}

const GLITCHHUB_USERS_KEY = 'glitchhub_users';
const GLITCHHUB_CURRENT_USER_KEY = 'glitchhub_current_user';

function getAllUsers() {
    try {
        return JSON.parse(localStorage.getItem(GLITCHHUB_USERS_KEY)) || [];
    } catch (error) {
        console.error('Failed to read users:', error);
        return [];
    }
}

function saveUsers(users) {
    localStorage.setItem(GLITCHHUB_USERS_KEY, JSON.stringify(users));
}

function saveCurrentUser(user) {
    if (!user) {
        localStorage.removeItem(GLITCHHUB_CURRENT_USER_KEY);
        return;
    }

    localStorage.setItem(GLITCHHUB_CURRENT_USER_KEY, JSON.stringify({
        id: user.id,
        username: user.username
    }));
}

function getCurrentUser() {
    try {
        const currentUser = JSON.parse(localStorage.getItem(GLITCHHUB_CURRENT_USER_KEY) || 'null');
        if (!currentUser) return null;

        const users = getAllUsers();
        return users.find(user => user.id === currentUser.id) || null;
    } catch (error) {
        console.error('Failed to read current user:', error);
        return null;
    }
}

function updateAuthUI() {
    const authButton = document.getElementById('authButton');
    const logoutButton = document.getElementById('logoutButton');
    const welcomeLabel = document.getElementById('welcomeLabel');
    const user = getCurrentUser();

    if (authButton) {
        if (user) {
            authButton.textContent = `Hi, ${user.username}`;
            authButton.disabled = true;
            authButton.classList.add('opacity-75', 'cursor-default');
        } else {
            authButton.textContent = 'Sign In / Sign Up';
            authButton.disabled = false;
            authButton.classList.remove('opacity-75', 'cursor-default');
        }
    }

    if (logoutButton) {
        logoutButton.classList.toggle('hidden', !user);
    }

    if (welcomeLabel) {
        welcomeLabel.textContent = user ? `Logged in as ${user.username}` : 'No account yet';
    }
}

function openAuthModal(mode = 'signin') {
    const modal = document.getElementById('authModal');
    const signInTab = document.querySelector('[data-auth-tab="signin"]');
    const signUpTab = document.querySelector('[data-auth-tab="signup"]');
    const signInForm = document.getElementById('signinForm');
    const signUpForm = document.getElementById('signupForm');

    if (!modal) return;

    modal.classList.remove('hidden');

    if (signInTab && signUpTab) {
        const isSignUp = mode === 'signup';
        signInTab.classList.toggle('bg-cyan-500', !isSignUp);
        signInTab.classList.toggle('text-black', !isSignUp);
        signInTab.classList.toggle('bg-slate-800', isSignUp);
        signInTab.classList.toggle('text-cyan-300', isSignUp);

        signUpTab.classList.toggle('bg-cyan-500', isSignUp);
        signUpTab.classList.toggle('text-black', isSignUp);
        signUpTab.classList.toggle('bg-slate-800', !isSignUp);
        signUpTab.classList.toggle('text-cyan-300', !isSignUp);
    }

    if (signInForm && signUpForm) {
        signInForm.classList.toggle('hidden', mode !== 'signin');
        signUpForm.classList.toggle('hidden', mode !== 'signup');
    }
}

function closeAuthModal() {
    const modal = document.getElementById('authModal');
    if (modal) modal.classList.add('hidden');
}

function clearAuthForms() {
    const fields = [
        'signupUsername',
        'signupPassword',
        'signinUsername',
        'signinPassword'
    ];

    fields.forEach(id => {
        const field = document.getElementById(id);
        if (field) field.value = '';
    });
}

function registerUser() {
    const username = document.getElementById('signupUsername')?.value.trim();
    const password = document.getElementById('signupPassword')?.value;

    if (!username || !password) {
        alert('Please enter a username and password.');
        return;
    }

    if (username.length < 3) {
        alert('Username must be at least 3 characters long.');
        return;
    }

    if (password.length < 4) {
        alert('Password must be at least 4 characters long.');
        return;
    }

    const users = getAllUsers();
    if (users.some(user => user.username.toLowerCase() === username.toLowerCase())) {
        alert('That username is already taken.');
        return;
    }

    const newUser = new User(username, password);
    users.push(newUser);
    saveUsers(users);
    saveCurrentUser(newUser);
    clearAuthForms();
    closeAuthModal();
    updateAuthUI();
    alert('Account created successfully!');
}

function loginUser() {
    const username = document.getElementById('signinUsername')?.value.trim();
    const password = document.getElementById('signinPassword')?.value;

    if (!username || !password) {
        alert('Please enter your username and password.');
        return;
    }

    const users = getAllUsers();
    const user = users.find(item =>
        item.username.toLowerCase() === username.toLowerCase() &&
        item.password === password
    );

    if (!user) {
        alert('Invalid username or password.');
        return;
    }

    saveCurrentUser(user);
    clearAuthForms();
    closeAuthModal();
    updateAuthUI();
    alert(`Welcome back, ${user.username}!`);
}

function logoutUser() {
    saveCurrentUser(null);
    updateAuthUI();
    alert('Logged out successfully.');
}

function saveHighScore(gameName, score) {
    const currentUser = getCurrentUser();
    if (!currentUser) return;

    const users = getAllUsers();
    const userIndex = users.findIndex(user => user.id === currentUser.id);
    if (userIndex === -1) return;

    users[userIndex].highScores = users[userIndex].highScores || [];
    users[userIndex].highScores.push({
        gameName: String(gameName),
        score: Number(score),
        createdAt: new Date().toISOString()
    });

    users[userIndex].highScores.sort((a, b) => Number(b.score) - Number(a.score));
    users[userIndex].highScores = users[userIndex].highScores.slice(0, 20);

    saveUsers(users);
    saveCurrentUser(users[userIndex]);
}

function getHighScoresForCurrentUser() {
    const currentUser = getCurrentUser();
    if (!currentUser) return [];

    const users = getAllUsers();
    const match = users.find(user => user.id === currentUser.id);
    return match && match.highScores ? match.highScores : [];
}

function getLeaderboard() {
    return getAllUsers()
        .map(user => ({
            username: user.username,
            bestScore: user.highScores && user.highScores.length
                ? Math.max(...user.highScores.map(entry => Number(entry.score)))
                : 0,
            games: user.highScores ? user.highScores.length : 0
        }))
        .sort((a, b) => b.bestScore - a.bestScore)
        .slice(0, 10);
}

function renderHighScoreList() {
    const list = document.getElementById('highScoreList');
    if (!list) return;

    const user = getCurrentUser();
    const scores = getHighScoresForCurrentUser();

    if (!user || scores.length === 0) {
        list.innerHTML = '<p class="text-gray-400">No scores saved yet. Play a game and your top scores will appear here.</p>';
        return;
    }

    list.innerHTML = scores
        .slice(0, 8)
        .map((entry, index) => `
            <div class="flex items-center justify-between rounded-lg border border-cyan-500/20 bg-slate-900/60 p-3">
                <div>
                    <p class="text-xs uppercase tracking-wider text-cyan-300">#${index + 1} ${entry.gameName}</p>
                    <p class="text-xs text-gray-400">${new Date(entry.createdAt).toLocaleDateString()}</p>
                </div>
                <span class="font-black text-xl text-green-400">${Number(entry.score).toLocaleString()}</span>
            </div>
        `)
        .join('');
}

window.GlitchHubAuth = {
    getAllUsers,
    getCurrentUser,
    getLeaderboard,
    getHighScoresForCurrentUser,
    saveHighScore,
    registerUser,
    loginUser,
    logoutUser,
    openAuthModal,
    closeAuthModal,
    updateAuthUI,
    renderHighScoreList
};

document.addEventListener('DOMContentLoaded', () => {
    const authButton = document.getElementById('authButton');
    const logoutButton = document.getElementById('logoutButton');
    const closeButton = document.getElementById('closeAuthModal');
    const signInTab = document.querySelector('[data-auth-tab="signin"]');
    const signUpTab = document.querySelector('[data-auth-tab="signup"]');
    const signUpForm = document.getElementById('signupForm');
    const signInForm = document.getElementById('signinForm');

    if (authButton) {
        authButton.addEventListener('click', () => openAuthModal('signin'));
    }

    if (logoutButton) {
        logoutButton.addEventListener('click', logoutUser);
    }

    if (closeButton) {
        closeButton.addEventListener('click', closeAuthModal);
    }

    if (signUpTab) {
        signUpTab.addEventListener('click', () => openAuthModal('signup'));
    }

    if (signInTab) {
        signInTab.addEventListener('click', () => openAuthModal('signin'));
    }

    if (signUpForm) {
        signUpForm.addEventListener('submit', (event) => {
            event.preventDefault();
            registerUser();
        });
    }

    if (signInForm) {
        signInForm.addEventListener('submit', (event) => {
            event.preventDefault();
            loginUser();
        });
    }

    const modal = document.getElementById('authModal');
    if (modal) {
        modal.addEventListener('click', (event) => {
            if (event.target === modal) closeAuthModal();
        });
    }

    updateAuthUI();
    renderHighScoreList();
});
