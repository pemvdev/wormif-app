// Extend the Env interface to include app secrets
declare global {
  interface Env {
    DB: D1Database;
    R2_BUCKET: R2Bucket;
    OPENAI_API_KEY: string;
  }
}

export {};
