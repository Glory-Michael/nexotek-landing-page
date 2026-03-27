'use client';

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

function renderNode(node: Node, i: number, ctx: RenderContext): React.ReactNode {
  const { variant } = ctx;
  // Linebreak
  if (node.type === 'linebreak') {
    return <br key={i} />;
  }

  // Text node
  if (node.text !== undefined) {
    let el: React.ReactNode = node.text;
    const format = typeof node.format === 'number' ? node.format : 0;

    if (format & 1) el = <strong key={`b${i}`}>{el}</strong>;

    if (format & 2) {
      if (variant === 'hero-title') {
        // Resolve accent font — "heading" means use the same as heading font
        let accentClass = ACCENT_FONT_CLASSES[ctx.accentFont || 'serif'] || 'font-serif';
        if (ctx.accentFont === 'heading') {
          accentClass = ACCENT_FONT_CLASSES[ctx.headingFont || 'space-grotesk'] || 'font-display';
        }
        el = (
          <span key={`i${i}`} className={`italic ${accentClass} text-neutral-600 dark:text-neutral-300 font-light`}>
            {el}
          </span>
        );
      } else {
        el = <em key={`i${i}`}>{el}</em>;
      }
    }

    if (format & 4) el = <s key={`s${i}`}>{el}</s>;
    if (format & 8) el = <u key={`u${i}`}>{el}</u>;
    return el;
  }

  const children = node.children?.map((child, j) => renderNode(child, j, ctx)) ?? [];

  // Link
  if (node.type === 'link' || node.type === 'autolink') {
    return (
      <a key={i} href={node.url || '#'} className="underline hover:text-black dark:hover:text-white transition-colors">
        {children}
      </a>
    );
  }

  // Heading
  if (node.type === 'heading') {
    const tag = node.tag || 'h3';
    if (tag === 'h3') return <h3 key={i} className="font-semibold">{children}</h3>;
    if (tag === 'h4') return <h4 key={i} className="font-semibold">{children}</h4>;
    return <h3 key={i} className="font-semibold">{children}</h3>;
  }

  // Paragraph
  if (node.type === 'paragraph') {
    const align = node.format === 'center' ? 'text-center' : node.format === 'right' ? 'text-right' : '';
    // In hero-title, paragraphs render without <p> wrapper to stay inline
    if (variant === 'hero-title') {
      return <span key={i} className={align}>{children}</span>;
    }
    return <p key={i} className={align}>{children}</p>;
  }

  // Root or other container
  return <>{children}</>;
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
  return <>{content.root.children.map((node: Node, i: number) => renderNode(node, i, ctx))}</>;
}
