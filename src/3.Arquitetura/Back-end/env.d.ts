// Extend the Env interface to include app secrets
declare global {
  interface Env {
    GEMINI_API_KEY: string;
  }
}

export {};
