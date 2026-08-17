'use client'

import {
  useEffect,
  useRef,
  useState,
} from 'react'

import {
  Bot,
  MessageCircle,
  Send,
  User,
  X,
} from 'lucide-react'

interface Message {
  id: number
  text: string
  sender: 'user' | 'bot'
  timestamp: Date
}

type BotResponseRule = {
  keywords: string[]
  response: string
}

const quickReplies = [
  'How does pre-order work?',
  'What payment methods do you accept?',
  'How long does shipping take?',
  'How can I contact you?',
]

const botResponseRules: BotResponseRule[] = [
  {
    keywords: [
      'hello',
      'hi',
      'hey',
    ],
    response:
      'Hello! Welcome to Verde by Renzo. I can help with pre-orders, payments, shipping, sizing, and general shop questions.',
  },
  {
    keywords: [
      'pre-order',
      'preorder',
      'pre order',
      'checkout',
      'order process',
      'how to order',
    ],
    response:
      'To place a pre-order, add your items to the cart, go to Checkout, enter your delivery details, then click "Send Pre-order." You will see a confirmation before the order is submitted. Once the pre-order is successfully sent, your cart will be cleared automatically.',
  },
  {
    keywords: [
      'track',
      'tracking',
      'where is my order',
      'order status',
      'status of my order',
    ],
    response:
      'For order status or tracking assistance, please use our Contact Us page and provide the name and email address used for your pre-order so our team can check it.',
  },
  {
    keywords: [
      'payment',
      'pay',
      'gcash',
      'maya',
      'bank transfer',
      'cod',
      'cash on delivery',
    ],
    response:
      'This shop currently uses a pre-order process. Payment instructions and available payment methods will be provided after your order has been reviewed and confirmed by our team.',
  },
  {
    keywords: [
      'shipping',
      'delivery',
      'ship',
      'how long',
      'arrive',
    ],
    response:
      'Delivery timing depends on your location and order confirmation. After your pre-order is confirmed, our team will provide the applicable delivery and payment details.',
  },
  {
    keywords: [
      'international',
      'outside philippines',
      'abroad',
      'overseas',
    ],
    response:
      'For international shipping availability, please contact us before placing your order so our team can confirm whether delivery to your location can be accommodated.',
  },
  {
    keywords: [
      'size',
      'sizing',
      'fit',
      'small',
      'medium',
      'large',
      'xl',
    ],
    response:
      'Please check the available size information on the product page before adding an item to your cart. If you are unsure about the best fit, contact us and we will be happy to assist.',
  },
  {
    keywords: [
      'return',
      'refund',
      'exchange',
      'replace',
    ],
    response:
      'For returns, exchanges, or order concerns, please contact us with your order details. Our team will review your request and let you know the available options.',
  },
  {
    keywords: [
      'contact',
      'email',
      'support',
      'customer service',
      'talk to someone',
      'human',
    ],
    response:
      'You can reach our team through the Contact Us page. Send us your name, email, phone number, and message, and we will get back to you as soon as possible.',
  },
  {
    keywords: [
      'cart',
      'clear cart',
      'empty cart',
    ],
    response:
      'Your cart stays intact while you review your checkout. It is cleared automatically only after your pre-order has been submitted successfully.',
  },
  {
    keywords: [
      'confirm',
      'confirmation',
      'modal',
    ],
    response:
      'When you click "Send Pre-order" on Checkout, a confirmation window will appear showing your total items and amount. You can cancel to review your order or confirm to submit it.',
  },
  {
    keywords: [
      'help',
      'what can you do',
    ],
    response:
      'I can help explain how pre-orders work, payments, shipping, sizing, order status, returns, and how to contact Verde by Renzo.',
  },
]

const defaultResponse =
  'Thanks for your message! I may not have a specific answer for that yet. Please visit our Contact Us page for detailed assistance from the Verde by Renzo team.'

export default function Chatbot() {
  const [
    isOpen,
    setIsOpen,
  ] = useState(false)

  const [
    messages,
    setMessages,
  ] = useState<Message[]>([
    {
      id: 1,
      text:
        'Hello! Welcome to Verde by Renzo. How can I assist you today?',
      sender: 'bot',
      timestamp: new Date(),
    },
  ])

  const [
    inputValue,
    setInputValue,
  ] = useState('')

  const [
    isBotTyping,
    setIsBotTyping,
  ] = useState(false)

  const messagesEndRef =
    useRef<HTMLDivElement>(
      null
    )

  const inputRef =
    useRef<HTMLInputElement>(
      null
    )

  const messageIdRef =
    useRef(2)

  const scrollToBottom =
    () => {
      messagesEndRef.current?.scrollIntoView({
        behavior: 'smooth',
      })
    }

  useEffect(() => {
    scrollToBottom()
  }, [
    messages,
    isBotTyping,
  ])

  useEffect(() => {
    if (isOpen) {
      setTimeout(
        () => {
          inputRef.current?.focus()
        },
        100
      )
    }
  }, [
    isOpen,
  ])

  const getNextMessageId =
    () => {
      const id =
        messageIdRef.current

      messageIdRef.current +=
        1

      return id
    }

  const getBotResponse =
    (
      userMessage: string
    ): string => {
      const normalizedMessage =
        userMessage
          .toLowerCase()
          .trim()

      const matchedRule =
        botResponseRules.find(
          (rule) =>
            rule.keywords.some(
              (keyword) =>
                normalizedMessage.includes(
                  keyword
                )
            )
        )

      return (
        matchedRule?.response ||
        defaultResponse
      )
    }

  const sendMessage =
    (
      text: string
    ) => {
      const trimmedMessage =
        text.trim()

      if (
        !trimmedMessage ||
        isBotTyping
      ) {
        return
      }

      const userMessage: Message =
        {
          id:
            getNextMessageId(),
          text:
            trimmedMessage,
          sender:
            'user',
          timestamp:
            new Date(),
        }

      setMessages(
        (prev) => [
          ...prev,
          userMessage,
        ]
      )

      setInputValue('')
      setIsBotTyping(true)

      window.setTimeout(
        () => {
          const botMessage: Message =
            {
              id:
                getNextMessageId(),
              text:
                getBotResponse(
                  trimmedMessage
                ),
              sender:
                'bot',
              timestamp:
                new Date(),
            }

          setMessages(
            (prev) => [
              ...prev,
              botMessage,
            ]
          )

          setIsBotTyping(false)
        },
        650
      )
    }

  const handleSendMessage =
    () => {
      sendMessage(
        inputValue
      )
    }

  const handleQuickReply =
    (
      reply: string
    ) => {
      sendMessage(
        reply
      )
    }

  const handleKeyDown =
    (
      e: React.KeyboardEvent<HTMLInputElement>
    ) => {
      if (
        e.key === 'Enter' &&
        !e.shiftKey
      ) {
        e.preventDefault()
        handleSendMessage()
      }
    }

  return (
    <>
      {/* ======================= */}
      {/* CHAT BUTTON */}
      {/* ======================= */}

      {!isOpen && (
        <button
          type="button"
          onClick={
            () =>
              setIsOpen(
                true
              )
          }
          className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-forest-600 text-white shadow-lg transition-all hover:scale-110 hover:bg-forest-700"
          aria-label="Open chat"
        >
          <MessageCircle
            size={24}
          />
        </button>
      )}

      {/* ======================= */}
      {/* CHAT WINDOW */}
      {/* ======================= */}

      {isOpen && (
        <div className="fixed inset-0 z-50 flex h-full w-full flex-col border border-gray-200 bg-white shadow-2xl md:bottom-6 md:right-6 md:left-auto md:top-auto md:h-[600px] md:w-96 md:rounded-2xl">

          {/* HEADER */}

          <div className="flex items-center justify-between bg-forest-600 p-4 text-white md:rounded-t-2xl">

            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
                <Bot
                  size={24}
                />
              </div>

              <div>
                <h3 className="font-semibold">
                  Verde Assistant
                </h3>

                <p className="text-xs text-forest-100">
                  Shopping & pre-order help
                </p>
              </div>

            </div>

            <button
              type="button"
              onClick={
                () =>
                  setIsOpen(
                    false
                  )
              }
              className="rounded-full p-2 transition-colors hover:bg-white/20"
              aria-label="Close chat"
            >
              <X
                size={20}
              />
            </button>

          </div>

          {/* ======================= */}
          {/* MESSAGES */}
          {/* ======================= */}

          <div className="flex-1 space-y-4 overflow-y-auto bg-gray-50 p-4">

            {messages.map(
              (message) => (
                <div
                  key={
                    message.id
                  }
                  className={`flex gap-2 ${
                    message.sender ===
                    'user'
                      ? 'justify-end'
                      : 'justify-start'
                  }`}
                >

                  {message.sender ===
                    'bot' && (
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-forest-100">
                      <Bot
                        size={16}
                        className="text-forest-600"
                      />
                    </div>
                  )}

                  <div
                    className={`max-w-[75%] rounded-2xl p-3 ${
                      message.sender ===
                      'user'
                        ? 'rounded-br-none bg-forest-600 text-white'
                        : 'rounded-bl-none bg-white text-gray-900 shadow-sm'
                    }`}
                  >

                    <p className="text-sm leading-relaxed">
                      {message.text}
                    </p>

                    <p
                      className={`mt-1 text-xs ${
                        message.sender ===
                        'user'
                          ? 'text-forest-100'
                          : 'text-gray-400'
                      }`}
                    >
                      {message.timestamp.toLocaleTimeString(
                        [],
                        {
                          hour:
                            '2-digit',
                          minute:
                            '2-digit',
                        }
                      )}
                    </p>

                  </div>

                  {message.sender ===
                    'user' && (
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-forest-600">
                      <User
                        size={16}
                        className="text-white"
                      />
                    </div>
                  )}

                </div>
              )
            )}

            {/* BOT TYPING */}

            {isBotTyping && (
              <div className="flex gap-2">

                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-forest-100">
                  <Bot
                    size={16}
                    className="text-forest-600"
                  />
                </div>

                <div className="rounded-2xl rounded-bl-none bg-white px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-1">

                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.3s]" />

                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.15s]" />

                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400" />

                  </div>
                </div>

              </div>
            )}

            <div
              ref={
                messagesEndRef
              }
            />

          </div>

          {/* ======================= */}
          {/* QUICK REPLIES */}
          {/* ======================= */}

          {messages.length <=
            2 && (
            <div className="border-t border-gray-200 bg-white px-4 py-3">

              <p className="mb-2 text-xs text-gray-500">
                Quick questions:
              </p>

              <div className="flex flex-wrap gap-2">

                {quickReplies.map(
                  (
                    reply
                  ) => (
                    <button
                      type="button"
                      key={
                        reply
                      }
                      onClick={
                        () =>
                          handleQuickReply(
                            reply
                          )
                      }
                      disabled={
                        isBotTyping
                      }
                      className="rounded-full bg-forest-50 px-3 py-1.5 text-xs text-forest-700 transition-colors hover:bg-forest-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {reply}
                    </button>
                  )
                )}

              </div>

            </div>
          )}

          {/* ======================= */}
          {/* INPUT */}
          {/* ======================= */}

          <div className="border-t border-gray-200 bg-white p-4 md:rounded-b-2xl">

            <div className="flex gap-2">

              <input
                ref={
                  inputRef
                }
                type="text"
                value={
                  inputValue
                }
                onChange={(
                  e
                ) =>
                  setInputValue(
                    e.target.value
                  )
                }
                onKeyDown={
                  handleKeyDown
                }
                disabled={
                  isBotTyping
                }
                placeholder={
                  isBotTyping
                    ? 'Verde Assistant is typing...'
                    : 'Type your message...'
                }
                className="flex-1 rounded-full border border-gray-300 px-4 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-forest-500 disabled:bg-gray-100"
                aria-label="Chat message"
              />

              <button
                type="button"
                onClick={
                  handleSendMessage
                }
                disabled={
                  !inputValue.trim() ||
                  isBotTyping
                }
                className="flex h-10 w-10 items-center justify-center rounded-full bg-forest-600 text-white transition-colors hover:bg-forest-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                aria-label="Send message"
              >
                <Send
                  size={18}
                />
              </button>

            </div>

          </div>

        </div>
      )}
    </>
  )
}
