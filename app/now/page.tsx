import Link from "next/link";
import { getGithub, getGithubContributions, getSpotify, getDiscord } from "@/lib/now";
import type { ContributionWeek } from "@/lib/now";

export const revalidate = 60;

export const metadata = {
  title: "Akeen Karkare — /now",
  description: "What Akeen is building, listening to, and playing — live.",
};

const GITHUB_USERNAME = "akeenkarkare";

function timeAgo(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(iso).toLocaleDateString();
}

function statusColor(s: string): string {
  switch (s) {
    case "online": return "#22c55e";
    case "idle": return "#facc15";
    case "dnd": return "#ef4444";
    default: return "#6b7280";
  }
}

function activityVerb(type: number): string {
  switch (type) {
    case 0: return "Playing";
    case 2: return "Listening to";
    case 3: return "Watching";
    default: return "";
  }
}

export default async function NowPage() {
  const [github, contributions, spotify, discord] = await Promise.all([
    getGithub(GITHUB_USERNAME),
    getGithubContributions(GITHUB_USERNAME),
    getSpotify(),
    getDiscord(),
  ]);

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "56px 48px 80px",
        maxWidth: 860,
        margin: "0 auto",
        fontFamily: "ui-sans-serif, system-ui, sans-serif",
        color: "#e5e7eb",
        overflowY: "auto",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 40 }}>
        <div>
          <div style={{ fontFamily: "var(--mono)", fontSize: 12, letterSpacing: 2, color: "#9ca3af" }}>
            AKEEN // NOW
          </div>
          <h1 style={{ fontFamily: "var(--display)", fontSize: 44, fontWeight: 700, margin: "6px 0 0", letterSpacing: -1 }}>
            What I&apos;m doing, live.
          </h1>
          <p style={{ color: "#9ca3af", fontSize: 14, marginTop: 10 }}>
            Live feed. Auto-refreshes every minute.
          </p>
        </div>
        <Link
          href="/"
          style={{
            fontFamily: "var(--mono)",
            fontSize: 11,
            color: "#9ca3af",
            textDecoration: "none",
            border: "1px solid rgba(255,255,255,0.12)",
            padding: "6px 12px",
            borderRadius: 4,
          }}
        >
          ← back
        </Link>
      </div>

      {/* Discord presence — only render if configured */}
      {discord && (
        <Section title="Right now">
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  background: statusColor(discord.status),
                  display: "inline-block",
                }}
              />
              <span style={{ fontFamily: "var(--mono)", fontSize: 12, color: "#9ca3af" }}>
                discord · {discord.status}
              </span>
            </div>
            {discord.activities.length === 0 ? (
              <div style={{ color: "#6b7280", fontSize: 14 }}>Nothing active right now.</div>
            ) : (
              discord.activities.map((a, i) => (
                <div key={i} style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 18, fontWeight: 600 }}>
                    {activityVerb(a.type)} <span style={{ color: "#fef3c7" }}>{a.name}</span>
                  </div>
                  {a.details && (
                    <div style={{ fontSize: 13, color: "#9ca3af" }}>{a.details}</div>
                  )}
                  {a.state && (
                    <div style={{ fontSize: 13, color: "#6b7280" }}>{a.state}</div>
                  )}
                </div>
              ))
            )}
          </div>
        </Section>
      )}

      {/* Spotify — only render if configured */}
      {spotify && (
        <Section title="What I'm listening to">
          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
            {spotify.albumArt && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={spotify.albumArt}
                alt={spotify.album}
                width={72}
                height={72}
                style={{ borderRadius: 6 }}
              />
            )}
            <div>
              <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "#9ca3af" }}>
                {spotify.isPlaying ? "▶ playing now" : "⏸ last played"}
              </div>
              <a
                href={spotify.url}
                target="_blank"
                rel="noreferrer"
                style={{ fontSize: 18, fontWeight: 600, color: "#fafafa", textDecoration: "none" }}
              >
                {spotify.title}
              </a>
              <div style={{ fontSize: 14, color: "#9ca3af" }}>
                {spotify.artist} · {spotify.album}
              </div>
            </div>
          </div>
        </Section>
      )}

      {/* Contribution graph */}
      {contributions && (
        <Section title="Contributions">
          {/* Stats row */}
          <div
            style={{
              display: "flex",
              gap: 28,
              flexWrap: "wrap",
              marginBottom: 20,
              fontFamily: "var(--mono)",
              fontSize: 12,
            }}
          >
            <div>
              <div style={{ color: "#fef3c7", fontSize: 24, fontWeight: 700 }}>
                {contributions.totalThisYear.toLocaleString()}
              </div>
              <div style={{ color: "#6b7280", fontSize: 10, letterSpacing: 1, textTransform: "uppercase" }}>
                contributions this year
              </div>
            </div>
            <div>
              <div style={{ color: "#22c55e", fontSize: 24, fontWeight: 700 }}>
                {contributions.currentStreak}
              </div>
              <div style={{ color: "#6b7280", fontSize: 10, letterSpacing: 1, textTransform: "uppercase" }}>
                day streak
              </div>
            </div>
            <div>
              <div style={{ color: "#e5e7eb", fontSize: 24, fontWeight: 700 }}>
                {contributions.longestStreak}
              </div>
              <div style={{ color: "#6b7280", fontSize: 10, letterSpacing: 1, textTransform: "uppercase" }}>
                longest streak
              </div>
            </div>
          </div>

          {/* Graph grid */}
          <div
            style={{
              overflowX: "auto",
              paddingBottom: 8,
            }}
          >
            <ContributionGraph weeks={contributions.weeks} />
          </div>

          {/* Legend */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              marginTop: 10,
              fontFamily: "var(--mono)",
              fontSize: 10,
              color: "#6b7280",
              justifyContent: "flex-end",
            }}
          >
            <span>less</span>
            {[0, 1, 2, 3, 4].map((level) => (
              <span
                key={level}
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 2,
                  background: LEVEL_COLORS[level as 0 | 1 | 2 | 3 | 4],
                  display: "inline-block",
                }}
              />
            ))}
            <span>more</span>
          </div>
        </Section>
      )}

      {/* GitHub commits */}
      <Section title="Recent commits">
        {github ? (
          <>
            <div style={{ color: "#9ca3af", fontSize: 13, marginBottom: 14 }}>
              <span style={{ color: "#fef3c7" }}>@{github.username}</span> · {github.publicRepos} public repos · {github.followers} followers
            </div>
            {github.commits.length === 0 ? (
              <div style={{ color: "#6b7280", fontSize: 14 }}>No recent public commits.</div>
            ) : (
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {github.commits.map((c) => (
                  <li
                    key={c.url}
                    style={{
                      padding: "12px 0",
                      borderBottom: "1px solid rgba(255,255,255,0.06)",
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 16,
                    }}
                  >
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div
                        style={{
                          fontSize: 14,
                          color: "#e5e7eb",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {c.message}
                      </div>
                      <a
                        href={c.url}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          fontFamily: "var(--mono)",
                          fontSize: 11,
                          color: "#9ca3af",
                          textDecoration: "none",
                        }}
                      >
                        {c.repo} · {c.sha}
                      </a>
                    </div>
                    <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "#6b7280", whiteSpace: "nowrap" }}>
                      {timeAgo(c.when)}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </>
        ) : (
          <Placeholder label="Unable to reach GitHub right now. Try again in a minute." />
        )}
      </Section>

      <div style={{ marginTop: 60, color: "#4b5563", fontSize: 12, fontFamily: "var(--mono)" }}>
        cached server-side · revalidates every 60s
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section
      style={{
        marginBottom: 40,
        padding: 24,
        background: "rgba(17, 19, 26, 0.8)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 10,
      }}
    >
      <h2
        style={{
          fontFamily: "var(--mono)",
          fontSize: 11,
          letterSpacing: 2,
          color: "#6b7280",
          textTransform: "uppercase",
          margin: "0 0 18px",
        }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

function Placeholder({ label }: { label: string }) {
  return (
    <div
      style={{
        color: "#6b7280",
        fontSize: 13,
        fontFamily: "var(--mono)",
        padding: "8px 0",
      }}
    >
      {label}
    </div>
  );
}

// ---- Contribution graph ----

const LEVEL_COLORS: Record<0 | 1 | 2 | 3 | 4, string> = {
  0: "rgba(255,255,255,0.06)",
  1: "#0e4429",
  2: "#006d32",
  3: "#26a641",
  4: "#39d353",
};

const CELL = 11;  // px — each square
const GAP = 3;    // px — between squares

function ContributionGraph({ weeks }: { weeks: ContributionWeek[] }) {
  // The graph is 53 weeks wide × 7 rows tall (Sun–Sat).
  // We render it as an inline SVG so it stays crisp at any zoom.
  const cols = weeks.length;
  const w = cols * (CELL + GAP) - GAP;
  const h = 7 * (CELL + GAP) - GAP;

  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      style={{ display: "block" }}
      role="img"
      aria-label="GitHub contribution graph"
    >
      {weeks.map((week, col) =>
        week.days.map((day, row) => (
          <rect
            key={day.date}
            x={col * (CELL + GAP)}
            y={row * (CELL + GAP)}
            width={CELL}
            height={CELL}
            rx={2}
            ry={2}
            fill={LEVEL_COLORS[day.level]}
          >
            <title>
              {day.date}: {day.count} contribution{day.count !== 1 ? "s" : ""}
            </title>
          </rect>
        ))
      )}
    </svg>
  );
}
