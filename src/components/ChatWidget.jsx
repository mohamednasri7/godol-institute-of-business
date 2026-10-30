import React, { useState, useRef, useEffect } from 'react';
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
    'We offer 40+ business courses covering Entrepreneurship, Financial Management, Business Strategy, Digital Marketing, Leadership, and more. All designed for the East African market. Browse at /courses',
  'How do I enroll?':
    'Enrolling is easy! Create a free account on our website, browse courses, and click Enroll. For in-person workshops, seats are limited — register early. Want a link to enroll?',
  'When is the next workshop?':
    'Our next live workshops in Mogadishu are:\n• Strategic Business Planning — June 14-15, 2026\n• Financial Modeling — July 5, 2026\n• Leadership Workshop — July 19-20, 2026\nWould you like to reserve a seat?',
  'What are the fees?':
    'Course fees vary by program. Online courses range from $49–$199. Live workshops are priced separately. We also offer scholarship programs for women in business. Shall I connect you with an advisor for a full fee schedule?',
  'Talk to an advisor':
    "I'll connect you directly with a Godol Institute advisor on WhatsApp right now. Click 'Chat on WhatsApp' below to continue your conversation with our team."
};

const WHATSAPP_NUMBER = '252610000000';

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState(initialMessages);
  const [inputText, setInputText] = useState('');
  const [hasUnread, setHasUnread] = useState(true);
  const messagesEndRef = useRef(null);

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
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {isOpen && (
        <div className="w-[340px] sm:w-[380px] rounded-2xl overflow-hidden shadow-2xl border border-border bg-card flex flex-col h-[500px] animate-in fade-in slide-in-from-bottom-5 duration-200">
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
                  Online • Mogadishu
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
              <span>Chat on WhatsApp (+252 61 000 0000)</span>
            </button>
          </div>
        </div>
      )}

      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-14 h-14 rounded-full shadow-2xl flex items-center justify-center text-primary-foreground transition-transform hover:scale-105 active:scale-95"
        style={{ background: 'hsl(215 72% 24%)' }}
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

