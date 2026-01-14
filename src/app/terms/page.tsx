'use client';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <div className="bg-gradient-to-b from-slate-900 to-slate-950 border-b border-slate-800 sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <a href="/" className="text-blue-400 hover:text-blue-300 text-sm mb-4 inline-block">
            ← Back to Car Snapshot
          </a>
          <h1 className="text-3xl font-bold text-slate-100">Terms of Service</h1>
          <p className="text-sm text-slate-400 mt-2">Last Updated: January 14, 2026</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="prose prose-invert max-w-none space-y-8 text-slate-300">
          
          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">1. Acceptance of Terms</h2>
            <p>
              By accessing and using Car Snapshot ("the Service"), you agree to be bound by these Terms of Service. 
              If you do not agree to these terms, do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">2. Description of Service</h2>
            <p>
              Car Snapshot is a vehicle information lookup tool that provides publicly available data about UK registered vehicles, 
              including tax status, MOT information, and checklists for vehicle owners, buyers, and sellers.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">3. Data Source & Accuracy</h2>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>We source vehicle data from the DVLA (Driver and Vehicle Licensing Agency)</li>
              <li>Data is provided "as-is" without warranty of accuracy or completeness</li>
              <li>We recommend you <strong>always verify information with official sources</strong> before making decisions</li>
              <li>Registration numbers are hashed and not stored by Car Snapshot</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">4. Use Limitations</h2>
            <p className="mb-4">You agree NOT to:</p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>Use the Service for illegal purposes</li>
              <li>Attempt to reverse-engineer or scrape the Service</li>
              <li>Use automated tools to access the Service without permission</li>
              <li>Resell or redistribute information obtained through the Service</li>
              <li>Use the Service to harass, threaten, or harm others</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">5. Third-Party Links & Affiliate Disclosure</h2>
            <p className="mb-4">
              Car Snapshot contains links to third-party websites (insurance, finance, breakdown cover providers). 
              These are affiliate links - we earn a commission if you proceed through our links, at no extra cost to you.
            </p>
            <p className="mb-4">We are not responsible for:</p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>Third-party website content</li>
              <li>Third-party terms, policies, or practices</li>
              <li>Any transactions or issues with third-party services</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">6. Liability Disclaimer</h2>
            <p className="mb-4 font-semibold text-slate-200">TO THE FULLEST EXTENT PERMITTED BY LAW:</p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>Car Snapshot is provided "AS-IS" without warranties</li>
              <li>We are not liable for decisions made based on information provided</li>
              <li>We are not liable for vehicle purchase/sale decisions</li>
              <li>We are not liable for data inaccuracies or omissions</li>
              <li>We are not liable for third-party website issues</li>
            </ul>
            <p className="mt-4 font-semibold text-slate-200">
              Always independently verify information with:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>DVLA official website</li>
              <li>The vehicle seller</li>
              <li>Professional inspections</li>
              <li>Legal/financial advisors</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">7. User Responsibility</h2>
            <p>You are responsible for:</p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>Verifying all information independently</li>
              <li>Conducting proper vehicle inspections before purchasing</li>
              <li>Seeking professional advice (legal, financial, mechanical) as needed</li>
              <li>Using the Service lawfully and ethically</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">8. Changes to Terms</h2>
            <p>
              We may update these Terms of Service at any time. Continued use of the Service after changes means you accept the new terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">9. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>We are not liable for any indirect, incidental, special, or consequential damages</li>
              <li>Our total liability shall not exceed the amount you paid for the Service (£0 if free)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">10. Privacy</h2>
            <p>
              Your privacy is important. We collect minimal data and do not store registration numbers. 
              For full details, see our <a href="/privacy" className="text-blue-400 hover:text-blue-300">Privacy Policy</a>.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">11. Contact</h2>
            <p>
              For questions about these Terms of Service, contact us at:
            </p>
            <ul className="ml-2">
              <li>[Your email address]</li>
              <li>[Your website]</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">12. Governing Law</h2>
            <p>
              These Terms of Service are governed by the laws of England and Wales.
            </p>
          </section>

          <section className="bg-slate-900 border border-slate-800 rounded-lg p-6 mt-12">
            <p className="text-slate-300">
              <strong>By using Car Snapshot, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.</strong>
            </p>
          </section>

        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-slate-800 mt-16 bg-slate-900/50">
        <div className="max-w-3xl mx-auto px-4 py-8 text-center text-slate-500 text-sm">
          <p>Car Snapshot © 2026. All rights reserved.</p>
          <div className="mt-4 space-x-4">
            <a href="/" className="hover:text-slate-300">Home</a>
            <span>•</span>
            <a href="/privacy" className="hover:text-slate-300">Privacy Policy</a>
            <span>•</span>
            <a href="/terms" className="hover:text-slate-300">Terms of Service</a>
          </div>
        </div>
      </div>
    </div>
  );
}