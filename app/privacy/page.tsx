import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black">
      <div className="max-w-3xl mx-auto px-6 py-20">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-neutral-500 hover:text-black dark:hover:text-white transition-colors mb-12">
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>
        
        <h1 className="text-4xl font-bold tracking-tight mb-8">Privacy Policy</h1>
        
        <div className="space-y-8 text-neutral-600 dark:text-neutral-400 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-black dark:text-white mb-4">1. Information We Collect</h2>
            <p>When you join our waitlist, we collect the email address you provide. We may also collect basic usage data and analytics to help us improve our website and understand our audience.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-black dark:text-white mb-4">2. How We Use Your Information</h2>
            <p>We use your email address solely to send you updates about our product, launch announcements, and relevant news. We do not sell, rent, or share your personal information with third parties for their marketing purposes.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-black dark:text-white mb-4">3. Data Security</h2>
            <p>We implement appropriate technical and organizational security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-black dark:text-white mb-4">4. Your Rights</h2>
            <p>You have the right to access, correct, or delete your personal information. You can unsubscribe from our mailing list at any time using the link provided in our emails. If you wish to have your data completely removed from our systems, please contact us.</p>
          </section>
          
          <p className="text-sm pt-8 border-t border-neutral-200 dark:border-neutral-800">
            Last updated: March 19, 2026
          </p>
        </div>
      </div>
    </div>
  );
}
