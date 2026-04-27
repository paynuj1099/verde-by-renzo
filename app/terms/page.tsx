import { FileText, Shield } from 'lucide-react'
import Link from 'next/link'

export default function TermsPage() {
  return (
    <main className="min-h-screen pt-36 pb-16 bg-gray-50">
      <div className="container max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-forest-100 rounded-full flex items-center justify-center">
              <FileText size={32} className="text-forest-600" />
            </div>
          </div>
          <h1 className="text-4xl lg:text-5xl font-serif font-bold text-forest-900 mb-4">
            Terms and Conditions
          </h1>
          <p className="text-gray-600">
            Last updated: April 27, 2026
          </p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl shadow-sm p-8 lg:p-12 space-y-8">
          <section>
            <h2 className="text-2xl font-serif font-bold text-forest-900 mb-4">
              1. Agreement to Terms
            </h2>
            <p className="text-gray-700 leading-relaxed">
              By accessing and using Verde by Renzo's website and services, you agree to be bound by these Terms and Conditions. 
              If you disagree with any part of these terms, you may not access our services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-bold text-forest-900 mb-4">
              2. Use of Services
            </h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              You agree to use our services only for lawful purposes and in accordance with these Terms. You agree not to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li>Use the service in any way that violates any applicable law or regulation</li>
              <li>Engage in any conduct that restricts or inhibits anyone's use of the service</li>
              <li>Attempt to gain unauthorized access to any portion of the service</li>
              <li>Use the service to transmit any advertising or promotional material</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-bold text-forest-900 mb-4">
              3. Pre-Orders and Purchases
            </h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              When you place a pre-order or purchase through our website:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li>All prices are in Philippine Pesos (PHP) unless otherwise stated</li>
              <li>Pre-orders require payment confirmation before processing</li>
              <li>We reserve the right to refuse or cancel any order</li>
              <li>Product availability is subject to change without notice</li>
              <li>Payment details will be provided upon order confirmation</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-bold text-forest-900 mb-4">
              4. Shipping and Delivery
            </h2>
            <p className="text-gray-700 leading-relaxed">
              We currently ship within the Philippines. Delivery times are estimates and may vary depending on location 
              and circumstances beyond our control. Risk of loss and title for items purchased pass to you upon delivery 
              to the carrier.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-bold text-forest-900 mb-4">
              5. Returns and Refunds
            </h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              Our return policy allows for returns within 30 days of purchase under the following conditions:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li>Items must be unworn, unwashed, and in original condition</li>
              <li>All original tags must be attached</li>
              <li>Proof of purchase is required</li>
              <li>Custom or personalized items may not be eligible for return</li>
              <li>Refunds will be processed within 7-14 business days</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-bold text-forest-900 mb-4">
              6. Intellectual Property
            </h2>
            <p className="text-gray-700 leading-relaxed">
              All content on this website, including but not limited to text, graphics, logos, images, and software, 
              is the property of Verde by Renzo and is protected by copyright and trademark laws. You may not use, 
              reproduce, or distribute any content without our express written permission.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-bold text-forest-900 mb-4">
              7. User Accounts
            </h2>
            <p className="text-gray-700 leading-relaxed">
              When you create an account with us, you are responsible for maintaining the confidentiality of your account 
              and password. You agree to accept responsibility for all activities that occur under your account.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-bold text-forest-900 mb-4">
              8. Limitation of Liability
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Verde by Renzo shall not be liable for any indirect, incidental, special, consequential, or punitive damages 
              resulting from your use of or inability to use the service, even if we have been advised of the possibility 
              of such damages.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-bold text-forest-900 mb-4">
              9. Changes to Terms
            </h2>
            <p className="text-gray-700 leading-relaxed">
              We reserve the right to modify these terms at any time. We will notify users of any material changes by 
              posting the new Terms and Conditions on this page with an updated revision date.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-bold text-forest-900 mb-4">
              10. Contact Information
            </h2>
            <p className="text-gray-700 leading-relaxed">
              If you have any questions about these Terms and Conditions, please contact us through our{' '}
              <Link href="/contact-us" className="text-forest-600 hover:text-forest-700 font-medium">
                Contact page
              </Link>
              .
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-bold text-forest-900 mb-4">
              11. Governing Law
            </h2>
            <p className="text-gray-700 leading-relaxed">
              These Terms and Conditions are governed by and construed in accordance with the laws of the Philippines, 
              and you irrevocably submit to the exclusive jurisdiction of the courts in that location.
            </p>
          </section>
        </div>

        {/* Footer Navigation */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/privacy"
            className="px-6 py-3 bg-white hover:bg-gray-50 text-forest-600 border-2 border-forest-600 font-semibold rounded-lg transition-colors text-center"
          >
            View Privacy Policy
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
