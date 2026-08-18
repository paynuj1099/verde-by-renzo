"use client";

import { useEffect, useRef, useState } from "react";

import { Bot, MessageCircle, Send, User, X } from "lucide-react";

interface Message {
  id: number;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
}

type BotResponseRule = {
  keywords: string[];
  response: string;
};

const quickReplies = [
  "How does pre-order work?",
  "What payment methods do you accept?",
  "How long does shipping take?",
  "How can I contact you?",
];

const botResponseRules: BotResponseRule[] = [
  {
    keywords: ["hello", "hi", "hey"],
    response:
      "Hello! Welcome to Verde by Renzo. I can help with pre-orders, payments, shipping, sizing, and general shop questions.",
  },
  {
    keywords: [
      "pre-order",
      "preorder",
      "pre order",
      "checkout",
      "order process",
      "how to order",
    ],
    response:
      'To place a pre-order, add your items to the cart, go to Checkout, enter your delivery details, then click "Send Pre-order." You will see a confirmation before the order is submitted. Once the pre-order is successfully sent, your cart will be cleared automatically.',
  },
  {
    keywords: [
      "track",
      "tracking",
      "where is my order",
      "order status",
      "status of my order",
    ],
    response:
      "For order status or tracking assistance, please use our Contact Us page and provide the name and email address used for your pre-order so our team can check it.",
  },
  {
    keywords: [
      "payment",
      "pay",
      "gcash",
      "maya",
      "bank transfer",
      "cod",
      "cash on delivery",
    ],
    response:
      "This shop currently uses a pre-order process. Payment instructions and available payment methods will be provided after your order has been reviewed and confirmed by our team.",
  },
  {
    keywords: ["shipping", "delivery", "ship", "how long", "arrive"],
    response:
      "Delivery timing depends on your location and order confirmation. After your pre-order is confirmed, our team will provide the applicable delivery and payment details.",
  },
  {
    keywords: ["international", "outside philippines", "abroad", "overseas"],
    response:
      "For international shipping availability, please contact us before placing your order so our team can confirm whether delivery to your location can be accommodated.",
  },
  {
    keywords: ["size", "sizing", "fit", "small", "medium", "large", "xl"],
    response:
      "Please check the available size information on the product page before adding an item to your cart. If you are unsure about the best fit, contact us and we will be happy to assist.",
  },
  {
    keywords: ["return", "refund", "exchange", "replace"],
    response:
      "For returns, exchanges, or order concerns, please contact us with your order details. Our team will review your request and let you know the available options.",
  },
  {
    keywords: [
      "contact",
      "email",
      "support",
      "customer service",
      "talk to someone",
      "human",
    ],
    response:
      "You can reach our team through the Contact Us page. Send us your name, email, phone number, and message, and we will get back to you as soon as possible.",
  },
  {
    keywords: ["cart", "clear cart", "empty cart"],
    response:
      "Your cart stays intact while you review your checkout. It is cleared automatically only after your pre-order has been submitted successfully.",
  },
  {
    keywords: ["confirm", "confirmation", "modal"],
    response:
      'When you click "Send Pre-order" on Checkout, a confirmation window will appear showing your total items and amount. You can cancel to review your order or confirm to submit it.',
  },
  {
    keywords: ["help", "what can you do"],
    response:
      "I can help explain how pre-orders work, payments, shipping, sizing, order status, returns, and how to contact Verde by Renzo.",
  },
];

const defaultResponse =
  "Thanks for your message! I may not have a specific answer for that yet. Please visit our Contact Us page for detailed assistance from the Verde by Renzo team.";

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Hello! Welcome to Verde by Renzo. How can I assist you today?",
      sender: "bot",
      timestamp: new Date(),
    },
  ]);

  const [inputValue, setInputValue] = useState("");

  const [isBotTyping, setIsBotTyping] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  const messageIdRef = useRef(2);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isBotTyping]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  const getNextMessageId = () => {
    const id = messageIdRef.current;

    messageIdRef.current += 1;

    return id;
  };

  const getBotResponse = (userMessage: string): string => {
    const normalizedMessage = userMessage.toLowerCase().trim();

    const matchedRule = botResponseRules.find((rule) =>
      rule.keywords.some((keyword) => normalizedMessage.includes(keyword)),
    );

    return matchedRule?.response || defaultResponse;
  };

  const sendMessage = (text: string) => {
    const trimmedMessage = text.trim();

    if (!trimmedMessage || isBotTyping) {
      return;
    }

    const userMessage: Message = {
      id: getNextMessageId(),
      text: trimmedMessage,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);

    setInputValue("");
    setIsBotTyping(true);

    window.setTimeout(() => {
      const botMessage: Message = {
        id: getNextMessageId(),
        text: getBotResponse(trimmedMessage),
        sender: "bot",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);

      setIsBotTyping(false);
    }, 650);
  };

  const handleSendMessage = () => {
    sendMessage(inputValue);
  };

  const handleQuickReply = (reply: string) => {
    sendMessage(reply);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* ======================= */}
      {/* CHAT BUTTON */}
      {/* ======================= */}

      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="group fixed bottom-6 right-6 z-[950] flex h-14 w-14 items-center justify-center rounded-full border border-[#c9a24f]/60 bg-[#111914] text-[#ddb45c] shadow-[0_12px_35px_rgba(10,20,14,0.3)] transition-all duration-300 hover:-translate-y-1 hover:border-[#e4c477] hover:bg-[#19261d] hover:shadow-[0_16px_40px_rgba(10,20,14,0.38)]"
          aria-label="Open chat"
        >
          <MessageCircle
            size={23}
            strokeWidth={1.7}
            className="transition-transform duration-300 group-hover:scale-105"
          />
        </button>
      )}

      {/* ======================= */}
      {/* CHAT WINDOW */}
      {/* ======================= */}

      {isOpen && (
        <div className="fixed inset-0 z-[950] flex h-full w-full flex-col overflow-hidden border border-[#c8b98f]/50 bg-[#fffdf8] shadow-[0_24px_70px_rgba(10,20,14,0.28)] md:bottom-6 md:right-6 md:left-auto md:top-auto md:h-[620px] md:w-[400px] md:rounded-[22px]">
          {/* HEADER */}

          <div className="relative flex items-center justify-between overflow-hidden border-b border-[#c9a24f]/30 bg-[#111914] px-5 py-4 text-[#f6f0e4]">
            <div className="pointer-events-none absolute -right-10 -top-12 h-28 w-28 rounded-full border border-[#c9a24f]/10" />
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#c9a24f]/45 bg-[#c9a24f]/10 text-[#ddb45c]">
                <Bot size={21} strokeWidth={1.7} />
              </div>

              <div>
                <h3 className="font-serif text-lg tracking-wide text-[#f8f3e9]">
                  Verde Concierge
                </h3>

                <p className="text-[10px] uppercase tracking-[0.18em] text-[#c9a24f]">
                  Personal shopping assistance
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="relative rounded-full border border-transparent p-2 text-[#d9d1c2] transition-all hover:border-[#c9a24f]/30 hover:bg-[#c9a24f]/10 hover:text-[#e5c16e]"
              aria-label="Close chat"
            >
              <X size={20} />
            </button>
          </div>

          {/* ======================= */}
          {/* MESSAGES */}
          {/* ======================= */}

          <div className="flex-1 space-y-5 overflow-y-auto bg-[#f5f1e8] p-5">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-2 ${
                  message.sender === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {message.sender === "bot" && (
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-[#c9a24f]/35 bg-[#111914]">
                    <Bot
                      size={15}
                      className="text-[#d7ad54]"
                      strokeWidth={1.7}
                    />
                  </div>
                )}

                <div
                  className={`max-w-[78%] rounded-2xl px-4 py-3 ${
                    message.sender === "user"
                      ? "rounded-tr-sm bg-[#18301f] text-[#fffaf0] shadow-[0_6px_18px_rgba(17,25,20,0.12)]"
                      : "rounded-tl-sm border border-[#ddd5c6] bg-[#fffdf9] text-[#20281f] shadow-[0_5px_16px_rgba(35,38,31,0.06)]"
                  }`}
                >
                  <p className="text-[13px] leading-relaxed">{message.text}</p>

                  <p
                    className={`mt-1 text-xs ${
                      message.sender === "user"
                        ? "text-[#bdcbbf]"
                        : "text-[#9b9283]"
                    }`}
                  >
                    {message.timestamp.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>

                {message.sender === "user" && (
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-[#c9a24f]/35 bg-[#18301f]">
                    <User
                      size={15}
                      className="text-[#e2bd6a]"
                      strokeWidth={1.7}
                    />
                  </div>
                )}
              </div>
            ))}

            {/* BOT TYPING */}

            {isBotTyping && (
              <div className="flex gap-2">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-[#c9a24f]/35 bg-[#111914]">
                  <Bot size={15} className="text-[#d7ad54]" strokeWidth={1.7} />
                </div>

                <div className="rounded-2xl rounded-tl-sm border border-[#ddd5c6] bg-[#fffdf9] px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-1">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#b18a3f] [animation-delay:-0.3s]" />

                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#b18a3f] [animation-delay:-0.15s]" />

                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#b18a3f]" />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* ======================= */}
          {/* QUICK REPLIES */}
          {/* ======================= */}

          {messages.length <= 2 && (
            <div className="border-t border-[#ded6c7] bg-[#fffdf9] px-5 py-3">
              <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.16em] text-[#8b7040]">
                May we help with
              </p>

              <div className="flex flex-wrap gap-2">
                {quickReplies.map((reply) => (
                  <button
                    type="button"
                    key={reply}
                    onClick={() => handleQuickReply(reply)}
                    disabled={isBotTyping}
                    className="rounded-full border border-[#d8c9a8] bg-[#faf6ed] px-3 py-1.5 text-[11px] text-[#294330] transition-all hover:border-[#b89043] hover:bg-[#f0e5ce] hover:text-[#172a1c] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {reply}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ======================= */}
          {/* INPUT */}
          {/* ======================= */}

          <div className="border-t border-[#ded6c7] bg-[#fffdf9] p-4">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isBotTyping}
                placeholder={
                  isBotTyping
                    ? "Verde Assistant is typing..."
                    : "Type your message..."
                }
                className="flex-1 rounded-full border border-[#d5ccbc] bg-[#faf8f2] px-4 py-2.5 text-sm text-[#20281f] placeholder:text-[#9c9589] focus:border-[#9d7a37] focus:outline-none focus:ring-2 focus:ring-[#c9a24f]/15 disabled:bg-[#efebe3]"
                aria-label="Chat message"
              />

              <button
                type="button"
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isBotTyping}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-[#c9a24f]/45 bg-[#111914] text-[#ddb45c] shadow-sm transition-all hover:bg-[#1b2b20] hover:text-[#edca7b] disabled:cursor-not-allowed disabled:border-[#d7d1c5] disabled:bg-[#dedbd3] disabled:text-[#aaa59b]"
                aria-label="Send message"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
