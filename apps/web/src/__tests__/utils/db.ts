import type { QueryResult, FieldDef, QueryResultRow } from 'pg';

export function makeQueryResult<T extends QueryResultRow>(rows: T[]): QueryResult<T> {
  return {
    command: 'SELECT',
    rowCount: rows.length,
    oid: 0,
    rows,
    fields: [] as FieldDef[],
  };
}
