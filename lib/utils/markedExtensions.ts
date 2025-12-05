import { marked, Tokens, TokenizerAndRendererExtension } from 'marked';

/**
 * Icon mapping for Obsidian callout types
 */
const CALLOUT_ICONS: Record<string, string> = {
  note: '📝',
  caution: '⚠️',
  warning: '⚠️',
  tip: '💡',
  info: 'ℹ️',
  success: '✅',
  danger: '🚫'
};

/**
 * Custom Obsidian callout renderer
 * Supports syntax: > [!type] Optional Title
 */
export const calloutExtension: TokenizerAndRendererExtension = {
  name: 'callout',
  level: 'block',
  start(src: string) {
    return src.match(/^>\s*\[!/)?.index;
  },
  tokenizer(src: string) {
    const match = src.match(/^>\s*\[!(note|caution|warning|tip|info|success|danger)\]([^\n]*)\n((?:>[^\n]*\n?)*)/i);
    if (match) {
      const type = match[1].toLowerCase();
      const title = match[2].trim() || type.charAt(0).toUpperCase() + type.slice(1);
      const content = match[3]
        .split('\n')
        .map(line => line.replace(/^>\s?/, ''))
        .join('\n')
        .trim();

      return {
        type: 'callout',
        raw: match[0],
        calloutType: type,
        title: title,
        content: content
      };
    }
    return undefined;
  },
  renderer(token: any) {
    const type = token.calloutType;
    const icon = CALLOUT_ICONS[type] || CALLOUT_ICONS.note;
    const title = token.title;
    const content = marked.parse(token.content, { async: false }) as string;

    return `<div class="callout callout-${type}">
  <div class="callout-header">
    <span class="callout-icon">${icon}</span>
    <span class="callout-title">${title}</span>
  </div>
  <div class="callout-content">${content}</div>
</div>`;
  }
};

/**
 * Configure marked with custom extensions and renderers
 */
export function configureMarked() {
  // First add custom extensions for new token types (like callouts)
  marked.use({
    extensions: [calloutExtension]
  });

  // Then override built-in renderers for code blocks and inline code
  marked.use({
    renderer: {
      code(token: any) {
        const lang = token.lang || 'text';
        const code = token.text;
        const escapedCode = code
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#039;');

        // Split code into lines for line numbers
        const lines = escapedCode.split('\n');
        const lineNumbers = lines.map((_, i) => `<span>${i + 1}</span>`).join('');
        const codeLines = lines.map(line => line || ' ').join('\n');

        return `<div class="code-block-wrapper">
  <div class="code-block-header">
    <span class="code-block-language">${lang.toUpperCase()}</span>
    <button class="code-copy-button" data-code="${escapedCode}" aria-label="Copy code to clipboard">Copy</button>
  </div>
  <div class="code-block-content">
    <div class="code-line-numbers" aria-hidden="true">${lineNumbers}</div>
    <pre><code class="language-${lang}">${codeLines}</code></pre>
  </div>
</div>`;
      },
      codespan(token: any) {
        const code = token.text
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#039;');
        return `<code>${code}</code>`;
      }
    }
  });
}
