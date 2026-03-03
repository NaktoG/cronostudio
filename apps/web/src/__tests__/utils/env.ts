type EnvVars = Record<string, string | undefined>;

export async function withEnv(vars: EnvVars, fn: () => Promise<void>): Promise<void> {
  const original = { ...process.env };
  try {
    for (const [key, value] of Object.entries(vars)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
    await fn();
  } finally {
    process.env = original;
  }
}
