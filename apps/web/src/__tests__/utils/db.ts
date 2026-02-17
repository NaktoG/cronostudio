import type { QueryResult, FieldDef } from 'pg';

export function makeQueryResult<T>(rows: T[]): QueryResult<T> {
  return {
    command: 'SELECT',
    rowCount: rows.length,
    oid: 0,
    rows,
    fields: [] as FieldDef[],
  };
}
