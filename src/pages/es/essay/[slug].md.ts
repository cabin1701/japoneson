import type { APIContext } from 'astro';
import { getCollection } from 'astro:content';
import { articleMarkdown, markdownResponse } from '../../../lib/markdown';

export async function getStaticPaths() {
  const posts = await getCollection('essay', ({ data }) => data.lang === 'es' && !data.draft);
  return posts.map((post) => ({
    params: { slug: post.id.replace(/^(en|es)\//, '') },
    props: { post },
  }));
}

export const GET = ({ props, params }: APIContext) => {
  const { post } = props as { post: Awaited<ReturnType<typeof getCollection<'essay'>>>[number] };
  return markdownResponse(
    articleMarkdown(`https://japoneson.com/es/essay/${params.slug}/`, post.data, post.body),
  );
};
