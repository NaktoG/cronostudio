export type ScriptExportPayload = {
  title: string;
  intro?: string | null;
  body?: string | null;
  cta?: string | null;
  outro?: string | null;
};

export function buildScriptMarkdown(payload: ScriptExportPayload): string {
  const parts = [
    `# ${payload.title}`,
    payload.intro ? `\n## Intro\n${payload.intro}` : '',
    payload.body ? `\n## Cuerpo\n${payload.body}` : '',
    payload.cta ? `\n## CTA\n${payload.cta}` : '',
    payload.outro ? `\n## Outro\n${payload.outro}` : '',
  ].filter(Boolean);
  return parts.join('\n');
}

export async function copyScriptToClipboard(payload: ScriptExportPayload): Promise<void> {
  const markdown = buildScriptMarkdown(payload);
  await navigator.clipboard.writeText(markdown);
}

export function downloadScriptMarkdown(payload: ScriptExportPayload): void {
  const markdown = buildScriptMarkdown(payload);
  const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${payload.title?.trim() || 'guion'}.md`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(link.href);
}

export function exportScriptToPdf(payload: ScriptExportPayload): boolean {
  const markdown = buildScriptMarkdown(payload);
  const win = window.open('', '_blank');
  if (!win) return false;
  win.document.write(`<!doctype html><html><head><title>${payload.title || 'Guion'}</title>`);
  win.document.write('<meta charset="utf-8" />');
  win.document.write('<style>body{font-family:Arial,sans-serif;white-space:pre-wrap;padding:24px;}</style>');
  win.document.write(`</head><body>${markdown.replace(/</g, '&lt;')}</body></html>`);
  win.document.close();
  win.focus();
  win.print();
  return true;
}
