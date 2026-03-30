'use client';

import React from 'react';
import type { RichTextContent } from '@/types/landing-page';

interface Node {
  type?: string;
  tag?: string;
  format?: number | string;
  text?: string;
  children?: Node[];
  url?: string;
  direction?: string;
  indent?: number;
  version?: number;
  fields?: any;
}

type Variant = 'default' | 'hero-title' | 'hero-body';

const ACCENT_FONT_CLASSES: Record<string, string> = {
  serif: 'font-serif',
  heading: '', // resolved at render time
  inter: 'font-sans',
  system: 'font-[system-ui]',
  mono: 'font-[JetBrains_Mono,monospace]',
  'space-grotesk': 'font-display',
};

interface RenderContext {
  variant: Variant;
  accentFont?: string;
  headingFont?: string;
}

function parseStyle(styleString?: string): React.CSSProperties {
  if (!styleString) return {};
  const styles: React.CSSProperties = {};
  styleString.split(';').forEach((s) => {
    const [key, value] = s.split(':');
    if (key && value) {
      const camelKey = key.trim().replaceAll(/-./g, (x) => x[1].toUpperCase());
      (styles as any)[camelKey] = value.trim();
    }
  });
  return styles;
}

function renderTextNode(node: Node, i: number, ctx: RenderContext): React.ReactNode {
  let el: React.ReactNode = node.text;
  const format = typeof node.format === 'number' ? node.format : 0;
  const style = parseStyle(node.fields?.style || (node as any).style);

  if (format & 1) el = <strong key={`b-${i}`}>{el}</strong>;

  if (format & 2) {
    if (ctx.variant === 'hero-title') {
      let accentClass = ACCENT_FONT_CLASSES[ctx.accentFont || 'serif'] || 'font-serif';
      if (ctx.accentFont === 'heading') {
        accentClass = ACCENT_FONT_CLASSES[ctx.headingFont || 'space-grotesk'] || 'font-display';
      }
      el = (
        <span key={`i-${i}`} className={`italic ${accentClass} text-neutral-600 dark:text-neutral-300 font-light`}>
          {el}
        </span>
      );
    } else {
      el = <em key={`i-${i}`}>{el}</em>;
    }
  }

  if (format & 4) el = <s key={`s-${i}`}>{el}</s>;
  if (format & 8) el = <u key={`u-${i}`}>{el}</u>;
  if (format & 16) el = <code key={`code-${i}`} className="bg-neutral-100 dark:bg-neutral-800 px-1 rounded text-sm font-mono">{el}</code>;
  if (format & 32) el = <sub key={`sub-${i}`}>{el}</sub>;
  if (format & 64) el = <sup key={`sup-${i}`}>{el}</sup>;

  if (Object.keys(style).length > 0) {
    return <span key={`style-${i}`} style={style}>{el}</span>;
  }

  return el;
}

function renderHeadingNode(node: Node, i: number, children: React.ReactNode[]): React.ReactNode {
  const tag = node.tag || 'h3';
  const classNames: Record<string, string> = {
    h1: 'text-4xl md:text-5xl font-bold mb-4',
    h2: 'text-3xl md:text-4xl font-bold mb-3',
    h3: 'text-2xl md:text-3xl font-semibold mb-2',
    h4: 'text-xl md:text-2xl font-semibold mb-2',
    h5: 'text-lg font-semibold mb-1',
    h6: 'text-base font-semibold mb-1',
  };
  const Tag = tag as React.ElementType;
  return <Tag key={`h-${i}`} className={classNames[tag] || ''}>{children}</Tag>;
}

function renderListNode(node: Node, i: number, children: React.ReactNode[]): React.ReactNode {
  const Tag = (node.tag === 'ol' ? 'ol' : 'ul') as React.ElementType;
  const className = node.tag === 'ol' ? 'list-decimal ml-6 my-4 space-y-2 text-neutral-700 dark:text-neutral-300' : 'list-disc ml-6 my-4 space-y-2 text-neutral-700 dark:text-neutral-300';
  return <Tag key={`list-${i}`} className={className}>{children}</Tag>;
}

function renderTableNode(node: Node, i: number, children: React.ReactNode[]): React.ReactNode {
  if (node.type === 'table') {
    return (
      <div key={`table-wrapper-${i}`} className="my-6 overflow-x-auto">
        <table className="w-full border-collapse border border-neutral-200 dark:border-neutral-800 text-sm">
          <tbody key={`tbody-${i}`}>{children}</tbody>
        </table>
      </div>
    );
  }
  if (node.type === 'tablerow') {
    return <tr key={`tr-${i}`} className="border-b border-neutral-200 dark:border-neutral-800 last:border-0">{children}</tr>;
  }
  if (node.type === 'tablecell') {
    return <td key={`td-${i}`} className="p-3 border-r border-neutral-200 dark:border-neutral-800 last:border-0">{children}</td>;
  }
  return null;
}

function renderNode(node: Node, i: number, ctx: RenderContext): React.ReactNode {
  if (node.type === 'linebreak') return <br key={`lb-${i}`} />;
  if (node.text !== undefined) return renderTextNode(node, i, ctx);

  const children = node.children?.map((child, j) => renderNode(child, j, ctx)) ?? [];

  switch (node.type) {
    case 'link':
    case 'autolink':
      return <a key={`link-${i}`} href={node.url || '#'} className="underline hover:text-black dark:hover:text-white transition-colors">{children}</a>;
    case 'table':
    case 'tablerow':
    case 'tablecell':
      return renderTableNode(node, i, children);
    case 'heading':
      return renderHeadingNode(node, i, children);
    case 'list':
      return renderListNode(node, i, children);
    case 'listitem':
      return <li key={`li-${i}`}>{children}</li>;
    case 'quote':
      return <blockquote key={`quote-${i}`} className="border-l-4 border-neutral-300 dark:border-neutral-700 pl-4 italic my-6 text-neutral-600 dark:text-neutral-400">{children}</blockquote>;
    case 'horizontalrule':
      return <hr key={`hr-${i}`} className="my-8 border-neutral-200 dark:border-neutral-800" />;
    case 'paragraph': {
      const align = node.format === 'center' ? 'text-center' : node.format === 'right' ? 'text-right' : '';
      if (ctx.variant === 'hero-title') return <span key={`p-span-${i}`} className={align}>{children}</span>;
      return <p key={`p-${i}`} className={`${align} mb-4 last:mb-0 text-neutral-700 dark:text-neutral-300 leading-relaxed`}>{children}</p>;
    }
    default:
      return <React.Fragment key={`frag-${i}`}>{children}</React.Fragment>;
  }
}

interface RichTextRendererProps {
  content: RichTextContent;
  variant?: Variant;
  accentFont?: string;
  headingFont?: string;
}

export function RichTextRenderer({ content, variant = 'default', accentFont, headingFont }: RichTextRendererProps) {
  if (!content?.root?.children) return null;
  const ctx: RenderContext = { variant, accentFont, headingFont };
  return (
    <React.Fragment>
      {content.root.children.map((node: Node, i: number) => renderNode(node, i, ctx))}
    </React.Fragment>
  );
}
