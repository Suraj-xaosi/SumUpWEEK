import { config } from "./config.js";
import { terminalColors as colors } from "./TerminalColors.js";

export interface ActivityItem {
  type: "commit" | "pull_request" | "issue_closed";
  title: string;
  url: string;
  date: string;
  details?: string;
}

interface GithubSearchIssuesResponse {
  items: Array<{
    title: string;
    html_url: string;
    created_at: string;
    closed_at?: string;
    body?: string | null;
  }>;
}

interface GithubSearchCommitsResponse {
  items: Array<{
    sha: string;
    html_url: string;
    repository: { full_name: string };
    commit: {
      message: string;
      committer: { date: string };
    };
  }>;
}

interface GithubCommitDetailsResponse {
  files?: Array<{
    filename: string;
    status: string;
    additions: number;
    deletions: number;
    patch?: string;
  }>;
}

const MAX_DETAILED_COMMITS = 10;
const MAX_COMMIT_DETAILS_LENGTH = 900;
const MAX_PATCH_LENGTH_PER_FILE = 350;
const DETAIL_CONCURRENCY = 5;

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
  return date.toISOString().split("T")[0]!;
}

async function fetchGithubJson<T>(url: string, source: string): Promise<T | undefined> {
  try {
    const response = await fetch(url, { headers: githubHeaders() });
    if (!response.ok) {
      console.error(colors.error(`[${source}] GitHub API error:`), response.status, await response.text());
      return undefined;
    }
    return (await response.json()) as T;
  } catch (error) {
    console.error(
      colors.error(`[${source}] GitHub request failed:`),
      error instanceof Error ? error.message : String(error)
    );
    return undefined;
  }
}

function clip(text: string, maxLength: number): string {
  return text.length > maxLength ? `${text.slice(0, maxLength)}…` : text;
}

function formatCommitDetails(data: GithubCommitDetailsResponse): string {
  const files = (data.files ?? []).filter((file) => !file.filename.toLowerCase().endsWith(".md"));
  if (files.length === 0) {
    return "";
  }

  let remaining = MAX_COMMIT_DETAILS_LENGTH;
  const parts: string[] = ["Changed files (Markdown-only changes omitted):"];

  for (const file of files) {
    const fileSummary = `- ${file.filename} (${file.status}, +${file.additions}/-${file.deletions})`;
    if (fileSummary.length >= remaining) {
      parts.push("…additional files omitted");
      break;
    }
    parts.push(fileSummary);
    remaining -= fileSummary.length;

    if (file.patch && remaining > 80) {
      const patch = clip(file.patch, Math.min(MAX_PATCH_LENGTH_PER_FILE, remaining - 20));
      parts.push(`  Diff excerpt:\n${patch}`);
      remaining -= patch.length;
    }

    if (remaining <= 80) {
      parts.push("…remaining diff omitted");
      break;
    }
  }

  return parts.join("\n");
}

async function fetchCommitDetails(
  repository: string,
  sha: string
): Promise<string | undefined> {
  const [owner, repo] = repository.split("/");
  if (!owner || !repo) {
    return undefined;
  }

  const url = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/commits/${encodeURIComponent(sha)}`;
  const data = await fetchGithubJson<GithubCommitDetailsResponse>(url, "fetchCommitDetails");
  return data ? formatCommitDetails(data) : undefined;
}

async function fetchPullRequests(since: string): Promise<ActivityItem[]> {
  const query = `author:${config.githubUsername} created:>=${since} type:pr`;
  const url = `https://api.github.com/search/issues?q=${encodeURIComponent(query)}&per_page=100`;
  const data = await fetchGithubJson<GithubSearchIssuesResponse>(url, "fetchPullRequests");

  return (data?.items ?? []).map((item) => ({
    type: "pull_request",
    title: item.title,
    url: item.html_url,
    date: item.created_at,
    details: item.body ? clip(item.body, 1000) : undefined,
  }));
}

async function fetchClosedIssues(since: string): Promise<ActivityItem[]> {
  const query = `author:${config.githubUsername} closed:>=${since} type:issue`;
  const url = `https://api.github.com/search/issues?q=${encodeURIComponent(query)}&per_page=100`;
  const data = await fetchGithubJson<GithubSearchIssuesResponse>(url, "fetchClosedIssues");

  return (data?.items ?? []).map((item) => ({
    type: "issue_closed",
    title: item.title,
    url: item.html_url,
    date: item.closed_at ?? item.created_at,
    details: item.body ? clip(item.body, 1000) : undefined,
  }));
}

async function fetchCommits(since: string): Promise<ActivityItem[]> {
  const query = `author:${config.githubUsername} committer-date:>=${since}`;
  const url = `https://api.github.com/search/commits?q=${encodeURIComponent(query)}&sort=committer-date&order=desc&per_page=100`;
  const data = await fetchGithubJson<GithubSearchCommitsResponse>(url, "fetchCommits");
  const commits = data?.items ?? [];
  const activity: ActivityItem[] = commits.map((item) => ({
    type: "commit",
    title: item.commit.message.split("\n")[0] ?? item.commit.message,
    url: item.html_url,
    date: item.commit.committer.date,
  }));

  for (let start = 0; start < Math.min(commits.length, MAX_DETAILED_COMMITS); start += DETAIL_CONCURRENCY) {
    const batch = commits.slice(start, start + DETAIL_CONCURRENCY);
    const details = await Promise.all(
      batch.map((item) => fetchCommitDetails(item.repository.full_name, item.sha))
    );
    details.forEach((detail, index) => {
      if (detail) {
        activity[start + index]!.details = detail;
      }
    });
  }

  return activity;
}

/**
 * Fetches GitHub activity and enriches recent commits with bounded diff
 * excerpts, keeping the amount of code sent to the report model limited.
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
