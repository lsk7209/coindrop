/**
 * Cloudflare Workers 환경 변수 타입 정의
 */

export interface Env {
  // D1 Database
  DB: D1Database;
  
  // R2 Buckets
  R2_CONTENTS: R2Bucket;
  R2_BACKUPS: R2Bucket;
  
  // KV Namespaces
  KV_CACHE: KVNamespace;
  
  // Queues
  q: Queue;
  
  // Environment Variables
  ENVIRONMENT: string;
  SCHEMA_VERSION: string;
  DEFAULT_CACHE_TTL_DETAIL: string;
  DEFAULT_CACHE_TTL_LIST: string;
  DEFAULT_CACHE_TTL_SITEMAP: string;
  
  // Secrets
  OPENAI_API_KEY?: string;
  RESEND_API_KEY?: string;
  SENTRY_DSN?: string;
  MAKE_WEBHOOK_URL?: string;
  TELEGRAM_BOT_TOKEN?: string;
  TELEGRAM_CHAT_ID?: string;
}

declare global {
  interface KVNamespace {
    get(key: string): Promise<string | null>;
    put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
    delete(key: string): Promise<void>;
    list(options?: { prefix?: string }): Promise<{ keys: Array<{ name: string }> }>;
  }
  
  interface R2Bucket {
    get(key: string): Promise<R2Object | null>;
    put(key: string, value: ReadableStream | ArrayBuffer | ArrayBufferView | string, options?: R2PutOptions): Promise<R2Object>;
    delete(keys: string | string[]): Promise<void>;
  }
  
  interface R2Object {
    key: string;
    size: number;
    etag: string;
    uploaded: Date;
    httpEtag: string;
    checksums: R2Checksums;
    httpMetadata?: R2HTTPMetadata;
    customMetadata?: Record<string, string>;
    body?: ReadableStream;
    bodyUsed?: boolean;
    arrayBuffer(): Promise<ArrayBuffer>;
    text(): Promise<string>;
    json<T = any>(): Promise<T>;
  }
  
  interface R2PutOptions {
    httpMetadata?: R2HTTPMetadata;
    customMetadata?: Record<string, string>;
  }
  
  interface R2HTTPMetadata {
    contentType?: string;
    contentLanguage?: string;
    contentDisposition?: string;
    contentEncoding?: string;
    cacheControl?: string;
    cacheExpiry?: Date;
  }
  
  interface R2Checksums {
    md5?: ArrayBuffer;
    sha1?: ArrayBuffer;
    sha256?: ArrayBuffer;
    sha384?: ArrayBuffer;
    sha512?: ArrayBuffer;
  }
  
  interface D1Database {
    prepare(query: string): D1PreparedStatement;
    exec(query: string): Promise<D1Result>;
    batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>;
  }
  
  interface D1PreparedStatement {
    bind(...values: unknown[]): D1PreparedStatement;
    first<T = unknown>(colName?: string): Promise<T | null>;
    run(): Promise<D1Result>;
    all<T = unknown>(): Promise<D1Result<T>>;
    raw<T = unknown>(): Promise<T[]>;
  }
  
  interface D1Result<T = unknown> {
    success: boolean;
    meta: {
      duration: number;
      rows_read: number;
      rows_written: number;
      last_row_id: number;
      changed_db: boolean;
      changes: number;
    };
    results?: T[];
    error?: string;
  }
  
  interface Queue {
    send(message: unknown, options?: { contentType?: string; delaySeconds?: number }): Promise<void>;
  }
  
  interface MessageBatch<T = unknown> {
    readonly messages: Array<Message<T>>;
    ackAll(): void;
    retryAll(): void;
  }
  
  interface Message<T = unknown> {
    readonly id: string;
    readonly timestamp: Date;
    readonly body: T;
    ack(): void;
    retry(options?: { delaySeconds?: number }): void;
  }
  
  interface ScheduledEvent {
    readonly scheduledTime: number;
    readonly cron: string;
  }
  
  interface ExecutionContext {
    waitUntil(promise: Promise<any>): void;
    passThroughOnException(): void;
  }
}

