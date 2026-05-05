import Image from 'next/image';
import Link from 'next/link';
import { unstable_cache } from 'next/cache';
import { getPayload } from 'payload';
import config from '@/payload.config';
import { navigationDefaults } from '@/types/landing-page';
import { NavbarCTA } from './navbar-cta';

const getNavbarData = unstable_cache(
  async () => {
    try {
      const payload = await getPayload({ config });
      const data = await payload.findGlobal({ slug: 'navigation' });
      const logo = data.logo;
      return {
        ctaText: (data.ctaText as string) || navigationDefaults.ctaText,
        logoSrc:
          logo && typeof logo === 'object' && 'url' in logo
            ? (logo as { url: string }).url
            : navigationDefaults.logoSrc,
      };
    } catch {
      return { ctaText: navigationDefaults.ctaText, logoSrc: navigationDefaults.logoSrc };
    }
  },
  ['navbar-data'],
  { revalidate: 60, tags: ['navigation'] },
);

export async function Navbar() {
  const { ctaText, logoSrc } = await getNavbarData();

  return (
    <header className="site-navbar animate-navbar-slide-down relative z-50 flex items-center justify-between px-6 py-4 md:px-12 w-full bg-transparent min-h-[100px]">
      <Link href="/" className="flex items-center gap-3 group">
        <div className="relative h-12 md:h-16 lg:h-20 w-32 md:w-40 lg:w-48 dark:invert opacity-90 group-hover:opacity-100 transition-opacity">
          <Image
            src={logoSrc}
            alt="Nexotek Logo"
            fill
            priority
            unoptimized
            className="object-contain"
            referrerPolicy="no-referrer"
          />
        </div>
      </Link>

      <NavbarCTA ctaText={ctaText} />
    </header>
  );
}
