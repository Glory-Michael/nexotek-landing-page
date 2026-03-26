import { HeroSection } from '@/components/hero-section';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';

export default function Home() {
  return (
    <main className="min-h-[100dvh] md:min-h-[600px] lg:min-h-[100dvh] w-full flex flex-col relative bg-white dark:bg-black transition-colors duration-500">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-neutral-100 via-white to-white dark:from-neutral-900 dark:via-black dark:to-black -z-30 transition-colors duration-500" />
      <Navbar />
      <div className="flex-1 flex flex-col">
        <HeroSection />
      </div>
      <Footer />
    </main>
  );
}
