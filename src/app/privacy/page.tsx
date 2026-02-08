'use client';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <div className="bg-gradient-to-b from-slate-900 to-slate-950 border-b border-slate-800 sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <a href="/" className="text-blue-400 hover:text-blue-300 text-sm mb-4 inline-block">
            ← Back to Free Plate Check
          </a>
          <h1 className="text-3xl font-bold text-slate-100">Privacy Policy</h1>
          <p className="text-sm text-slate-400 mt-2">Last Updated: January 14, 2026</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="prose prose-invert max-w-none space-y-8 text-slate-300">
          
          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">1. Introduction</h2>
            <p>
              Free Plate Check ("we," "us," "our") is committed to protecting your privacy. We believe in a <strong>privacy-first approach</strong> and 
              collect only the minimal data necessary to provide our Service.
            </p>
            <p>
              This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website and Service. 
              The key principle: <strong>we don't store information about which vehicles you look up, and we don't sell your data.</strong>
            </p>
            <p>
              Please read this Privacy Policy carefully. If you do not agree with our policies and practices, please do not use our Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">2. What Information We Collect</h2>
            
            <h3 className="text-lg font-semibold text-slate-100 mt-6 mb-3">Vehicle Registration Numbers</h3>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li><strong>How:</strong> You voluntarily enter a UK vehicle registration number</li>
              <li><strong>What we do:</strong> We send it to the DVLA API to retrieve vehicle information</li>
              <li><strong>Storage:</strong> We do NOT store registration numbers</li>
              <li><strong>Hashing:</strong> Registration numbers are hashed (encrypted) for immediate session use only, then deleted</li>
            </ul>

            <h3 className="text-lg font-semibold text-slate-100 mt-6 mb-3">Automatically Collected Information</h3>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li><strong>Cookies & Analytics:</strong> We use Google Analytics to understand how you use Free Plate Check (anonymized data only)</li>
              <li><strong>IP Address:</strong> Automatically collected through standard web server logs, not stored long-term</li>
              <li><strong>Device Information:</strong> Browser type, device type, operating system (not linked to identity)</li>
              <li><strong>Page Interactions:</strong> Which features you use, time spent on pages (anonymized)</li>
            </ul>

            <h3 className="text-lg font-semibold text-slate-100 mt-6 mb-3">Information You Voluntarily Provide</h3>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li><strong>Email:</strong> Only if you voluntarily sign up for updates</li>
              <li><strong>Feedback:</strong> If you contact us with feedback or questions</li>
              <li><strong>No payment data:</strong> Free Plate Check is free and doesn't process payments</li>
            </ul>

            <p className="mt-4 bg-slate-900 border-l-4 border-blue-500 p-4 rounded">
              <strong>Privacy-First Approach:</strong> We collect only what's necessary to provide the Service. 
              We do not collect or store identifiable information about which vehicles you look up.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">3. How We Use Your Information</h2>
            <p>We use collected information for:</p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>✅ <strong>Service provision</strong> - To provide vehicle lookup functionality</li>
              <li>✅ <strong>Improvement</strong> - To understand how users interact with Free Plate Check</li>
              <li>✅ <strong>Analytics</strong> - To track usage patterns and optimize the service</li>
              <li>✅ <strong>Communication</strong> - To respond to inquiries or send updates (if opted in)</li>
              <li>✅ <strong>Legal compliance</strong> - To comply with GDPR, FCA, or other legal requirements</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">4. Legal Basis for Processing</h2>
            <p>We process your information under:</p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li><strong>Consent</strong> - You agree by using the Service</li>
              <li><strong>Legitimate Interest</strong> - To improve and maintain the Service</li>
              <li><strong>Legal Obligation</strong> - To comply with applicable laws</li>
              <li><strong>Contract</strong> - To provide the Service you've requested</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">5. Data Retention</h2>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li><strong>Registration Numbers:</strong> Never stored (hashed for session use, immediately deleted)</li>
              <li><strong>Server Logs:</strong> Retained for 7-30 days for security purposes</li>
              <li><strong>Analytics Data:</strong> Retained by Google Analytics for up to 26 months (anonymized)</li>
              <li><strong>Email Signup Data:</strong> Retained until you request deletion</li>
              <li><strong>Feedback/Messages:</strong> Retained until you request deletion</li>
              <li><strong>Cookies:</strong> Retained per cookie policy (typically 1-2 years)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">6. Data Sharing</h2>
            <p>We do NOT sell or rent your personal information.</p>
            <p className="mt-4"><strong>We MAY share data with:</strong></p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li><strong>DVLA</strong> - To retrieve vehicle information (their API)</li>
              <li><strong>Analytics providers</strong> - Google Analytics (anonymized data)</li>
              <li><strong>Service providers</strong> - Hosting providers, email services</li>
              <li><strong>Legal authorities</strong> - If required by law</li>
            </ul>
            <p className="mt-4"><strong>We do NOT share with:</strong></p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>Advertisers or marketing companies</li>
              <li>Insurance or finance companies</li>
              <li>Any third parties without your consent</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">7. Third-Party Links</h2>
            <p>
              Free Plate Check contains links to third-party websites (Go Compare, Carmoola, RAC, HPI Check). 
              These third parties have their own privacy policies. We are not responsible for their privacy practices.
            </p>
            <p className="mt-4">
              <strong>Affiliate Disclosure:</strong> We earn commissions from these links. The third parties may collect their own information about you.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">8. International Data Transfers</h2>
            <p>
              Free Plate Check operates in the UK. If you access from outside the UK, your data may be transferred to and processed in the UK, 
              which may have different data protection laws than your home country.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">9. Your Rights</h2>
            <p className="mb-4">
              Under GDPR, you have the right to request information about personal data we hold about you.
            </p>

            <h3 className="text-lg font-semibold text-slate-100 mt-6 mb-3">Important: Limited Identifiable Data</h3>
            <p className="mb-3"><strong>We do NOT store:</strong></p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>❌ Registration numbers (hashed for session use only, then deleted)</li>
              <li>❌ Long-term IP addresses</li>
              <li>❌ Identifiable location data</li>
              <li>❌ Personal payment information</li>
            </ul>

            <p className="mt-4 mb-3"><strong>We MAY hold (only if you contacted us):</strong></p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>✅ Email address (only if you signed up for updates)</li>
              <li>✅ Feedback or inquiry messages</li>
              <li>✅ Brief server logs (temporary, not linked to identity)</li>
            </ul>

            <h3 className="text-lg font-semibold text-slate-100 mt-6 mb-3">Your GDPR Rights</h3>
            <p>If you've provided data to us (email signup, feedback, contact):</p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>✅ <strong>Access</strong> - Request a copy of data we hold about you</li>
              <li>✅ <strong>Correction</strong> - Request we correct inaccurate data</li>
              <li>✅ <strong>Deletion</strong> - Request we delete your data ("Right to be Forgotten")</li>
              <li>✅ <strong>Restriction</strong> - Request we limit how we use your data</li>
              <li>✅ <strong>Portability</strong> - Request your data in a portable format</li>
              <li>✅ <strong>Withdraw Consent</strong> - Opt out of email updates or analytics</li>
            </ul>

            <h3 className="text-lg font-semibold text-slate-100 mt-6 mb-3">Our Response to Data Requests</h3>
            <p>
              If you request your data, we will provide any email address associated with your account, 
              copies of any feedback or messages you've sent us, and confirmation that we don't store vehicle 
              registration numbers or analytics data linked to your identity.
            </p>

            <p className="mt-4">
              <strong>To exercise these rights, contact us at:</strong> [Your email address]
            </p>
            <p className="mt-2">
              We will respond to all valid requests within 30 days as required by GDPR.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">10. Cookies</h2>
            <p>We use cookies for:</p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li><strong>Essential:</strong> To make the website function</li>
              <li><strong>Analytics:</strong> To understand user behavior (Google Analytics)</li>
              <li><strong>Preferences:</strong> To remember your settings</li>
            </ul>
            <p className="mt-4"><strong>How to manage cookies:</strong></p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>Most browsers allow you to refuse cookies or alert you when cookies are sent</li>
              <li>You can delete cookies at any time</li>
              <li>Disabling cookies may affect Service functionality</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">11. Security</h2>
            <p>We implement appropriate technical and organizational measures to protect your data:</p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>HTTPS encryption for all data in transit</li>
              <li>Secure API connections to DVLA</li>
              <li>Regular security assessments</li>
              <li>Limited data retention</li>
            </ul>
            <p className="mt-4 text-slate-400">
              <strong>However:</strong> No security system is 100% secure. We cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">12. Children's Privacy</h2>
            <p>
              Free Plate Check is not directed to children under 18. We do not knowingly collect data from children. 
              If we become aware a child has used the Service, we will delete their data promptly.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">13. Do Not Track</h2>
            <p>
              Some browsers have "Do Not Track" features. We currently do not respond to Do Not Track signals, 
              but you can opt out of analytics through your browser settings.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">14. Changes to This Privacy Policy</h2>
            <p>
              We may update this Privacy Policy periodically. We will notify you of significant changes via email or on the website. 
              Your continued use after changes constitutes acceptance.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">15. Contact Information</h2>
            <p>For questions about this Privacy Policy, contact:</p>
            <ul className="ml-2">
              <li><strong>Email:</strong> [Your email address]</li>
              <li><strong>Website:</strong> [Your website]</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">16. Complaint Rights</h2>
            <p>
              You have the right to lodge a complaint with the UK Information Commissioner's Office (ICO):
            </p>
            <ul className="ml-2">
              <li><strong>Website:</strong> www.ico.org.uk</li>
              <li><strong>Phone:</strong> 0303 123 1113</li>
            </ul>
          </section>

          <section className="bg-slate-900 border border-slate-800 rounded-lg p-6 mt-12">
            <p className="text-slate-300">
              <strong>By using Free Plate Check, you acknowledge that you have read and understood this Privacy Policy.</strong>
            </p>
          </section>

        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-slate-800 mt-16 bg-slate-900/50">
        <div className="max-w-3xl mx-auto px-4 py-8 text-center text-slate-500 text-sm">
          <p>Free Plate Check © 2026. All rights reserved.</p>
          <div className="mt-4 space-x-4">
            <a href="/" className="hover:text-slate-300">Home</a>
            <span>•</span>
            <a href="/blog" className="hover:text-slate-300">Guides</a>
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