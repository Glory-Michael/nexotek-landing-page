import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black">
      <div className="max-w-3xl mx-auto px-6 py-20">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-neutral-500 hover:text-black dark:hover:text-white transition-colors mb-12">
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>
        
        <h1 className="text-4xl font-bold tracking-tight mb-8">Terms of Service</h1>
        
        <div className="space-y-8 text-neutral-600 dark:text-neutral-400 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-black dark:text-white mb-4">1. Acceptance of Terms</h2>
            <p>By accessing and using this website, you accept and agree to be bound by the terms and provision of this agreement. In addition, when using these particular services, you shall be subject to any posted guidelines or rules applicable to such services.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-black dark:text-white mb-4">2. Waitlist and Communications</h2>
            <p>By joining our waitlist, you agree to receive email communications from us regarding our product launch, updates, and related announcements. You can opt-out of these communications at any time by clicking the unsubscribe link in our emails.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-black dark:text-white mb-4">3. Privacy</h2>
            <p>Your use of our services is also governed by our Privacy Policy. Please review our Privacy Policy, which also governs the site and informs users of our data collection practices.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-black dark:text-white mb-4">4. Modifications</h2>
            <p>We reserve the right to modify these terms at any time. We do so by posting and drawing attention to the updated terms on the Site. Your decision to continue to visit and make use of the Site after such changes have been made constitutes your formal acceptance of the new Terms of Service.</p>
          </section>
          
          <p className="text-sm pt-8 border-t border-neutral-200 dark:border-neutral-800">
            Last updated: March 19, 2026
          </p>
        </div>
      </div>
    </div>
  );
}
