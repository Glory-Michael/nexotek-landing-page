import { cookies } from 'next/headers';
import type { Metadata } from 'next';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { AlphaGate } from '@/components/alpha-gate';
import {
  getAlphaConfig,
  findProtectedFeature,
  validateAlphaToken,
  ALPHA_COOKIE_NAME,
} from '@/lib/alpha-features';
import { getNewsroomSettings } from '@/lib/newsroom-settings';
import { SampleContentBanner } from '@/components/newsroom/sample-content-banner';

export const metadata: Metadata = {
  alternates: {
    types: {
      'application/rss+xml': '/api/rss',
    },
  },
};

export default async function NewsroomLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  // Alpha gate check — runs before rendering any content
  const alphaConfig = await getAlphaConfig();
  const feature = findProtectedFeature('/newsroom', alphaConfig.features);
  if (feature) {
    const cookieStore = await cookies();
    const token = cookieStore.get(ALPHA_COOKIE_NAME)?.value ?? '';
    if (!validateAlphaToken(token, alphaConfig.password)) {
      return <AlphaGate featureLabel={feature.label} />;
    }
  }

  const { showDemoArticles } = await getNewsroomSettings();

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-black text-black dark:text-white selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black">
      <Navbar />
      {showDemoArticles && <SampleContentBanner />}
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
