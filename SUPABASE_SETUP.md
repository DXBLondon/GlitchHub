# Enabling GlitchHub cloud accounts

The account portal is `accounts.html`; it offers username-only sign-up/sign-in and shows the signed-in player's best scores. Accounts and scores are stored in Supabase, so a player can use the same credentials on another device. The static GitHub Pages site does not provide a database or server by itself, so a Supabase project must be configured before cloud accounts can connect.

## One-time setup

1. Create a Supabase project.
2. In **Authentication → Providers → Email**, enable email/password sign-in and turn **Confirm email** off. GlitchHub does not collect or send email: the browser maps each username to an internal `@accounts.glitchhub.invalid` identity because Supabase Auth's password provider requires an identifier in email format.
3. Open **SQL Editor**, run `supabase/schema.sql` from this repository.
4. Copy the project's **Project URL** and **anon/public key** from **Project Settings → API** into `js/supabase-config.js`.
5. Publish the changed files to GitHub Pages and visit `/accounts.html` to create an account.

Only use the anon/public key in browser code. Never publish a Supabase `service_role` key. The SQL enables row-level security so authenticated users can only read or modify their own profile and high scores.

## Connect game scores

On the homepage, when a game ends and its final score is known, call:

```js
window.GlitchHubAuth?.saveHighScore('snake', finalScore).catch(console.error);
```

The cloud service keeps the best score per user and game. The existing inline game code in `index.html` is not yet wired to these score hooks. Also add a navigation link or button to `accounts.html` in `index.html` to make the account portal reachable directly from the games page.

## Limitations

The username-only experience uses a synthetic email identifier internally; users do not need to own or enter an email address. Usernames are case-insensitive. Password reset is unavailable without an email recovery method. Keep your Supabase project's allowed authentication settings and usage limits appropriate for the site.
