class User {
    constructor(username, email, password, bio = '') {
        this.id = Date.now().toString();
        this.username = username;
        this.email = email;
        this.password = password;
        this.bio = bio;
        this.avatar = '👤';
        this.followers = [];
        this.following = [];
        this.gamesPlayed = [];
        this.reviews = [];
        this.createdAt = new Date().toISOString();
    }
}

function getAllUsers() {
    return JSON.parse(localStorage.getItem('users')) || [];
}

function saveUsers(users) {
    localStorage.setItem('users', JSON.stringify(users));
}

function registerUser() {
    const username = document.getElementById('username').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const bio = document.getElementById('bio').value.trim();

    if (!username || !email || !password) {
        alert('Please fill in all required fields');
        return;
    }

    if (password.length < 6) {
        alert('Password must be at least 6 characters');
        return;
    }

    const users = getAllUsers();
    if (users.some(u => u.email === email)) {
        alert('Email already registered');
        return;
    }

    const newUser = new User(username, email, password, bio);
    users.push(newUser);
    saveUsers(users);

    localStorage.setItem('currentUser', JSON.stringify({
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        bio: newUser.bio
    }));

    closeAuthModal();
    updateAuthUI();
    clearAuthForms();
    alert('Account created successfully!');
}

function loginUser() {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    if (!email || !password) {
        alert('Please enter email and password');
        return;
    }

    const users = getAllUsers();
    const user = users.find(u => u.email === email && u.password === password);

    if (!user) {
        alert('Invalid email or password');
        return;
    }

    localStorage.setItem('currentUser', JSON.stringify({
        id: user.id,
        username: user.username,
        email: user.email,
        bio: user.bio
    }));

    closeAuthModal();
    updateAuthUI();
    clearAuthForms();
    alert('Logged in successfully!');
}

function logoutUser() {
    localStorage.removeItem('currentUser');
    updateAuthUI();
    showSection('home');
    alert('Logged out successfully!');
}

function clearAuthForms() {
    document.getElementById('username').value = '';
    document.getElementById('email').value = '';
    document.getElementById('password').value = '';
    document.getElementById('bio').value = '';
    document.getElementById('loginEmail').value = '';
    document.getElementById('loginPassword').value = '';
}

function getCurrentUser() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) return null;
    const users = getAllUsers();
    return users.find(u => u.id === currentUser.id);
}

function editProfile() {
    const currentUser = getCurrentUser();
    if (!currentUser) {
        alert('Please login first');
        return;
    }

    const newBio = prompt('Enter new bio:', currentUser.bio);
    if (newBio !== null) {
        const users = getAllUsers();
        const userIndex = users.findIndex(u => u.id === currentUser.id);
        users[userIndex].bio = newBio;
        saveUsers(users);
        
        const current = JSON.parse(localStorage.getItem('currentUser'));
        current.bio = newBio;
        localStorage.setItem('currentUser', JSON.stringify(current));
        
        loadProfile();
    }
}

function loadProfile() {
    const currentUser = getCurrentUser();
    if (!currentUser) return;

    document.getElementById('userAvatarDisplay').textContent = currentUser.avatar || '👤';
    document.getElementById('profileUsername').textContent = currentUser.username;
    document.getElementById('profileBio').textContent = currentUser.bio || 'No bio set';
    document.getElementById('profileGamesPlayed').textContent = currentUser.gamesPlayed?.length || 0;
    document.getElementById('profileFollowers').textContent = currentUser.followers?.length || 0;
    document.getElementById('profileReviews').textContent = currentUser.reviews?.length || 0;

    loadUserReviews();
}

function loadUserReviews() {
    const currentUser = getCurrentUser();
    if (!currentUser) return;

    const reviews = currentUser.reviews || [];
    const reviewsContainer = document.getElementById('userReviews');

    if (reviews.length === 0) {
        reviewsContainer.innerHTML = '<p class="text-gray-400">No reviews yet. Play a game and leave a review!</p>';
        return;
    }

    reviewsContainer.innerHTML = reviews.map(review => `
        <div class="bg-slate-900/60 p-4 rounded-lg border border-white/10">
            <div class="flex justify-between items-start mb-2">
                <h4 class="font-bold text-cyan-400">${review.gameName}</h4>
                <span class="text-yellow-400">${'⭐'.repeat(review.rating)}</span>
            </div>
            <p class="text-gray-300">${review.text}</p>
            <p class="text-xs text-gray-500 mt-2">${new Date(review.createdAt).toLocaleDateString()}</p>
        </div>
    `).join('');
}