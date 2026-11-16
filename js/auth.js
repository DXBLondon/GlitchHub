(function () {
    const config = window.GLITCHHUB_SUPABASE_CONFIG || {};
    const client = window.supabase && config.url && config.anonKey
        ? window.supabase.createClient(config.url, config.anonKey, {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: true
            }
        })
        : null;

    function setStatus(message, isError = false) {
        const messageEl = document.getElementById('accountMessage');
        if (!messageEl) return;
        messageEl.textContent = message || '';
        messageEl.style.color = isError ? '#fca5a5' : '#67e8f9';
    }

    function normalizeUsername(value) {
        const clean = String(value || '').trim();
        if (!clean) return '';
        const allowed = clean.replace(/[^A-Za-z0-9_]/g, '');
        return allowed;
    }

    function syntheticEmail(username) {
        const safe = normalizeUsername(username).toLowerCase();
        return `${safe || 'player'}@glitchhub.local`;
    }

    function toggleAuthForms(mode) {
        const signInForm = document.getElementById('signinForm');
        const signUpForm = document.getElementById('signupForm');
        const showSignIn = document.getElementById('showSignIn');
        const showSignUp = document.getElementById('showSignUp');
        if (!signInForm || !signUpForm || !showSignIn || !showSignUp) return;

        const isSignIn = mode === 'signin';
        signInForm.classList.toggle('hidden', !isSignIn);
        signUpForm.classList.toggle('hidden', isSignIn);
        showSignIn.classList.toggle('bg-cyan-500', isSignIn);
        showSignIn.classList.toggle('text-black', isSignIn);
        showSignIn.classList.toggle('bg-slate-800', !isSignIn);
        showSignIn.classList.toggle('text-cyan-200', !isSignIn);
        showSignUp.classList.toggle('bg-cyan-500', !isSignIn);
        showSignUp.classList.toggle('text-black', !isSignIn);
        showSignUp.classList.toggle('bg-slate-800', isSignIn);
        showSignUp.classList.toggle('text-cyan-200', isSignIn);
    }

    function setSignedOutUi() {
        const welcomeLabel = document.getElementById('welcomeLabel');
        const signOutButton = document.getElementById('signOutButton');
        if (welcomeLabel) welcomeLabel.textContent = 'Sign in or create an account';
        if (signOutButton) signOutButton.classList.add('hidden');
        setStatus('');
    }

    function setSignedInUi(username) {
        const welcomeLabel = document.getElementById('welcomeLabel');
        const signOutButton = document.getElementById('signOutButton');
        if (welcomeLabel) welcomeLabel.textContent = `Welcome back, ${username}`;
        if (signOutButton) signOutButton.classList.remove('hidden');
    }

    async function readProfileByUserId(userId) {
        if (!client || !userId) return null;
        const { data, error } = await client
            .from('profiles')
            .select('username')
            .eq('id', userId)
            .maybeSingle();

        if (error && error.code !== 'PGRST116') throw error;
        return data;
    }

    async function saveUserProfile(userId, username) {
        if (!client || !userId) return null;
        const clean = normalizeUsername(username);
        if (!clean) throw new Error('Username is required.');

        const { data, error } = await client
            .from('profiles')
            .upsert({ id: userId, username: clean }, { onConflict: 'id' })
            .select()
            .single();

        if (error) {
            if (error.code === '23505') {
                throw new Error('That username is already taken.');
            }
            throw error;
        }

        return data;
    }

    async function renderHighScores() {
        const listEl = document.getElementById('highScoreList');
        if (!listEl) return;

        const session = await getActiveSession();
        if (!session) {
            listEl.innerHTML = '<p class="text-gray-400">Sign in to see your saved scores.</p>';
            return;
        }

        const { data, error } = await client
            .from('high_scores')
            .select('*')
            .eq('user_id', session.user.id)
            .order('score', { ascending: false });

        if (error) {
            console.error('Failed to load high scores:', error);
            listEl.innerHTML = '<p class="text-red-300">Unable to load scores right now.</p>';
            return;
        }

        if (!data || data.length === 0) {
            listEl.innerHTML = '<p class="text-gray-400">No saved scores yet. Play a game and your best score will appear here.</p>';
            return;
        }

        listEl.innerHTML = data.map((row) => `
            <div class="flex items-center justify-between rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2">
                <span class="font-bold text-cyan-300">${row.game_name}</span>
                <span class="text-yellow-400 font-black">${Number(row.score).toLocaleString()}</span>
            </div>
        `).join('');
    }

    async function getActiveSession() {
        if (!client) return null;
        const { data: { session }, error } = await client.auth.getSession();
        if (error) {
            console.error('Session error:', error);
            return null;
        }
        return session;
    }

    async function syncAccountState() {
        if (!client) {
            setStatus('Supabase is not configured yet. Check js/supabase-config.js.', true);
            return;
        }

        const session = await getActiveSession();
        if (!session) {
            setSignedOutUi();
            await renderHighScores();
            return;
        }

        const profile = await readProfileByUserId(session.user.id);
        const username = profile?.username || session.user.user_metadata?.username || 'Player';
        setSignedInUi(username);
        await renderHighScores();
    }

    async function handleSignUp(event) {
        event.preventDefault();
        if (!client) {
            setStatus('Supabase is not configured yet. Add your Project URL and anon key.', true);
            return;
        }

        const form = event.currentTarget;
        const username = normalizeUsername(form.username.value);
        const password = form.password.value;

        if (username.length < 3 || username.length > 24) {
            setStatus('Username must be 3 to 24 letters, numbers, or underscores.', true);
            return;
        }

        if (password.length < 8) {
            setStatus('Password must be at least 8 characters.', true);
            return;
        }

        setStatus('Creating account...');

        try {
            const email = syntheticEmail(username);
            const { data, error } = await client.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        username
                    }
                }
            });

            if (error) throw error;

            if (data.user) {
                await saveUserProfile(data.user.id, username);
            }

            setStatus('Account created! You can now sign in.');
            toggleAuthForms('signin');
            form.reset();
            await syncAccountState();
        } catch (error) {
            console.error('Signup error:', error);
            setStatus(error.message || 'Account creation failed.', true);
        }
    }

    async function handleSignIn(event) {
        event.preventDefault();
        if (!client) {
            setStatus('Supabase is not configured yet. Add your Project URL and anon key.', true);
            return;
        }

        const form = event.currentTarget;
        const username = normalizeUsername(form.username.value);
        const password = form.password.value;

        if (!username || !password) {
            setStatus('Enter both username and password.', true);
            return;
        }

        setStatus('Signing in...');

        try {
            const { data, error } = await client.auth.signInWithPassword({
                email: syntheticEmail(username),
                password
            });

            if (error) throw error;

            const profile = await readProfileByUserId(data.user.id);
            const finalUsername = profile?.username || username;
            await saveUserProfile(data.user.id, finalUsername);
            setSignedInUi(finalUsername);
            setStatus(`Signed in as ${finalUsername}.`);
            form.reset();
            await renderHighScores();
        } catch (error) {
            console.error('Sign-in error:', error);
            setStatus('Invalid username or password.', true);
        }
    }

    async function handleSignOut() {
        if (!client) return;
        const { error } = await client.auth.signOut();
        if (error) {
            console.error('Sign-out error:', error);
            setStatus('Unable to sign out right now.', true);
            return;
        }

        setSignedOutUi();
        setStatus('Signed out.');
        await renderHighScores();
    }

    async function initAuthPage() {
        const signInForm = document.getElementById('signinForm');
        const signUpForm = document.getElementById('signupForm');
        const showSignIn = document.getElementById('showSignIn');
        const showSignUp = document.getElementById('showSignUp');
        const signOutButton = document.getElementById('signOutButton');

        if (showSignIn) {
            showSignIn.addEventListener('click', () => toggleAuthForms('signin'));
        }

        if (showSignUp) {
            showSignUp.addEventListener('click', () => toggleAuthForms('signup'));
        }

        if (signInForm) {
            signInForm.addEventListener('submit', handleSignIn);
        }

        if (signUpForm) {
            signUpForm.addEventListener('submit', handleSignUp);
        }

        if (signOutButton) {
            signOutButton.addEventListener('click', handleSignOut);
        }

        setSignedOutUi();
        await syncAccountState();
    }

    async function saveHighScore(gameName, score) {
        if (!client) {
            console.warn('Supabase is not configured. High score not saved.');
            return false;
        }

        const session = await getActiveSession();
        if (!session) {
            console.warn('No active Supabase session. User must sign in first.');
            return false;
        }

        const safeGameName = String(gameName || '').trim();
        const value = Number(score || 0);
        if (!safeGameName) {
            console.warn('Game name is missing.');
            return false;
        }

        const { error } = await client
            .from('high_scores')
            .upsert({
                user_id: session.user.id,
                game_name: safeGameName,
                score: value,
                updated_at: new Date().toISOString()
            }, { onConflict: 'user_id,game_name' });

        if (error) {
            console.error('High score save failed:', error);
            throw error;
        }

        await renderHighScores();
        return true;
    }

    async function loadHighScores() {
        await renderHighScores();
    }

    window.GlitchHubAuth = {
        client,
        saveHighScore,
        loadHighScores,
        signUp: handleSignUp,
        signIn: handleSignIn,
        signOut: handleSignOut,
        getActiveSession,
        syncAccountState,
        normalizeUsername,
        syntheticEmail
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAuthPage);
    } else {
        initAuthPage();
    }
})();
