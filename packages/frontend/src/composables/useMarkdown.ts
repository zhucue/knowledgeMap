import { computed, type Ref } from 'vue';
import { Marked } from 'marked';
import hljs from 'highlight.js/lib/core';

// 按需注册常用语言
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import python from 'highlight.js/lib/languages/python';
import java from 'highlight.js/lib/languages/java';
import sql from 'highlight.js/lib/languages/sql';
import json from 'highlight.js/lib/languages/json';
import bash from 'highlight.js/lib/languages/bash';
import css from 'highlight.js/lib/languages/css';
import xml from 'highlight.js/lib/languages/xml';

hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('js', javascript);
hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('ts', typescript);
hljs.registerLanguage('python', python);
hljs.registerLanguage('java', java);
hljs.registerLanguage('sql', sql);
hljs.registerLanguage('json', json);
hljs.registerLanguage('bash', bash);
hljs.registerLanguage('shell', bash);
hljs.registerLanguage('css', css);
hljs.registerLanguage('html', xml);
hljs.registerLanguage('xml', xml);

/** 转义 HTML 特殊字符 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// 配置 marked 实例
const marked = new Marked({
  gfm: true,
  breaks: true,
});

// 自定义渲染器：为代码块添加语言标签和复制按钮
marked.use({
  renderer: {
    code({ text, lang }) {
      const language = lang && hljs.getLanguage(lang) ? lang : '';
      const displayLang = language || 'text';

      let highlighted: string;
      if (language) {
        highlighted = hljs.highlight(text, { language }).value;
      } else {
        highlighted = escapeHtml(text);
      }

      return `<div class="code-block">
        <div class="code-block-header">
          <span class="code-lang">${displayLang}</span>
          <button class="copy-btn" type="button">复制</button>
        </div>
        <pre><code class="hljs${language ? ` language-${language}` : ''}">${highlighted}</code></pre>
      </div>`;
    },
  },
});

/**
 * Markdown 渲染组合式函数
 * @param content - 响应式内容字符串
 * @returns 渲染后的 HTML computed
 */
export function useMarkdown(content: Ref<string>) {
  const renderedHtml = computed(() => {
    const raw = content.value;
    if (!raw) return '';

    try {
      return marked.parse(raw) as string;
    } catch {
      // 流式输出中 Markdown 可能不完整，降级为转义文本
      return escapeHtml(raw).replace(/\n/g, '<br>');
    }
  });

  return { renderedHtml };
}
