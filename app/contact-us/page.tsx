'use client'

import { useState, useEffect } from 'react'
import { useCart } from '@/context/CartContext'
import { Copy, Check, ShoppingBag, Trash2, FileText, User, Package, MessageSquare, Mail, Send } from 'lucide-react'
import Link from 'next/link'

const usdToPhp = (usd: number) => Math.round(usd * 57)

export default function ContactPage() {
  const { cart, getCartTotal, getCartCount, clearCart } = useCart()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    message: '',
  })
  const [copied, setCopied] = useState(false)
  const [orderGenerated, setOrderGenerated] = useState(false)
  const [messageSent, setMessageSent] = useState(false)

  // Reset order state when cart becomes empty
  useEffect(() => {
    if (cart.length === 0 && orderGenerated) {
      setOrderGenerated(false)
      setFormData(prev => ({ ...prev, message: '' }))
    }
  }, [cart.length, orderGenerated])

  const getColorDisplay = (color: string) => {
    const colorMap: { [key: string]: string } = {
      forest: 'Forest Green',
      navy: 'Navy Blue',
      white: 'White',
      gray: 'Gray',
    }
    return colorMap[color] || color
  }

  const generateOrderMessage = () => {
    if (cart.length === 0) return ''

    const orderDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })

    let message = `VERDE BY RENZO - PRE-ORDER\n\n`
    message += `Order Date: ${orderDate}\n\n`
    message += `Customer Information:\n`
    message += `Name: ${formData.name || '[Not provided]'}\n`
    message += `Email: ${formData.email || '[Not provided]'}\n`
    message += `Phone: ${formData.phone || '[Not provided]'}\n`
    message += `Address: ${formData.address || '[Not provided]'}\n\n`
    message += `ORDER DETAILS:\n`
    message += `${'='.repeat(40)}\n\n`

    cart.forEach((item, index) => {
      message += `${index + 1}. ${item.name}\n`
      message += `   Color: ${getColorDisplay(item.color)}\n`
      message += `   Quantity: ${item.quantity}\n`
      message += `   Price: ₱${usdToPhp(item.price).toLocaleString('en-PH')}.00 each\n`
      message += `   Subtotal: ₱${usdToPhp(item.price * item.quantity).toLocaleString('en-PH')}.00\n\n`
    })

    message += `${'='.repeat(40)}\n`
    message += `Total Items: ${getCartCount()}\n`
    message += `TOTAL AMOUNT: ₱${usdToPhp(getCartTotal()).toLocaleString('en-PH')}.00\n\n`

    message += `\nThis is a pre-order request. Payment details will be provided upon confirmation.`

    return message
  }

  const handleCopyOrder = () => {
    if (cart.length === 0) return
    
    const orderMessage = formData.message || generateOrderMessage()
    navigator.clipboard.writeText(orderMessage)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleGenerateOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (cart.length > 0) {
      // Generate order for cart items
      const orderMessage = generateOrderMessage()
      setFormData({ ...formData, message: orderMessage })
      setOrderGenerated(true)
    } else {
      // Send message without order
      // Simulate email sending
      setMessageSent(true)
      
      // In a real application, you would send the message to your backend here
      const contactMessage = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        message: formData.message,
        date: new Date().toISOString()
      }
      
      console.log('Sending message:', contactMessage)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Reset form after sending
      setTimeout(() => {
        setMessageSent(false)
        setFormData({
          name: '',
          email: '',
          phone: '',
          address: '',
          message: '',
        })
      }, 3000)
    }
  }

  const handleClearAndReset = () => {
    clearCart()
    setOrderGenerated(false)
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: '',
      message: '',
    })
  }

  return (
    <section className="pt-24 sm:pt-28 lg:pt-32 pb-12 sm:pb-16 lg:pb-20 bg-gray-50 min-h-screen">
      <div className="container max-w-6xl mx-auto">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-center mb-4 text-forest-700">
          {cart.length > 0 ? 'Checkout & Contact' : 'Contact Us'}
        </h1>
        <p className="text-center text-gray-600 mb-10 max-w-2xl mx-auto">
          {cart.length > 0 
            ? 'Complete your pre-order by filling out the form below. Your order details will be generated in the message field.' 
            : 'Have questions or need assistance? Send us a message and we\'ll get back to you as soon as possible.'
          }
        </p>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column - Form */}
          <div className="bg-white rounded-lg shadow-md p-6 sm:p-8">
            <h2 className="text-2xl font-serif text-forest-700 mb-6">Your Information</h2>
            
            <form onSubmit={handleGenerateOrder} className="space-y-5">
              <div>
                <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-forest-600 focus:border-transparent"
                  placeholder="Juan Dela Cruz"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-forest-600 focus:border-transparent"
                  placeholder="juan@example.com"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-forest-600 focus:border-transparent"
                  placeholder="+63 912 345 6789"
                />
              </div>

              <div>
                <label htmlFor="address" className="block text-sm font-semibold text-gray-700 mb-2">
                  Delivery Address *
                </label>
                <textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  required
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-forest-600 focus:border-transparent resize-none"
                  placeholder="Complete address with city and postal code"
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-semibold text-gray-700 mb-2">
                  {cart.length > 0 ? 'Order Details / Message' : 'Message'} {orderGenerated && cart.length > 0 && <span className="text-forest-600">(Order Generated)</span>}
                </label>
                <textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  rows={12}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-forest-600 focus:border-transparent resize-none font-mono text-xs"
                  placeholder={cart.length > 0 
                    ? "Click 'Generate Order Summary' to populate this field with your complete order details..." 
                    : "Type your message or inquiry here..."
                  }
                  readOnly={orderGenerated && cart.length > 0}
                />
                {orderGenerated && cart.length > 0 && (
                  <p className="text-xs text-gray-600 mt-2 flex items-center gap-1">
                    <Check size={14} className="text-green-600" />
                    Order summary generated. You can copy this message to send via email or messaging apps.
                  </p>
                )}
              </div>

              {cart.length > 0 ? (
                <button
                  type="submit"
                  className="w-full bg-forest-600 text-white py-3 rounded-lg font-semibold hover:bg-forest-700 transition-all shadow-md"
                >
                  Generate Order Summary
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={messageSent}
                  className={`w-full py-3 rounded-lg font-semibold transition-all shadow-md flex items-center justify-center gap-2 ${
                    messageSent 
                      ? 'bg-green-600 text-white cursor-not-allowed' 
                      : 'bg-forest-600 text-white hover:bg-forest-700'
                  }`}
                >
                  {messageSent ? (
                    <>
                      <Check size={18} />
                      Message Sent!
                    </>
                  ) : (
                    <>
                      <MessageSquare size={18} />
                      Send Message
                    </>
                  )}
                </button>
              )}
            </form>
          </div>

          {/* Right Column - Order Summary or Contact Info */}
          <div className="bg-white rounded-lg shadow-md p-6 sm:p-8">
            <h2 className="text-2xl font-serif text-forest-700 mb-6">
              {cart.length > 0 ? 'Order Summary' : 'Get in Touch'}
            </h2>

            {cart.length === 0 ? (
              <div className="space-y-6">
                {messageSent ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                      <Check size={32} className="text-green-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Message Sent!</h3>
                    <p className="text-gray-600">
                      Thank you for contacting us. We'll get back to you soon.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-4">
                      <div className="flex items-start gap-3 p-4 bg-forest-50 rounded-lg">
                        <Mail size={24} className="text-forest-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-1">Email Us</h3>
                          <p className="text-sm text-gray-600">contact@verdebyrenzo.com</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-4 bg-forest-50 rounded-lg">
                        <MessageSquare size={24} className="text-forest-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-1">Live Chat</h3>
                          <p className="text-sm text-gray-600">Available Mon-Sat, 9AM-6PM</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-4 bg-forest-50 rounded-lg">
                        <Package size={24} className="text-forest-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-1">Visit Our Shop</h3>
                          <p className="text-sm text-gray-600">Browse our collection of premium apparel</p>
                          <Link 
                            href="/shop" 
                            className="text-sm text-forest-600 hover:text-forest-700 font-medium mt-1 inline-block"
                          >
                            Shop Now →
                          </Link>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gold-50 p-4 rounded-lg border border-gold-200">
                      <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                        <Send size={18} className="text-gold-600" />
                        Quick Response
                      </h3>
                      <p className="text-sm text-gray-700">
                        Fill out the form and click <strong>"Send Message"</strong> to reach us directly. We typically respond within 24 hours.
                      </p>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <>
                {/* Cart Items */}
                <div className="space-y-4 mb-6 max-h-[400px] overflow-y-auto">
                  {cart.map((item) => (
                    <div
                      key={`${item.id}-${item.color}`}
                      className="flex gap-4 p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="w-16 h-16 bg-gray-200 rounded flex-shrink-0 flex items-center justify-center text-xs text-gray-400">
                        Image
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm text-gray-900 mb-1">
                          {item.name}
                        </h3>
                        <p className="text-xs text-gray-500 mb-1">
                          {getColorDisplay(item.color)} • Qty: {item.quantity}
                        </p>
                        <p className="text-sm font-semibold text-forest-600">
                          ₱{usdToPhp(item.price * item.quantity).toLocaleString('en-PH')}.00
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="border-t border-gray-200 pt-4 space-y-3 mb-6">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Total Items:</span>
                    <span className="font-semibold">{getCartCount()}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold text-forest-700">
                    <span>Total Amount:</span>
                    <span>₱{usdToPhp(getCartTotal()).toLocaleString('en-PH')}.00</span>
                  </div>
                </div>

                {/* Action Buttons */}
                {orderGenerated ? (
                  <div className="space-y-3">
                    <button
                      onClick={handleCopyOrder}
                      className={`w-full py-3 rounded-lg font-semibold transition-all shadow-md flex items-center justify-center gap-2 ${
                        copied
                          ? 'bg-green-600 text-white'
                          : 'bg-forest-600 text-white hover:bg-forest-700'
                      }`}
                    >
                      {copied ? (
                        <>
                          <Check size={18} />
                          Copied to Clipboard!
                        </>
                      ) : (
                        <>
                          <Copy size={18} />
                          Copy Order Details
                        </>
                      )}
                    </button>

                    <p className="text-xs text-center text-gray-600 px-4 flex items-center justify-center gap-2">
                      <MessageSquare size={14} />
                      Send this message to us via WhatsApp, Messenger, or Email
                    </p>

                    <button
                      onClick={handleClearAndReset}
                      className="w-full py-2.5 rounded-lg font-semibold transition-all border-2 border-red-500 text-red-500 hover:bg-red-50 flex items-center justify-center gap-2"
                    >
                      <Trash2 size={18} />
                      Clear Cart & Reset
                    </button>
                  </div>
                ) : (
                  <div className="bg-gold-50 p-4 rounded-lg border border-gold-200 flex items-start gap-3">
                    <FileText size={20} className="text-gold-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-gray-700">
                      Fill out the form and click <strong>"Generate Order Summary"</strong> to create your pre-order message in the Message field
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-12 bg-white rounded-lg shadow-md p-6 sm:p-8">
          <h3 className="text-xl font-serif text-forest-700 mb-4 text-center">
            How to Complete Your Pre-Order
          </h3>
          <div className="grid sm:grid-cols-3 gap-6 text-center">
            <div>
              <div className="flex justify-center mb-3">
                <User size={40} className="text-forest-600" strokeWidth={1.5} />
              </div>
              <h4 className="font-semibold text-forest-600 mb-2">1. Fill Form</h4>
              <p className="text-sm text-gray-600">
                Enter your details and generate order summary
              </p>
            </div>
            <div>
              <div className="flex justify-center mb-3">
                <Package size={40} className="text-forest-600" strokeWidth={1.5} />
              </div>
              <h4 className="font-semibold text-forest-600 mb-2">2. Review Order</h4>
              <p className="text-sm text-gray-600">
                Check your complete order information in the message field
              </p>
            </div>
            <div>
              <div className="flex justify-center mb-3">
                <MessageSquare size={40} className="text-forest-600" strokeWidth={1.5} />
              </div>
              <h4 className="font-semibold text-forest-600 mb-2">3. Send Message</h4>
              <p className="text-sm text-gray-600">
                Copy and send via WhatsApp, Messenger, or Email to confirm
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

