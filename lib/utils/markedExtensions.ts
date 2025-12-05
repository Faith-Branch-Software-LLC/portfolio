import { marked, Tokens, TokenizerAndRendererExtension } from 'marked';
import { createHighlighter, bundledLanguages, HighlighterGeneric } from 'shiki';

// Global highlighter instance
let highlighter: HighlighterGeneric<any, any> | null = null;

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
    const content = marked.parse(token.content) as string;

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
export async function configureMarked() {
  // Initialize highlighter if not already created
  if (!highlighter) {
    highlighter = await createHighlighter({
      themes: ['github-dark'],
      langs: Object.keys(bundledLanguages)
    });
  }

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

        // Map common language aliases to Shiki language names
        const languageMap: Record<string, string> = {
          'apacheconf': 'apache',
          'sh': 'bash',
          'shell': 'bash',
          'yml': 'yaml',
          'js': 'javascript',
          'ts': 'typescript',
          'jsx': 'javascript',
          'tsx': 'typescript',
        };

        // Get the actual language name, falling back to text if not found
        let actualLang = languageMap[lang] || lang;

        // Check if the language is supported
        if (!(actualLang in bundledLanguages)) {
          actualLang = 'text';
        }

        // Use Shiki for syntax highlighting
        let highlightedCode: string;
        try {
          const highlighted = highlighter!.codeToHtml(code, {
            lang: actualLang,
            theme: 'github-dark'
          });

          // Extract the highlighted code content from Shiki's output
          // Shiki returns: <pre class="..."><code>highlighted content</code></pre>
          // We need just the highlighted <code> content
          const codeMatch = highlighted.match(/<code[^>]*>([\s\S]*?)<\/code>/);
          highlightedCode = codeMatch ? codeMatch[1] : code;
        } catch (error) {
          // Fallback to plain code if Shiki fails
          console.warn(`Shiki highlighting failed for language: ${actualLang}`, error);
          highlightedCode = code
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
        }

        // Encode code for the copy button using base64 to preserve all characters
        const encodedCode = Buffer.from(code).toString('base64');

        // Generate line numbers
        const lines = code.split('\n');
        const lineNumbers = lines.map((_: string, i: number) => `<span>${i + 1}</span>`).join('');

        return `<div class="code-block-wrapper">
  <div class="code-block-header">
    <span class="code-block-language">${lang.toUpperCase()}</span>
    <button class="code-copy-button" data-code="${encodedCode}" aria-label="Copy code to clipboard">Copy</button>
  </div>
  <div class="code-block-content">
    <div class="code-line-numbers" aria-hidden="true">${lineNumbers}</div>
    <pre><code class="language-${lang}">${highlightedCode}</code></pre>
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
