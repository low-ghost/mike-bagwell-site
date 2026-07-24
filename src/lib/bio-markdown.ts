/**
 * Minimal markdown for the home bio: paragraphs, *italics*, and [links](url).
 * No HTML passthrough - input is escaped first.
 */

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function isSafeHref(href: string): boolean {
  return /^(https?:\/\/|\/|#)/i.test(href.trim());
}

function renderItalics(escaped: string): string {
  return escaped.replace(/\*([^*]+)\*/g, '<em>$1</em>');
}

function renderInline(text: string): string {
  const parts: string[] = [];
  const linkRe = /\[([^\]]+)\]\(([^)\s]+)\)/g;
  let last = 0;
  let match: RegExpExecArray | null;

  while ((match = linkRe.exec(text)) !== null) {
    parts.push(renderItalics(escapeHtml(text.slice(last, match.index))));
    const label = match[1];
    const href = match[2].trim();
    if (isSafeHref(href)) {
      const external = /^https?:\/\//i.test(href);
      const attrs = external
        ? ' target="_blank" rel="noopener noreferrer"'
        : '';
      parts.push(
        `<a href="${escapeHtml(href)}"${attrs}>${renderItalics(escapeHtml(label))}</a>`
      );
    } else {
      parts.push(renderItalics(escapeHtml(match[0])));
    }
    last = match.index + match[0].length;
  }

  parts.push(renderItalics(escapeHtml(text.slice(last))));
  return parts.join('');
}

/** Convert bio markdown (paragraphs + italics + links) to safe HTML. */
export function renderBioMarkdown(markdown: string): string {
  const normalized = markdown.replace(/\r\n/g, '\n').trim();
  if (!normalized) return '';

  return normalized
    .split(/\n{2,}/)
    .map((para) => para.replace(/\n/g, ' ').trim())
    .filter(Boolean)
    .map((para) => `<p>${renderInline(para)}</p>`)
    .join('\n');
}
