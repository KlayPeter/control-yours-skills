declare module "better-sqlite3" {
  interface RunResult {
    changes: number;
    lastInsertRowid: number | bigint;
  }

  interface Statement<Result = unknown> {
    run(...params: unknown[]): RunResult;
    get(...params: unknown[]): Result;
    all(...params: unknown[]): Result[];
  }

  interface DatabaseInstance {
    exec(sql: string): this;
    pragma(sql: string): unknown;
    prepare<Result = unknown>(sql: string): Statement<Result>;
  }

  interface DatabaseConstructor {
    new (filename: string): DatabaseInstance;
  }

  const Database: DatabaseConstructor;

  namespace Database {
    type Database = DatabaseInstance;
  }

  export = Database;
}
