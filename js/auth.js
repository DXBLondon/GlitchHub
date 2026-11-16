(function () {
    const config = window.GLITCHHUB_SUPABASE_CONFIG || {};
    const clientFactory = window.supabase && window.supabase.createClient;
    const isConfigured = config.url && config.anonKey &&
        !config.url.includes('YOUR_') && !config.anonKey.includes('YOUR_');

    let client = null;

    function getClient() {
        if (!isConfigured || !clientFactory) {
            throw new Error('Cloud accounts are not configured yet. Add the Supabase Project URL and anon key in js/supabase-config.js.');
        }
        if (!client) client = clientFactory(config.url, config.anonKey);
        return client;
    }

    function usernameToEmail(username) {
        // Supabase Auth requires an email or phone identifier. This stable internal
        // address lets the UI remain username-only; no mail is sent or collected.
        return `${username.trim().toLowerCase()}@accounts.glitchhub.invalid`;
    }

    function usernameIsValid(username) {
        return /^[a-zA-Z0-9_]{3,24}$/.test(username);
    }

    function setMessage(message, isError = false) {
        const node = document.getElementById('accountMessage');
        if (!node) return;
        node.textContent = message;
        node.classList.toggle('text-rose-400', isError);
        node.classList.toggle('text-cyan-300', !isError);
    }

    async function getCurrentUser() {
        const { data, error } = await getClient().auth.getUser();
        if (error) throw error;
        return data.user || null;
    }

    async function getProfile(user) {
        if (!user) return null;
        const { data, error } = await getClient()
            .from('profiles')
            .select('id, username, created_at')
            .eq('id', user.id)
            .maybeSingle();
        if (error) throw error;
        return data;
    }

    async function loadScores() {
        const user = await getCurrentUser();
        const container = document.getElementById('highScoreList');
        const profile = await getProfile(user);
        const welcome = document.getElementById('welcomeLabel');
        const authActions = document.getElementById('authActions');
        const signOutButton = document.getElementById('signOutButton');

        if (welcome) welcome.textContent = profile ? `Signed in as ${profile.username}` : 'Sign in or create an account';
        if (authActions) authActions.classList.toggle('hidden', Boolean(user));
        if (signOutButton) signOutButton.classList.toggle('hidden', !user);
        if (!container) return;

        if (!user) {
            container.innerHTML = '<p class="text-gray-400">Sign in to see your scores saved across devices.</p>';
            return;
        }

        const { data: scores, error } = await getClient()
            .from('high_scores')
            .select('game_name, score, updated_at')
            .eq('user_id', user.id)
            .order('score', { ascending: false });
        if (error) throw error;

        if (!scores || scores.length === 0) {
            container.innerHTML = '<p class="text-gray-400">No scores saved yet. Your best score for each game will show here.</p>';
            return;
        }

        container.replaceChildren(...scores.map((entry, index) => {
            const row = document.createElement('div');
            row.className = 'flex items-center justify-between rounded-lg border border-cyan-500/20 bg-slate-900/60 p-3';
            const info = document.createElement('div');
            const title = document.createElement('p');
            title.className = 'text-xs uppercase tracking-wider text-cyan-300';
            title.textContent = `#${index + 1} ${entry.game_name}`;
            const date = document.createElement('p');
            date.className = 'text-xs text-gray-400';
            date.textContent = new Date(entry.updated_at).toLocaleDateString();
            const score = document.createElement('span');
            score.className = 'font-black text-xl text-green-400';
            score.textContent = Number(entry.score).toLocaleString();
            info.append(title, date);
            row.append(info, score);
            return row;
        }));
    }

    async function signUp(username, password) {
        username = username.trim();
        if (!usernameIsValid(username)) {
            throw new Error('Use 3–24 letters, numbers, or underscores for your username.');
        }
        if (password.length < 8) {
            throw new Error('Choose a password with at least 8 characters.');
        }

        const auth = getClient().auth;
        const { data, error } = await auth.signUp({
            email: usernameToEmail(username),
            password,
            options: { data: { username } }
        });
        if (error) throw error;

        // With email confirmation disabled, signUp returns an active session.
        // Upsert profile so the form can also recover from a retried request.
        if (data.user) {
            const { error: profileError } = await getClient()
                .from('profiles')
                .upsert({ id: data.user.id, username }, { onConflict: 'id' });
            if (profileError) throw profileError;
        }
        await loadScores();
        setMessage('Account created. You can now sign in on this or another device.');
    }

    async function signIn(username, password) {
        username = username.trim();
        if (!username || !password) throw new Error('Enter your username and password.');
        const { error } = await getClient().auth.signInWithPassword({
            email: usernameToEmail(username),
            password
        });
        if (error) throw new Error('Could not sign in with that username and password.');
        await loadScores();
        setMessage('Signed in. Your scores are synced to your account.');
    }

    async function signOut() {
        const { error } = await getClient().auth.signOut();
        if (error) throw error;
        await loadScores();
        setMessage('Signed out.');
    }

    async function saveHighScore(gameName, score) {
        const user = await getCurrentUser();
        if (!user) return false;
        const numericScore = Number(score);
        if (!Number.isFinite(numericScore) || numericScore < 0) return false;

        const { data: previous, error: readError } = await getClient()
            .from('high_scores')
            .select('score')
            .eq('user_id', user.id)
            .eq('game_name', String(gameName))
            .maybeSingle();
        if (readError) throw readError;
        if (previous && Number(previous.score) >= numericScore) return false;

        const { error } = await getClient()
            .from('high_scores')
            .upsert({
                user_id: user.id,
                game_name: String(gameName),
                score: numericScore,
                updated_at: new Date().toISOString()
            }, { onConflict: 'user_id,game_name' });
        if (error) throw error;
        await loadScores();
        return true;
    }

    function readForm(formId) {
        const form = document.getElementById(formId);
        const formData = new FormData(form);
        return {
            username: String(formData.get('username') || ''),
            password: String(formData.get('password') || '')
        };
    }

    function wireForms() {
        const signInForm = document.getElementById('signinForm');
        const signUpForm = document.getElementById('signupForm');
        const signOutButton = document.getElementById('signOutButton');
        const signInTab = document.getElementById('showSignIn');
        const signUpTab = document.getElementById('showSignUp');

        if (signInForm) signInForm.addEventListener('submit', async event => {
            event.preventDefault();
            try {
                await signIn(readForm('signinForm').username, readForm('signinForm').password);
                signInForm.reset();
            } catch (error) {
                setMessage(error.message || 'Sign in failed.', true);
            }
        });

        if (signUpForm) signUpForm.addEventListener('submit', async event => {
            event.preventDefault();
            try {
                const values = readForm('signupForm');
                await signUp(values.username, values.password);
                signUpForm.reset();
            } catch (error) {
                setMessage(error.message || 'Could not create account.', true);
            }
        });

        if (signOutButton) signOutButton.addEventListener('click', async () => {
            try { await signOut(); } catch (error) { setMessage(error.message, true); }
        });

        if (signInTab && signUpTab) {
            signInTab.addEventListener('click', () => {
                document.getElementById('signinForm').classList.remove('hidden');
                document.getElementById('signupForm').classList.add('hidden');
                setMessage('Sign in with your username and password.');
            });
            signUpTab.addEventListener('click', () => {
                document.getElementById('signupForm').classList.remove('hidden');
                document.getElementById('signinForm').classList.add('hidden');
                setMessage('Create a username and password. No email address needed.');
            });
        }
    }

    document.addEventListener('DOMContentLoaded', async () => {
        wireForms();
        if (!isConfigured || !clientFactory) {
            setMessage('Cloud sign-in setup required: configure js/supabase-config.js and run supabase/schema.sql.', true);
            return;
        }
        try {
            getClient().auth.onAuthStateChange(() => {
                // Defer Supabase calls to avoid invoking them inside the auth callback.
                window.setTimeout(() => loadScores().catch(error => setMessage(error.message, true)), 0);
            });
            await loadScores();
            setMessage('Your account and best scores sync across devices.');
        } catch (error) {
            setMessage(error.message || 'Could not connect to account service.', true);
        }
    });

    window.GlitchHubAuth = { signUp, signIn, signOut, getCurrentUser, saveHighScore, loadScores };
})();
