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

/**
 * Fetches recent commits across the user's repos.
 *
 * NOTE on the data source: GitHub's `/users/{u}/events/public` endpoint used
 * to include a `commits` array in PushEvent payloads, but it no longer does
 * — payloads now only contain `push_id`, `ref`, `head`, `before`. So we use
 * each PushEvent's `head` SHA + repo to fetch the actual commit details
 * from `/repos/{owner}/{repo}/commits/{sha}`.
 *
 * That's an extra fetch per event, but Next caches both layers, so under
 * normal traffic this hits the GitHub API rarely.
 *
 * If GH_TOKEN is set in env, we use it to raise the rate limit from
 * 60 req/hr unauthenticated to 5000 req/hr authenticated.
 */
export async function getGithub(username: string): Promise<GithubData | null> {
  const token = process.env.GH_TOKEN;
  const headers: Record<string, string> = { Accept: "application/vnd.github+json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  try {
    const [userRes, eventsRes] = await Promise.all([
      fetch(`https://api.github.com/users/${username}`, {
        headers,
        next: { revalidate: 600 },
      }),
      // Events list is the freshness bottleneck — anything newer than the
      // oldest cached copy won't show up until this refreshes. Keep it short.
      fetch(`https://api.github.com/users/${username}/events/public?per_page=30`, {
        headers,
        next: { revalidate: 60 },
      }),
    ]);

    if (!userRes.ok || !eventsRes.ok) return null;

    const user = await userRes.json();
    const events: GithubEvent[] = await eventsRes.json();

    // Collect (repo, head_sha, when) tuples from PushEvents — newest first.
    type PushRef = { repo: string; sha: string; when: string };
    const pushes: PushRef[] = [];
    const seen = new Set<string>();
    for (const e of events) {
      if (e.type !== "PushEvent" || !e.payload?.head) continue;
      const key = `${e.repo.name}@${e.payload.head}`;
      if (seen.has(key)) continue;
      seen.add(key);
      pushes.push({ repo: e.repo.name, sha: e.payload.head, when: e.created_at });
      if (pushes.length >= 10) break;
    }

    // Resolve each push's head commit. Use the cached commit endpoint —
    // commits are immutable so we can cache aggressively (1 day).
    const commits: GithubCommit[] = [];
    for (const p of pushes) {
      try {
        const commitRes = await fetch(
          `https://api.github.com/repos/${p.repo}/commits/${p.sha}`,
          { headers, next: { revalidate: 86400 } }
        );
        if (!commitRes.ok) continue;
        const c = await commitRes.json();
        const message = (c.commit?.message ?? "").split("\n")[0];
        commits.push({
          repo: p.repo,
          sha: p.sha.slice(0, 7),
          message,
          url: c.html_url ?? `https://github.com/${p.repo}/commit/${p.sha}`,
          when: c.commit?.author?.date ?? p.when,
        });
      } catch {
        // Skip individual failures — better to show 9 commits than nothing
      }
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
  payload?: { head?: string; commits?: { sha: string; message: string }[] };
}

// -------------------- GITHUB CONTRIBUTIONS --------------------

export interface ContributionDay {
  date: string;          // "2026-04-21"
  count: number;         // contribution count
  level: 0 | 1 | 2 | 3 | 4; // quartile intensity (0=none, 4=most)
}

export interface ContributionWeek {
  days: ContributionDay[];
}

export interface GithubContributions {
  totalThisYear: number;
  weeks: ContributionWeek[];
  currentStreak: number;
  longestStreak: number;
}

/**
 * Fetch the contribution calendar via GitHub's GraphQL API.
 * Requires GH_TOKEN — returns null without one (the /now page
 * hides the section gracefully).
 */
export async function getGithubContributions(
  username: string
): Promise<GithubContributions | null> {
  const token = process.env.GH_TOKEN;
  if (!token) return null;

  try {
    const query = `
      query($login: String!) {
        user(login: $login) {
          contributionsCollection {
            contributionCalendar {
              totalContributions
              weeks {
                contributionDays {
                  date
                  contributionCount
                  contributionLevel
                }
              }
            }
          }
        }
      }
    `;

    const res = await fetch("https://api.github.com/graphql", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query, variables: { login: username } }),
      next: { revalidate: 300 }, // 5 min cache — contributions don't change that fast
    });

    if (!res.ok) return null;
    const json = await res.json();
    const calendar =
      json?.data?.user?.contributionsCollection?.contributionCalendar;
    if (!calendar) return null;

    const levelMap: Record<string, 0 | 1 | 2 | 3 | 4> = {
      NONE: 0,
      FIRST_QUARTILE: 1,
      SECOND_QUARTILE: 2,
      THIRD_QUARTILE: 3,
      FOURTH_QUARTILE: 4,
    };

    const weeks: ContributionWeek[] = calendar.weeks.map(
      (w: { contributionDays: { date: string; contributionCount: number; contributionLevel: string }[] }) => ({
        days: w.contributionDays.map(
          (d: { date: string; contributionCount: number; contributionLevel: string }) => ({
            date: d.date,
            count: d.contributionCount,
            level: levelMap[d.contributionLevel] ?? 0,
          })
        ),
      })
    );

    // Flatten days in chronological order to compute streaks
    const allDays = weeks.flatMap((w) => w.days);
    const { current, longest } = computeStreaks(allDays);

    return {
      totalThisYear: calendar.totalContributions,
      weeks,
      currentStreak: current,
      longestStreak: longest,
    };
  } catch {
    return null;
  }
}

/**
 * Walk the calendar backwards from today to compute current and longest streaks.
 * A "streak" is consecutive days with ≥1 contribution. Today is allowed to be
 * 0 (the day isn't over yet) — in that case the streak starts from yesterday.
 */
function computeStreaks(days: ContributionDay[]): {
  current: number;
  longest: number;
} {
  let longest = 0;
  let current = 0;
  let streak = 0;
  let foundCurrentStreak = false;

  // Walk backwards from the most recent day
  for (let i = days.length - 1; i >= 0; i--) {
    if (days[i].count > 0) {
      streak++;
      longest = Math.max(longest, streak);
      if (!foundCurrentStreak) current = streak;
    } else {
      // If we're on today and it's 0, skip it (day isn't over)
      if (i === days.length - 1) continue;
      if (!foundCurrentStreak) {
        foundCurrentStreak = true;
        current = streak;
      }
      streak = 0;
    }
  }
  if (!foundCurrentStreak) current = streak;
  longest = Math.max(longest, streak);

  return { current, longest };
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
