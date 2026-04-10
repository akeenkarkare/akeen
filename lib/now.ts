/**
 * Data fetchers for the /now page.
 *
 * Three tiers, all runnable independently:
 *   1. GitHub — public API, no auth needed. Shows recent commits + streak.
 *   2. Spotify — requires SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET /
 *      SPOTIFY_REFRESH_TOKEN env vars. Shows currently-playing or most recent.
 *   3. Discord (via Lanyard) — requires DISCORD_USER_ID env var. Lanyard is
 *      a free service that exposes Discord presence over HTTP/WebSocket.
 *      https://github.com/Phineas/lanyard
 *
 * Each function returns null on any failure so the UI degrades gracefully —
 * a missing Spotify token shouldn't break the whole page.
 */

// -------------------- GITHUB --------------------

export interface GithubCommit {
  repo: string;
  sha: string;
  message: string;
  url: string;
  when: string;
}

export interface GithubData {
  username: string;
  commits: GithubCommit[];
  publicRepos: number;
  followers: number;
}

export async function getGithub(username: string): Promise<GithubData | null> {
  try {
    const [userRes, eventsRes] = await Promise.all([
      fetch(`https://api.github.com/users/${username}`, {
        headers: { Accept: "application/vnd.github+json" },
        next: { revalidate: 600 },
      }),
      fetch(`https://api.github.com/users/${username}/events/public?per_page=30`, {
        headers: { Accept: "application/vnd.github+json" },
        next: { revalidate: 300 },
      }),
    ]);

    if (!userRes.ok || !eventsRes.ok) return null;

    const user = await userRes.json();
    const events: GithubEvent[] = await eventsRes.json();

    const commits: GithubCommit[] = [];
    for (const e of events) {
      if (e.type !== "PushEvent" || !e.payload?.commits) continue;
      for (const c of e.payload.commits) {
        commits.push({
          repo: e.repo.name,
          sha: c.sha.slice(0, 7),
          message: c.message.split("\n")[0],
          url: `https://github.com/${e.repo.name}/commit/${c.sha}`,
          when: e.created_at,
        });
        if (commits.length >= 10) break;
      }
      if (commits.length >= 10) break;
    }

    return {
      username: user.login,
      commits,
      publicRepos: user.public_repos,
      followers: user.followers,
    };
  } catch {
    return null;
  }
}

interface GithubEvent {
  type: string;
  repo: { name: string };
  created_at: string;
  payload?: { commits?: { sha: string; message: string }[] };
}

// -------------------- SPOTIFY --------------------

export interface SpotifyTrack {
  isPlaying: boolean;
  title: string;
  artist: string;
  album: string;
  albumArt: string;
  url: string;
}

export async function getSpotify(): Promise<SpotifyTrack | null> {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  const refreshToken = process.env.SPOTIFY_REFRESH_TOKEN;
  if (!clientId || !clientSecret || !refreshToken) return null;

  try {
    // Exchange refresh token for an access token
    const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
    const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${basic}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }),
      next: { revalidate: 60 },
    });
    if (!tokenRes.ok) return null;
    const { access_token } = await tokenRes.json();

    // Try currently-playing first
    const nowRes = await fetch("https://api.spotify.com/v1/me/player/currently-playing", {
      headers: { Authorization: `Bearer ${access_token}` },
      cache: "no-store",
    });
    if (nowRes.status === 200) {
      const data = await nowRes.json();
      if (data?.item) return formatTrack(data.item, data.is_playing ?? true);
    }

    // Fall back to most recently played
    const recentRes = await fetch(
      "https://api.spotify.com/v1/me/player/recently-played?limit=1",
      {
        headers: { Authorization: `Bearer ${access_token}` },
        next: { revalidate: 60 },
      }
    );
    if (!recentRes.ok) return null;
    const recent = await recentRes.json();
    const item = recent.items?.[0]?.track;
    if (!item) return null;
    return formatTrack(item, false);
  } catch {
    return null;
  }
}

interface SpotifyItem {
  name: string;
  artists: { name: string }[];
  album: { name: string; images: { url: string }[] };
  external_urls: { spotify: string };
}

function formatTrack(item: SpotifyItem, isPlaying: boolean): SpotifyTrack {
  return {
    isPlaying,
    title: item.name,
    artist: item.artists.map((a) => a.name).join(", "),
    album: item.album.name,
    albumArt: item.album.images[0]?.url ?? "",
    url: item.external_urls.spotify,
  };
}

// -------------------- DISCORD (LANYARD) --------------------

export interface DiscordActivity {
  name: string;
  type: number; // 0 = game, 2 = listening, 3 = watching, 4 = custom
  details?: string;
  state?: string;
}

export interface DiscordPresence {
  status: "online" | "idle" | "dnd" | "offline";
  activities: DiscordActivity[];
}

export async function getDiscord(): Promise<DiscordPresence | null> {
  const userId = process.env.DISCORD_USER_ID;
  if (!userId) return null;
  try {
    const res = await fetch(`https://api.lanyard.rest/v1/users/${userId}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    const { data } = await res.json();
    if (!data) return null;
    // Filter out custom status activities (type 4); keep games/listening/watching
    const activities: DiscordActivity[] = (data.activities ?? [])
      .filter((a: DiscordActivity) => a.type !== 4)
      .map((a: DiscordActivity) => ({
        name: a.name,
        type: a.type,
        details: a.details,
        state: a.state,
      }));
    return { status: data.discord_status ?? "offline", activities };
  } catch {
    return null;
  }
}
