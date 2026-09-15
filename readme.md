# Weekly Dev Report Generator

A small command-line tool that looks at your GitHub activity for the past
week (commits, pull requests, closed issues), optionally combines it with
notes you type in yourself, and uses a free AI model to write a clean
weekly summary for you — ready to paste into a standup, a status update,
or a LinkedIn post.
It also creates report history in markdown file (reportHistory.md) contains all the repot in markdown formatt. 

It can even try to match **your own writing style**, if you give it a few
examples of things you've written before.

No coding experience is required to use this — just follow the steps
below in order. It should take about 10 minutes the first time.

---

## What you'll need before starting

1. **Node.js** installed on your computer (version 18 or newer).
   - Check if you already have it: open a terminal and type `node -v`.
   - If you don't have it, download it from [nodejs.org](https://nodejs.org) (choose the "LTS" version) and install it like any other program.
2. **Git** installed (to download this project).
   - Check: type `git -v` in your terminal.
   - If missing, download from [git-scm.com](https://git-scm.com).
3. A **free Groq account** (this is the AI model the tool uses — no credit card needed).
4. A **GitHub account** (you probably already have one if you're using this tool).

---

## Step 1 — Download this project

Open a terminal (on Windows: "Command Prompt" or "PowerShell"; on Mac: "Terminal") and run:

```bash
git clone <the repository URL you were given>
cd dev-weekly-agent
```

## Step 2 — Install the project's dependencies

Still in the terminal, inside the `dev-weekly-agent` folder, run:

```bash
npm install
```

This downloads a few small packages the tool needs. It's normal for this to take a minute.

## Step 3 — Get your Groq API key (free)

1. Go to [console.groq.com](https://console.groq.com) and sign in (Google or GitHub sign-in works).
2. On the left sidebar, click **API Keys**.
3. Click **Create API Key**, give it any name, and copy the key it shows you (it starts with `gsk_...`).
   - Keep this window open — you'll paste this key in Step 5.

## Step 4 — Get your GitHub token

1. Go to [github.com/settings/personal-access-tokens](https://github.com/settings/personal-access-tokens).
2. Click **Generate new token** → **Fine-grained token**.
3. Give it a name (e.g. "weekly-report-tool").
4. Under **Repository access**, choose the repositories you want the tool to be able to read from (or "All repositories" if you're comfortable with that).
5. Under **Permissions**, only grant **Read-only** access to:
   - Contents
   - Issues
   - Pull requests
6. Click **Generate token** and copy it (it starts with `github_pat_...`).

> This tool only ever *reads* your GitHub activity — it never creates, edits, or deletes anything. That's why read-only access is all it needs.

## Step 5 — Set up your configuration file

In the project folder, copy the example environment file:

```bash
# On Mac/Linux:
cp .env.example .env

# On Windows (Command Prompt):
copy .env.example .env
```

Now open the new `.env` file in any text editor (Notepad, VS Code, etc.) and fill in the three values you collected:

```
GROQ_API_KEY=gsk_your_key_here
GITHUB_TOKEN=github_pat_your_token_here
GITHUB_USERNAME=your-github-username
```

Save the file.

> **Important:** never share this `.env` file with anyone, and never upload it anywhere (it's already set up so Git will ignore it automatically).

## Step 6 — (Optional) Personalize your writing style

If you'd like the summary to sound like *you* instead of a generic AI voice, do this:

```bash
# On Mac/Linux:
cp src/voiceExamples.example.ts src/voiceExamples.ts

# On Windows (Command Prompt):
copy src\voiceExamples.example.ts src\voiceExamples.ts
```

Open the new `src/voiceExamples.ts` file and paste in 5-8 examples of things you've written before (old standup messages, LinkedIn posts, Slack updates — anything in your own voice). Save the file.

**You can skip this step entirely.** If you don't create this file, the tool still works — it will just write in a neutral, professional tone instead of your personal one.

## Step 7 — Run it

```bash
npm run report
```

The tool will:
1. Fetch your GitHub activity from the last 7 days
2. Ask if you'd like to add anything else manually (type `y` or `n`)
3. Generate your summary
4. Show it in the terminal, save it to a file like `report-2026-09-15.txt`, and copy it to your clipboard

Just paste it (Ctrl+V / Cmd+V) wherever you need it.

---

## Troubleshooting

**"Missing environment variable: GROQ_API_KEY"**
You haven't filled in your `.env` file correctly — go back to Step 5.

**"LLM call failed: 401 ..."**
Your Groq API key is wrong or has been revoked — generate a new one (Step 3) and update your `.env` file.

**"GitHub API error: 401 ..." printed in the terminal, but the tool keeps running**
This is expected behavior — your GitHub token might be wrong, but the tool is designed to keep working using whatever data it *can* get (including your manual notes) rather than stopping completely. Double-check your token in Step 4 if you want GitHub data included.

**"LLM call failed: 429 ..."**
You've hit Groq's free-tier rate limit. Wait a minute and try again.

**Cannot find module './voiceExamples'**
If you started Step 6 but didn't finish it (or deleted the file), either finish copying the example file, or copy it again exactly as shown in Step 6.

---

## Is this safe? Where do my keys go?

This tool runs entirely on your own computer. Your Groq key and GitHub token are read from your local `.env` file and used only to call Groq's and GitHub's official APIs directly — you can see this yourself by opening `src/callLLM.ts` and `src/fetchGithubActivity.ts`; there is no third-party server anywhere in between. Nothing you type or paste is sent anywhere except to Groq (for the AI summary) and GitHub (to read your activity).

---

## For developers — running the eval suite

If you're modifying the code, there's a small test suite that checks a few key behaviors still work:

```bash
npm run eval
```
