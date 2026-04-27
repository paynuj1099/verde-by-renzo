import { Shield, Lock } from 'lucide-react'
import Link from 'next/link'

export default function PrivacyPage() {
  return (
    <main className="min-h-screen pt-36 pb-16 bg-gray-50">
      <div className="container max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-forest-100 rounded-full flex items-center justify-center">
              <Shield size={32} className="text-forest-600" />
            </div>
          </div>
          <h1 className="text-4xl lg:text-5xl font-serif font-bold text-forest-900 mb-4">
            Privacy Policy
          </h1>
          <p className="text-gray-600">
            Last updated: April 27, 2026
          </p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl shadow-sm p-8 lg:p-12 space-y-8">
          <section>
            <h2 className="text-2xl font-serif font-bold text-forest-900 mb-4">
              1. Introduction
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Verde by Renzo ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains 
              how we collect, use, disclose, and safeguard your information when you visit our website and use our services. 
              Please read this privacy policy carefully.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-bold text-forest-900 mb-4">
              2. Information We Collect
            </h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              We may collect information about you in various ways:
            </p>
            
            <h3 className="text-lg font-semibold text-forest-800 mt-4 mb-2">Personal Data</h3>
            <p className="text-gray-700 leading-relaxed mb-2">
              When you register, place an order, or contact us, we may collect:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li>Name and contact information (email, phone number, address)</li>
              <li>Payment information (processed securely through our payment partners)</li>
              <li>Account credentials</li>
              <li>Shipping and billing addresses</li>
            </ul>

            <h3 className="text-lg font-semibold text-forest-800 mt-4 mb-2">Usage Data</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li>Browser type and version</li>
              <li>Pages visited and time spent on pages</li>
              <li>IP address and device information</li>
              <li>Cookies and similar tracking technologies</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-bold text-forest-900 mb-4">
              3. How We Use Your Information
            </h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              We use the information we collect to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li>Process and fulfill your orders</li>
              <li>Communicate with you about your orders and inquiries</li>
              <li>Send you marketing communications (with your consent)</li>
              <li>Improve our website and services</li>
              <li>Prevent fraud and enhance security</li>
              <li>Comply with legal obligations</li>
              <li>Analyze usage trends and preferences</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-bold text-forest-900 mb-4">
              4. Disclosure of Your Information
            </h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              We may share your information in the following situations:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li><strong>Service Providers:</strong> Third-party vendors who perform services on our behalf (payment processing, shipping, analytics)</li>
              <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
              <li><strong>Business Transfers:</strong> In connection with a merger, sale, or acquisition</li>
              <li><strong>With Your Consent:</strong> When you give us permission to share your information</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-3">
              We do not sell your personal information to third parties.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-bold text-forest-900 mb-4">
              5. Cookies and Tracking Technologies
            </h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              We use cookies and similar tracking technologies to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li>Remember your preferences and settings</li>
              <li>Understand how you interact with our website</li>
              <li>Improve user experience</li>
              <li>Analyze website traffic and trends</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-3">
              You can control cookies through your browser settings, though disabling cookies may affect website functionality.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-bold text-forest-900 mb-4">
              6. Data Security
            </h2>
            <p className="text-gray-700 leading-relaxed">
              We implement appropriate technical and organizational security measures to protect your personal information. 
              However, no method of transmission over the internet is 100% secure. While we strive to protect your data, 
              we cannot guarantee its absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-bold text-forest-900 mb-4">
              7. Your Privacy Rights
            </h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              You have the right to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li>Access and review your personal information</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your personal information</li>
              <li>Opt-out of marketing communications</li>
              <li>Object to processing of your personal information</li>
              <li>Request data portability</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-3">
              To exercise these rights, please contact us through our Contact page.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-bold text-forest-900 mb-4">
              8. Third-Party Links
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Our website may contain links to third-party websites. We are not responsible for the privacy practices 
              or content of these external sites. We encourage you to review the privacy policies of any third-party 
              sites you visit.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-bold text-forest-900 mb-4">
              9. Children's Privacy
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Our services are not directed to individuals under the age of 13. We do not knowingly collect personal 
              information from children under 13. If you believe we have collected information from a child under 13, 
              please contact us immediately.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-bold text-forest-900 mb-4">
              10. Data Retention
            </h2>
            <p className="text-gray-700 leading-relaxed">
              We retain your personal information only for as long as necessary to fulfill the purposes outlined in this 
              Privacy Policy, unless a longer retention period is required or permitted by law.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-bold text-forest-900 mb-4">
              11. International Data Transfers
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Your information may be transferred to and processed in countries other than your own. We ensure that 
              appropriate safeguards are in place to protect your information in accordance with this Privacy Policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-bold text-forest-900 mb-4">
              12. Changes to This Privacy Policy
            </h2>
            <p className="text-gray-700 leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the 
              new Privacy Policy on this page with an updated revision date. Your continued use of our services after 
              any changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-bold text-forest-900 mb-4">
              13. Contact Us
            </h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              If you have questions or concerns about this Privacy Policy or our data practices, please contact us:
            </p>
            <div className="bg-forest-50 p-4 rounded-lg">
              <p className="text-gray-700">
                <strong>Verde by Renzo</strong><br />
                Email: privacy@verdebyrenzo.com<br />
                Or visit our{' '}
                <Link href="/contact-us" className="text-forest-600 hover:text-forest-700 font-medium">
                  Contact page
                </Link>
              </p>
            </div>
          </section>
        </div>

        {/* Footer Navigation */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/terms"
            className="px-6 py-3 bg-white hover:bg-gray-50 text-forest-600 border-2 border-forest-600 font-semibold rounded-lg transition-colors text-center"
          >
            View Terms & Conditions
          </Link>
          <Link
            href="/contact-us"
            className="px-6 py-3 bg-forest-600 hover:bg-forest-700 text-white font-semibold rounded-lg transition-colors text-center"
          >
            Contact Us
          </Link>
        </div>
      </div>
    </main>
  )
}
