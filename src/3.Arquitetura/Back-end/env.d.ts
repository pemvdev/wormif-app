// Extend the Env interface to include app secrets
declare global {
  interface Env {
    OPENAI_API_KEY: string;
  }
}

export {};
