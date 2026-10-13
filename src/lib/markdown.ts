// 記事を Markdown（.md）で出すための共通の関数。先頭の項目は、記事の元の項目（frontmatter）をそのまま使う。
// URL の後ろに .md を付けると読める（例：/frankie-sleep/ → /frankie-sleep.md）。
export function toYaml(data: Record<string, unknown>): string {
  const lines: string[] = [];
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined || value === null || key === 'draft') continue;
    lines.push(`${key}: ${value instanceof Date ? value.toISOString() : JSON.stringify(value)}`);
  }
  return lines.join('\n');
}

export function articleMarkdown(canonicalUrl: string, data: Record<string, unknown>, body: string | undefined) {
  return `---\ncanonical_url: ${JSON.stringify(canonicalUrl)}\n${toYaml(data)}\n---\n\n${(body ?? '').trim()}\n`;
}

export function markdownResponse(text: string) {
  return new Response(text, { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } });
}
