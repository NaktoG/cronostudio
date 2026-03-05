export type SeoItem = {
  id: string;
  title: string;
  description: string;
  tags: string[];
};

export function buildSeoClipboardPayload(items: SeoItem[], type: 'title' | 'description' | 'tags'): string {
  if (type === 'tags') {
    return items
      .flatMap((item) => item.tags || [])
      .join(', ');
  }
  if (type === 'description') {
    return items.map((item) => item.description).filter(Boolean).join('\n\n');
  }
  return items.map((item) => item.title).filter(Boolean).join('\n');
}
