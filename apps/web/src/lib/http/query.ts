type IntOptions = {
  min?: number;
  max?: number;
  defaultValue?: number;
  required?: boolean;
};

type StringOptions = {
  maxLen?: number;
  defaultValue?: string;
  required?: boolean;
};

export function getInt(
  searchParams: URLSearchParams,
  key: string,
  options: IntOptions = {}
): number | null {
  const raw = searchParams.get(key);
  if (raw === null || raw.trim() === '') {
    if (options.required) return null;
    return options.defaultValue ?? null;
  }

  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed)) return null;
  if (options.min !== undefined && parsed < options.min) return null;
  if (options.max !== undefined && parsed > options.max) return null;
  return parsed;
}

export function getString(
  searchParams: URLSearchParams,
  key: string,
  options: StringOptions = {}
): string | null {
  const raw = searchParams.get(key);
  if (raw === null || raw.trim() === '') {
    if (options.required) return null;
    return options.defaultValue ?? null;
  }

  const value = raw.trim();
  if (options.maxLen !== undefined && value.length > options.maxLen) return null;
  return value;
}
