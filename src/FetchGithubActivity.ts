import { config } from "./config.js";

export interface ActivityItem {
  type: "commit" | "pull_request" | "issue_closed";
  title: string;
  url: string;
  date: string;
}

interface GithubSearchResponse {
  items: Array<{
    title: string;
    html_url: string;
    created_at: string;
    closed_at?: string;
    commit: {
      message: string;
      committer: {
        date: string;
      };
    };
  }>;
}

function githubHeaders() {
  return {
    Authorization: `Bearer ${config.githubToken}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

function getDateDaysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split("T")[0]!; // e.g. "2026-09-08"
}

async function fetchPullRequests(since: string): Promise<ActivityItem[]> {
  const query = `author:${config.githubUsername} created:>=${since} type:pr`;
  const url = `https://api.github.com/search/issues?q=${encodeURIComponent(query)}`;

  const response = await fetch(url, { headers: githubHeaders() });

  if (!response.ok) {
    console.error("[fetchPullRequests] GitHub API error:", response.status, await response.text());
    return []; // Fail soft — one data source failing shouldn't crash the whole tool
  }

  const data = (await response.json()) as GithubSearchResponse;
  return data.items.map((item: any) => ({
    type: "pull_request" as const,
    title: item.title,
    url: item.html_url,
    date: item.created_at,
  }));
}

async function fetchClosedIssues(since: string): Promise<ActivityItem[]> {
  const query = `author:${config.githubUsername} closed:>=${since} type:issue`;
  const url = `https://api.github.com/search/issues?q=${encodeURIComponent(query)}`;

  const response = await fetch(url, { headers: githubHeaders() });

  if (!response.ok) {
    console.error("[fetchClosedIssues] GitHub API error:", response.status, await response.text());
    return [];
  }

  const data = (await response.json()) as GithubSearchResponse;
  return data.items.map((item: any) => ({
    type: "issue_closed" as const,
    title: item.title,
    url: item.html_url,
    date: item.closed_at,
  }));
}

async function fetchCommits(since: string): Promise<ActivityItem[]> {
  const query = `author:${config.githubUsername} committer-date:>=${since}`;
  const url = `https://api.github.com/search/commits?q=${encodeURIComponent(query)}`;

  const response = await fetch(url, { headers: githubHeaders() });

  if (!response.ok) {
    console.error("[fetchCommits] GitHub API error:", response.status, await response.text());
    return [];
  }

  const data = (await response.json()) as GithubSearchResponse;
  return data.items.map((item: any) => ({
    type: "commit" as const,
    title: item.commit.message.split("\n")[0], // first line of the commit message
    url: item.html_url,
    date: item.commit.committer.date,
  }));
}

/**
 * Fetches pull requests, closed issues, and commits for the last `daysBack`
 * days, all in parallel (they don't depend on each other, so there's no
 * reason to wait for one before starting the next).
 */
export async function fetchGithubActivity(daysBack: number = 7): Promise<ActivityItem[]> {
  const since = getDateDaysAgo(daysBack);

  const [prs, issues, commits] = await Promise.all([
    fetchPullRequests(since),
    fetchClosedIssues(since),
    fetchCommits(since),
  ]);

  return [...prs, ...issues, ...commits];
}