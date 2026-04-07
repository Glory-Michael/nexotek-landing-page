import Link from 'next/link';

interface FooterProps {
  copyrightName?: string;
  links?: Array<{ label: string; url: string }>;
}

const defaultLinks = [
  { label: 'Privacy Policy', url: '/privacy' },
  { label: 'Terms of Service', url: '/terms' },
];

export function Footer({ copyrightName = 'Nexotek.ai', links = defaultLinks }: FooterProps) {
  return (
    <footer className="site-footer animate-footer-fade-in relative w-full bg-transparent py-4 px-6 md:px-12 z-50 mt-auto overflow-hidden">
      {/* Isometric Grid Background */}
      <div
        className="absolute inset-0 z-0 opacity-[0.04] dark:opacity-[0.08] pointer-events-none"
        style={{
          maskImage: 'linear-gradient(to bottom, transparent, black 40%)',
          WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 40%)',
        }}
      >
        <svg width="100%" height="100%">
          <defs>
            <pattern id="footer-isometric-grid" width="40" height="69.282" patternUnits="userSpaceOnUse">
              <g stroke="currentColor" strokeWidth="1" fill="none">
                <path d="M 40 0 L 0 23.094 L 0 69.282 L 40 46.188 Z" />
                <path d="M 0 23.094 L 40 46.188 M 0 69.282 L 40 23.094" />
              </g>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#footer-isometric-grid)" className="text-black dark:text-white" />
        </svg>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto flex flex-row items-center justify-between gap-4">
        <div className="flex items-center">
          <span className="text-[10px] sm:text-xs font-medium text-neutral-500 whitespace-nowrap">
            © {new Date().getFullYear()} {copyrightName}
          </span>
        </div>

        <div className="flex items-center gap-4 sm:gap-6 text-[10px] sm:text-xs text-neutral-500">
          {links.map((link) => (
            <Link
              key={link.url}
              href={link.url}
              className="hover:text-black dark:hover:text-white transition-colors whitespace-nowrap"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
