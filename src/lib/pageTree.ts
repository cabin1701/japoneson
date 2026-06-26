import type { CollectionEntry } from 'astro:content';

type Entry = CollectionEntry<'en'>;

export function buildPath(entry: Entry, all: Entry[]): string {
  // Walk up the wp_parent chain to build the URL segments
  const byId = new Map<string, Entry>();
  for (const e of all) {
    const id = String(e.data.wp_id ?? '');
    if (id) byId.set(id, e);
  }

  const segments: string[] = [];
  let current: Entry | undefined = entry;
  const guard = new Set<string>();
  while (current) {
    segments.unshift(current.data.slug);
    const pid = String(current.data.wp_parent ?? '0');
    if (pid === '0' || guard.has(pid)) break;
    guard.add(pid);
    current = byId.get(pid);
  }
  return segments.join('/');
}

export function buildBreadcrumb(entry: Entry, all: Entry[], base: string = '/'): { slug: string; title: string; path: string }[] {
  const byId = new Map<string, Entry>();
  for (const e of all) {
    const id = String(e.data.wp_id ?? '');
    if (id) byId.set(id, e);
  }

  const chain: Entry[] = [];
  let current: Entry | undefined = entry;
  const guard = new Set<string>();
  while (current) {
    chain.unshift(current);
    const pid = String(current.data.wp_parent ?? '0');
    if (pid === '0' || guard.has(pid)) break;
    guard.add(pid);
    current = byId.get(pid);
  }

  const prefix = base.replace(/\/$/, '');
  return chain.map((e, i) => ({
    slug: e.data.slug,
    title: e.data.title,
    path: `${prefix}/en/` + chain.slice(0, i + 1).map((x) => x.data.slug).join('/') + '/',
  }));
}
