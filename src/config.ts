import "dotenv/config"; // Loads variables from the ".env" file into process.env

// All secrets/config live in one place, similar to how a real production
// app keeps a single "env.ts" file instead of scattering process.env
// reads across the codebase.
export const config = {
  groqApiKey: process.env.GROQ_API_KEY as string,
  githubToken: process.env.GITHUB_TOKEN as string,
  githubUsername: process.env.GITHUB_USERNAME as string,
};

// Fail fast: if something is missing, stop immediately with a clear
// message instead of letting a confusing error appear later deep inside
// an API call.
function validateConfig() {
  for (const [key, value] of Object.entries(config)) {
    if (!value) {
      throw new Error(
        `Missing environment variable: ${key}.\n` +
          `Did you copy ".env.example" to ".env" and fill in your values?`
      );
    }
  }
}

validateConfig();