// Extend the Env interface to include app secrets
declare global {
  interface Env {
    DB: D1Database;
    OPENAI_API_KEY: string;
  }
}

export {};
