import Image from 'next/image';
import Link from 'next/link';
import { NavbarCTA } from './navbar-cta';

export interface NavbarProps {
  logoSrc?: string;
  logoNode?: React.ReactNode;
  ctaText?: string;
}

export function Navbar({ logoSrc = '/logo.svg', logoNode, ctaText = 'Get Updates' }: NavbarProps) {
  return (
    <header className="site-navbar animate-navbar-slide-down relative z-50 flex items-center justify-between px-6 py-4 md:px-12 w-full bg-transparent min-h-[100px]">
      <Link href="/" className="flex items-center gap-3 group">
        <div className="relative h-12 md:h-16 lg:h-20 w-32 md:w-40 lg:w-48">
          {logoNode ? (
            logoNode
          ) : (
            <Image
              src={logoSrc}
              alt="Nexotek Logo"
              fill
              priority
              sizes="(max-width: 767px) 128px, (max-width: 1023px) 160px, 192px"
              className="object-contain dark:invert opacity-90 group-hover:opacity-100 transition-opacity"
              referrerPolicy="no-referrer"
            />
          )}
        </div>
      </Link>

      <NavbarCTA ctaText={ctaText} />
    </header>
  );
}
