import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'wouter';
import { MessageSquare, X, Send, MessageCircle } from 'lucide-react';

const initialMessages = [
  {
    id: 'greeting',
    text: 'Salaam! Welcome to Godol Institute of Business. How can I help you today?',
    isBot: true
  }
];

const quickPrompts = [
  'Tell me about your courses',
  'How do I enroll?',
  'When is the next workshop?',
  'What are the fees?',
  'Talk to an advisor'
];

const answers = {
  'Tell me about your courses':
    'We offer practical business programs covering Entrepreneurship, Financial Management, Business Strategy, Digital Marketing, Leadership, and more, all tailored to East African commercial reality. You can view all published courses at /courses.',
  'How do I enroll?':
    'Enrolling is simple: browse our courses catalog, select your program, and click Enroll Now. We support local mobile money (EVC Plus, Zaad, Sahal, Premier Wallet) with manual verification.',
  'When is the next workshop?':
    'Our upcoming executive workshop dates and cohort schedules are updated regularly. You can view active workshops on our Workshops page (/categories) or speak with admissions directly.',
  'What are the fees?':
    'Tuition varies by program level and duration. Each course lists its transparent pricing on its overview page, including accredited certificates of completion.',
  'Talk to an advisor':
    "We'd love to connect with you directly! Click 'Chat on WhatsApp' below to speak immediately with a Godol Institute admissions counselor."
};

const WHATSAPP_NUMBER = '252905139816';

export default function ChatWidget() {
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState(initialMessages);
  const [inputText, setInputText] = useState('');
  const [hasUnread, setHasUnread] = useState(true);
  const messagesEndRef = useRef(null);

  // Do not show the student advisory widget on admin or instructor portals
  if (location.startsWith('/admin') || location.startsWith('/instructor')) {
    return null;
  }

  useEffect(() => {
    if (isOpen) setHasUnread(false);
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (textToSend) => {
    const text = (textToSend || inputText).trim();
    if (!text) return;

    const userMsg = {
      id: Date.now().toString(),
      text,
      isBot: false
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');

    const botResponse = answers[text];
    setTimeout(() => {
      const reply = {
        id: (Date.now() + 1).toString(),
        text:
          botResponse ||
          'Thank you for your message. Our admissions team is available to assist you. You can also chat directly on WhatsApp for immediate guidance.',
        isBot: true
      };
      setMessages((prev) => [...prev, reply]);
    }, 600);
  };

  const handleWhatsAppClick = () => {
    const lastUserMsg = [...messages].reverse().find((m) => !m.isBot);
    const text = encodeURIComponent(
      lastUserMsg
        ? `Hi Godol Institute, I have a question: ${lastUserMsg.text}`
        : 'Hi Godol Institute, I would like to know more about your business programs.'
    );
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${text}`, '_blank');
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3 max-w-[calc(100vw-2rem)]">
      {isOpen && (
        <div className="w-[340px] sm:w-[380px] max-w-[calc(100vw-2rem)] liquid-glass liquid-glass-modal liquid-glass-squircle overflow-hidden flex flex-col h-[500px] animate-in fade-in slide-in-from-bottom-5 duration-300">
          {/* Header */}
          <div className="bg-primary text-primary-foreground p-4 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-accent text-foreground flex items-center justify-center font-bold text-sm">
                GI
              </div>
              <div>
                <h4 className="font-semibold text-sm">Godol Advisory</h4>
                <p className="text-xs text-primary-foreground/70 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  Online • Bosaso
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-primary-foreground/70 hover:text-white transition-colors"
              aria-label="Close chat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages list */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-muted/20">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.isBot ? 'justify-start' : 'justify-end'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-line shadow-sm ${
                    msg.isBot
                      ? 'bg-card text-foreground border border-border'
                      : 'bg-primary text-primary-foreground'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts */}
          <div className="px-3 py-2 border-t border-border bg-card flex gap-1.5 overflow-x-auto whitespace-nowrap">
            {quickPrompts.map((prompt) => (
              <button
                key={prompt}
                onClick={() => handleSend(prompt)}
                className="text-xs px-2.5 py-1 rounded-full border border-border bg-muted/50 hover:bg-muted text-foreground transition-colors shrink-0"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Input & WhatsApp Action */}
          <div className="p-3 border-t border-border bg-card flex flex-col gap-2">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Ask about courses, admissions..."
                className="flex-1 text-sm bg-muted/40 border border-border rounded-xl px-3.5 py-2 outline-none focus:border-primary text-foreground"
              />
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="p-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 transition-all"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>

            <button
              onClick={handleWhatsAppClick}
              className="flex items-center justify-center gap-2 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white font-medium text-xs transition-colors shadow-sm"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Chat on WhatsApp (+252 905139816)</span>
            </button>
          </div>
        </div>
      )}

      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-14 h-14 rounded-full shadow-2xl flex items-center justify-center text-primary-foreground transition-all duration-300 hover:scale-105 active:scale-95 border border-white/30 backdrop-blur-md"
        style={{ background: 'linear-gradient(135deg, hsl(215 72% 26%) 0%, hsl(215 72% 18%) 100%)', boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.4), 0 12px 30px -4px rgba(15, 23, 42, 0.35)' }}
        aria-label="Open Advisory Chat"
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <>
            <MessageSquare className="w-6 h-6 text-accent" />
            {hasUnread && (
              <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-accent rounded-full border-2 border-primary animate-ping" />
            )}
          </>
        )}
      </button>
    </div>
  );
}

