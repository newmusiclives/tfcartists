/**
 * The hold page itself, as a self-contained HTML document.
 *
 * Deliberately not a React page. Middleware serves this straight from the Edge,
 * which means the placeholder cannot accidentally drag the real site's root
 * layout — the radio player, the mobile nav, the DJ chat — along with it. It
 * also renders with no build output, no database and no client bundle, so it
 * still works on a deploy that is otherwise broken.
 *
 * Everything is inline: the CSP that middleware applies allows inline styles and
 * scripts but only 'self' for external sources, so no CDN font or script.
 */

const NETWORK_NAME = process.env.NEXT_PUBLIC_NETWORK_NAME || "TrueFans RADIO";
const TAGLINE =
  process.env.NEXT_PUBLIC_STATION_TAGLINE || "Where the Music Finds You";
const BLURB =
  process.env.COMING_SOON_MESSAGE ||
  "24/7 independent radio, built so that 92¢ of every dollar reaches the artist.";

function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Split "TrueFans RADIO" into its two display lines; fall back to one line. */
function splitWordmark(name: string): [string, string] {
  const parts = name.trim().split(/\s+/);
  if (parts.length < 2) return [name, ""];
  return [parts.slice(0, -1).join(" "), parts[parts.length - 1]];
}

export function comingSoonHtml(): string {
  const [nameTop, nameBottom] = splitWordmark(NETWORK_NAME);

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex, nofollow">
<meta name="theme-color" content="#0b0906">
<title>${esc(NETWORK_NAME)} — Launching soon</title>
<style>
  *, *::before, *::after { box-sizing: border-box; }
  html, body { height: 100%; }
  body {
    margin: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 32px 20px;
    background: #0b0906;
    background-image:
      radial-gradient(60rem 40rem at 50% -10%, rgba(180, 83, 9, 0.28), transparent 70%),
      radial-gradient(40rem 30rem at 90% 110%, rgba(120, 53, 15, 0.22), transparent 70%);
    color: #f5efe6;
    font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    text-rendering: optimizeLegibility;
  }
  main { width: 100%; max-width: 30rem; text-align: center; }
  .mark { color: #fbbf24; margin-bottom: 1.25rem; }
  .wordmark {
    margin: 0;
    font-size: clamp(1.75rem, 7vw, 2.5rem);
    font-weight: 700;
    line-height: 1.05;
    letter-spacing: 0.02em;
  }
  .wordmark span {
    display: block;
    font-weight: 300;
    letter-spacing: 0.42em;
    text-indent: 0.42em;
    color: #fbbf24;
    font-size: 0.62em;
    margin-top: 0.35rem;
  }
  .tagline {
    margin: 1rem 0 0;
    font-size: 0.9375rem;
    font-style: italic;
    color: rgba(245, 239, 230, 0.62);
  }
  hr {
    border: 0;
    height: 1px;
    margin: 2rem auto;
    background: linear-gradient(90deg, transparent, rgba(251, 191, 36, 0.38), transparent);
  }
  h2 { margin: 0 0 0.75rem; font-size: 1.125rem; font-weight: 600; letter-spacing: 0.01em; }
  .blurb { margin: 0 0 1.75rem; font-size: 0.9375rem; line-height: 1.6; color: rgba(245, 239, 230, 0.72); }
  form { display: flex; gap: 0.5rem; flex-wrap: wrap; }
  input[type="email"] {
    flex: 1 1 12rem;
    min-width: 0;
    padding: 0.75rem 0.9375rem;
    font: inherit;
    font-size: 0.9375rem;
    color: #f5efe6;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(251, 191, 36, 0.24);
    border-radius: 0.5rem;
    transition: border-color 0.15s ease, background 0.15s ease;
  }
  input[type="email"]::placeholder { color: rgba(245, 239, 230, 0.38); }
  input[type="email"]:focus-visible {
    outline: none;
    border-color: rgba(251, 191, 36, 0.7);
    background: rgba(255, 255, 255, 0.07);
  }
  button {
    flex: 0 0 auto;
    padding: 0.75rem 1.25rem;
    font: inherit;
    font-size: 0.9375rem;
    font-weight: 600;
    color: #1c1207;
    background: #fbbf24;
    border: 1px solid #fbbf24;
    border-radius: 0.5rem;
    cursor: pointer;
    transition: background 0.15s ease, transform 0.05s ease;
  }
  button:hover:not(:disabled) { background: #fcd34d; }
  button:active:not(:disabled) { transform: translateY(1px); }
  button:disabled { opacity: 0.55; cursor: default; }
  .note { margin: 0.875rem 0 0; font-size: 0.8125rem; color: rgba(245, 239, 230, 0.45); min-height: 1.2em; }
  .note.ok { color: #86efac; }
  .note.err { color: #fca5a5; }
  @media (prefers-reduced-motion: reduce) {
    * { transition: none !important; }
  }
</style>
</head>
<body>
<main>
  <svg class="mark" width="64" height="40" viewBox="0 0 64 40" fill="none" aria-hidden="true" focusable="false">
    <circle cx="32" cy="20" r="4.5" fill="currentColor"/>
    <path d="M22 10a14 14 0 0 0 0 20M42 10a14 14 0 0 1 0 20" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" opacity="0.75"/>
    <path d="M14 4a24 24 0 0 0 0 32M50 4a24 24 0 0 1 0 32" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" opacity="0.35"/>
  </svg>

  <h1 class="wordmark">${esc(nameTop)}${nameBottom ? `<span>${esc(nameBottom)}</span>` : ""}</h1>
  <p class="tagline">${esc(TAGLINE)}</p>

  <hr>

  <h2>Launching soon.</h2>
  <p class="blurb">${esc(BLURB)}</p>

  <form id="signup" novalidate>
    <label for="email" class="sr-only" style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap">Email address</label>
    <input id="email" type="email" name="email" placeholder="you@email.com" autocomplete="email" required>
    <button id="submit" type="submit">Notify me</button>
  </form>
  <p class="note" id="note" role="status" aria-live="polite">We&rsquo;ll email you once, at launch.</p>
</main>

<script>
(function () {
  var form = document.getElementById('signup');
  var email = document.getElementById('email');
  var button = document.getElementById('submit');
  var note = document.getElementById('note');

  function say(message, kind) {
    note.textContent = message;
    note.className = 'note' + (kind ? ' ' + kind : '');
  }

  // Double-submit CSRF: middleware sets this cookie on every response,
  // including this one, and the API compares it against the header.
  function csrfToken() {
    var match = document.cookie.split('; ').find(function (c) {
      return c.indexOf('csrf-token=') === 0;
    });
    return match ? decodeURIComponent(match.slice('csrf-token='.length)) : '';
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    var value = email.value.trim();
    if (!value || value.indexOf('@') < 1) {
      say('Please enter a valid email address.', 'err');
      email.focus();
      return;
    }

    button.disabled = true;
    say('Adding you\\u2026');

    fetch('/api/newsletter/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken() },
      body: JSON.stringify({ email: value })
    })
      .then(function (res) {
        return res.json().catch(function () { return {}; }).then(function (data) {
          return { status: res.status, data: data };
        });
      })
      .then(function (result) {
        if (result.status === 429) {
          say('Too many attempts just now — try again shortly.', 'err');
          button.disabled = false;
          return;
        }
        if (result.status >= 400 || !result.data.success) {
          say(result.data.error || 'Something went wrong. Please try again.', 'err');
          button.disabled = false;
          return;
        }
        form.style.display = 'none';
        say(
          result.data.alreadySubscribed
            ? 'You are already on the list — we will be in touch.'
            : 'You are on the list. We will email you at launch.',
          'ok'
        );
      })
      .catch(function () {
        say('Could not reach the server. Please try again.', 'err');
        button.disabled = false;
      });
  });
})();
</script>
</body>
</html>`;
}
