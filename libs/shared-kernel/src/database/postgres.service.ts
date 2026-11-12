import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';

@Injectable()
export class PostgresService implements OnModuleDestroy {
  private readonly logger = new Logger(PostgresService.name);
  private readonly pool: Pool;

  constructor() {
    const connectionString =
      process.env.DATABASE_URL ??
      `postgresql://${process.env.POSTGRES_USER ?? 'agrosat_admin'}:${
        process.env.POSTGRES_PASSWORD ?? 'agrosat_secret_2026'
      }@${process.env.POSTGRES_HOST ?? 'localhost'}:${process.env.POSTGRES_PORT ?? '15432'}/${
        process.env.POSTGRES_DB ?? 'agrosat_db'
      }`;

    this.pool = new Pool({
      connectionString,
      max: Number(process.env.PG_POOL_MAX ?? 15),
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });

    this.pool.on('error', (err) => {
      this.logger.error(`Unexpected PostgreSQL Pool Error: ${err.message}`, err.stack);
    });
  }

  public async query<T extends QueryResultRow = QueryResultRow>(
    sql: string,
    params: unknown[] = [],
  ): Promise<QueryResult<T>> {
    return this.pool.query<T>(sql, params);
  }

  public async getClient(): Promise<PoolClient> {
    return this.pool.connect();
  }

  public async withTransaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await fn(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Emits an asynchronous notification on a PostgreSQL LISTEN/NOTIFY channel.
   */
  public async pgNotify(channel: string, payload: unknown): Promise<void> {
    const serialized = typeof payload === 'string' ? payload : JSON.stringify(payload);
    await this.pool.query('SELECT pg_notify($1, $2)', [channel, serialized]);
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool.end();
  }
}
