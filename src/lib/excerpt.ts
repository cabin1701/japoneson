/**
 * 記事本文から meta description / og:description 用の抜粋を作る。
 *
 * frontmatter の excerpt が無い記事（2026-07 時点で ja 1295 本すべて）は、
 * これまで全ページ共通の既定文が入っていた。SNS に貼った時に
 * どの記事も同じ説明文になるため、本文の冒頭から生成する。
 */
export function deriveExcerpt(body: string | undefined, maxLen = 110): string | undefined {
  if (!body) return undefined;

  const text = body
    // 画像・リンク
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    // HTML タグ
    .replace(/<[^>]+>/g, '')
    // コードブロック
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`([^`]*)`/g, '$1')
    // 見出し・引用・リスト・水平線の記号
    .replace(/^\s{0,3}#{1,6}\s+/gm, '')
    .replace(/^\s{0,3}>\s?/gm, '')
    .replace(/^\s{0,3}[-*+]\s+/gm, '')
    .replace(/^\s{0,3}(-{3,}|\*{3,}|_{3,})\s*$/gm, '')
    // 強調記号
    .replace(/\*\*([^*]*)\*\*/g, '$1')
    .replace(/\*([^*]*)\*/g, '$1')
    .replace(/__([^_]*)__/g, '$1')
    // 空白の整理
    .replace(/\s+/g, ' ')
    .trim();

  if (!text) return undefined;
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen).trimEnd() + '…';
}
