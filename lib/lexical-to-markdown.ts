type LexicalNode = {
  type: string;
  text?: string;
  format?: number;
  tag?: string;
  listType?: string;
  value?: number;
  language?: string;
  children?: LexicalNode[];
  url?: string;
  fields?: { url?: string; newTab?: boolean };
  [key: string]: unknown;
};

const FORMAT_BOLD = 1;
const FORMAT_ITALIC = 2;
const FORMAT_STRIKETHROUGH = 4;
const FORMAT_CODE = 16;

function serializeText(node: LexicalNode): string {
  let text = node.text ?? '';
  if (!text) return '';
  const fmt = node.format ?? 0;
  if (fmt & FORMAT_CODE) return `\`${text}\``;
  if (fmt & FORMAT_BOLD) text = `**${text}**`;
  if (fmt & FORMAT_ITALIC) text = `_${text}_`;
  if (fmt & FORMAT_STRIKETHROUGH) text = `~~${text}~~`;
  return text;
}

export function serializeNodes(nodes: LexicalNode[], listIndent = 0): string {
  let out = '';
  for (const node of nodes) {
    switch (node.type) {
      case 'text':
        out += serializeText(node);
        break;
      case 'linebreak':
        out += '\n';
        break;
      case 'paragraph': {
        const inner = serializeNodes(node.children ?? []);
        if (inner.trim()) out += inner + '\n\n';
        break;
      }
      case 'heading': {
        const level = Number((node.tag ?? 'h2').replace('h', ''));
        const inner = serializeNodes(node.children ?? []).trim();
        out += `${'#'.repeat(level)} ${inner}\n\n`;
        break;
      }
      case 'list':
        out += serializeNodes(node.children ?? [], listIndent);
        out += '\n';
        break;
      case 'listitem': {
        const ordered = node.listType === 'number';
        const prefix = '  '.repeat(listIndent) + (ordered ? `${node.value ?? 1}. ` : '- ');
        const inner = serializeNodes(node.children ?? [], listIndent + 1).trim();
        out += `${prefix}${inner}\n`;
        break;
      }
      case 'quote': {
        const inner = serializeNodes(node.children ?? []);
        out += inner
          .trim()
          .split('\n')
          .map((l) => `> ${l}`)
          .join('\n') + '\n\n';
        break;
      }
      case 'code': {
        const lang = (node.language as string) ?? '';
        out += `\`\`\`${lang}\n${node.text ?? ''}\n\`\`\`\n\n`;
        break;
      }
      case 'link': {
        const href = node.fields?.url ?? node.url ?? '#';
        const inner = serializeNodes(node.children ?? []).trim();
        out += `[${inner}](${href})`;
        break;
      }
      case 'horizontalrule':
        out += '---\n\n';
        break;
      default:
        if (node.children) out += serializeNodes(node.children, listIndent);
        break;
    }
  }
  return out;
}

export function lexicalToMarkdown(data: unknown): string {
  if (!data || typeof data !== 'object') return '';
  const root = (data as { root?: LexicalNode }).root;
  if (!root?.children) return '';
  return serializeNodes(root.children).trim();
}
