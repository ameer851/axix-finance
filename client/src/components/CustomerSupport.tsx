// filepath: c:\Users\BABA\Documents\CaraxFinance\client\src\components\CustomerSupport.tsx
import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';
import './CustomerSupport.css';

interface CustomerSupportProps {
  whatsappNumber?: string;
}

interface Message {
  text: string;
  isUser: boolean;
  timestamp: Date | string;
}

const CustomerSupport: React.FC<CustomerSupportProps> = ({ whatsappNumber = "" }) => {
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { 
      text: "Hello! Welcome to Carax Finance support. How can I assist you today?", 
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [conversationEnded, setConversationEnded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [location] = useLocation();

  // Auto-scroll to bottom when messages update
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Focus input field when chat opens
  useEffect(() => {
    if (isChatbotOpen && !conversationEnded) {
      inputRef.current?.focus();
    }
  }, [isChatbotOpen, conversationEnded]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const toggleChatbot = () => {
    setIsChatbotOpen(!isChatbotOpen);
    if (!isChatbotOpen && conversationEnded) {
      // Reset conversation when reopening after it was ended
      setMessages([
        { 
          text: "Hello! Welcome to Carax Finance support. How can I assist you today?", 
          isUser: false,
          timestamp: new Date()
        }
      ]);
      setConversationEnded(false);
    }
  };

  const handleWhatsappClick = () => {
    if (whatsappNumber) {
      window.open(`https://wa.me/${whatsappNumber}`, '_blank', 'noopener,noreferrer');
    } else {
      // If WhatsApp number is not provided yet, show a message
      addBotMessage("WhatsApp support will be available soon! In the meantime, please use this chat for assistance.");
      setIsChatbotOpen(true);
    }
  };

  // Function to add a bot message
  const addBotMessage = (text: string) => {
    setMessages(prev => [
      ...prev,
      { text, isUser: false, timestamp: new Date() }
    ]);
  };

  // Process user input and generate appropriate response
  const processUserInput = (userInput: string) => {
    const lowerInput = userInput.toLowerCase().trim();
    
    // Check for conversation ending phrases
    if (["thank you", "thanks", "okay", "ok", "bye", "goodbye"].some(phrase => lowerInput.includes(phrase))) {
      setIsTyping(true);
      setTimeout(() => {
        addBotMessage("You're welcome! Thank you for chatting with Carax Finance support. Have a great day!");
        setIsTyping(false);
        setConversationEnded(true);
      }, 1000);
      return;
    }

    // Check for greetings
    if (["hello", "hi", "hey", "greetings"].some(greeting => lowerInput.includes(greeting))) {
      setIsTyping(true);
      setTimeout(() => {
        addBotMessage("Hello! How can I help you with your Carax Finance experience today?");
        setIsTyping(false);
      }, 1000);
      return;
    }

    // Check for account-related questions
    if (lowerInput.includes("account") || lowerInput.includes("sign up") || lowerInput.includes("register")) {
      setIsTyping(true);
      setTimeout(() => {
        addBotMessage("To create an account, click the 'Sign Up' button on our homepage. You'll need to provide some basic information and verify your email address. If you're having issues with your existing account, please provide more details.");
        setIsTyping(false);
      }, 1500);
      return;
    }

    // Check for investment-related questions
    if (lowerInput.includes("invest") || lowerInput.includes("portfolio") || lowerInput.includes("return")) {
      setIsTyping(true);
      setTimeout(() => {
        addBotMessage("Carax Finance offers various investment options with competitive returns. Our portfolio management tools help you track performance and make informed decisions. Would you like to know more about specific investment products?");
        setIsTyping(false);
      }, 1500);
      return;
    }

    // Check for deposit/withdrawal questions
    if (lowerInput.includes("deposit") || lowerInput.includes("withdrawal") || lowerInput.includes("transaction")) {
      setIsTyping(true);
      setTimeout(() => {
        addBotMessage("We support multiple deposit and withdrawal methods, including bank transfers and cryptocurrencies. Transactions are typically processed within 1-2 business days. For urgent transaction inquiries, please contact our support team via WhatsApp.");
        setIsTyping(false);
      }, 1500);
      return;
    }

    // Check for contact/support questions
    if (lowerInput.includes("contact") || lowerInput.includes("support") || lowerInput.includes("help")) {
      setIsTyping(true);
      setTimeout(() => {
        addBotMessage("Our support team is available 24/7. For immediate assistance, please use our WhatsApp support. You can also email us at support@caraxfinance.com or call our helpline at +1-800-CARAX-FIN.");
        setIsTyping(false);
      }, 1500);
      return;
    }

    // Default response for unrecognized queries
    setIsTyping(true);
    setTimeout(() => {
      addBotMessage("Thank you for your message. Our team will get back to you shortly. For immediate assistance, please use our WhatsApp support.");
      setIsTyping(false);
    }, 1500);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    // Add user message
    const userMessage = { text: inputValue, isUser: true, timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    
    // Clear input field
    setInputValue("");
    
    // Process user input and generate response
    processUserInput(inputValue);
  };

  // Format time for the chat
  const formatTime = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      {/* WhatsApp and Chatbot buttons - bottom right, stacked */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end space-y-3">
        <Button
          onClick={handleWhatsappClick}
          className="rounded-full h-14 w-14 bg-green-500 hover:bg-green-600 p-0 flex items-center justify-center shadow-lg"
          aria-label="Contact us on WhatsApp"
          title="Chat with us on WhatsApp"
        >
          <FaWhatsapp size={30} className="text-white" />
        </Button>

        {/* Chatbot - fixed on right */}
        {isChatbotOpen && (
          <div 
            className="mb-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg w-80 sm:w-96 overflow-hidden animate-in slide-in-from-right border border-amber-600 dark:border-amber-700"
            role="dialog"
            aria-labelledby="chat-heading"
          >
            {/* Header - Brown */}
            <div className="bg-amber-800 dark:bg-amber-900 text-white p-3 flex justify-between items-center">
              <div className="flex items-center">
                <div className="h-8 w-8 rounded-full bg-amber-600 flex items-center justify-center text-white font-bold mr-2" aria-hidden="true">CF</div>
                <div>
                  <h3 id="chat-heading" className="font-semibold">Carax Finance Support</h3>
                  <p className="text-xs text-amber-300">We typically reply in a few minutes</p>
                </div>
              </div>
              <button 
                onClick={toggleChatbot}
                className="text-white hover:text-amber-200 transition-colors"
                aria-label="Close chat"
              >
                <X size={20} />
              </button>
            </div>
            
            {/* Chat messages - White background */}
            <div 
              className="h-80 overflow-y-auto p-4 space-y-3 bg-white dark:bg-gray-800"
              aria-live="polite"
              aria-relevant="additions"
              role="log"
            >
              {messages.map((message, index) => (
                <div 
                  key={index} 
                  className={`flex ${message.isUser ? 'justify-end' : 'justify-start'} mb-2`}
                >
                  <div 
                    className={`relative max-w-[80%] px-4 py-2 rounded-lg shadow ${
                      message.isUser 
                        ? 'bg-amber-600 text-white rounded-tr-none' 
                        : 'bg-amber-100 dark:bg-amber-800 text-amber-900 dark:text-white rounded-tl-none'
                    }`}
                    {...(!message.isUser ? { role: 'status' } : {})}
                  >
                    <p>{message.text}</p>
                    <span 
                      className={`text-xs mt-1 block text-right ${
                        message.isUser 
                          ? 'text-amber-200'
                          : 'text-amber-700 dark:text-amber-300'
                      }`}
                      aria-label={`Sent at ${formatTime(message.timestamp)}`}
                    >
                      {formatTime(message.timestamp)}
                    </span>
                  </div>
                </div>
              ))}
              
              {/* Typing indicator */}
              {isTyping && (
                <div className="flex justify-start mb-2">
                  <div className="bg-amber-100 dark:bg-amber-800 text-amber-900 dark:text-white px-4 py-2 rounded-lg rounded-tl-none shadow">
                    <div className="flex space-x-1" aria-label="Support agent is typing">
                      <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce delay-0"></div>
                      <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce delay-200"></div>
                      <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce delay-400"></div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Reference for auto-scroll */}
              <div ref={messagesEndRef} />
            </div>
            
            {/* Input area - White with brown accents */}
            <form onSubmit={handleSendMessage} className="p-3 border-t border-amber-200 dark:border-amber-700 flex items-center bg-white dark:bg-gray-800">
              <label htmlFor="chat-input" className="sr-only">Type your message</label>
              <input
                id="chat-input"
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Type your message..."
                disabled={conversationEnded}
                className="flex-1 p-2 border border-amber-300 dark:border-amber-700 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-amber-400 dark:placeholder-amber-300"
                aria-describedby={conversationEnded ? "conversation-ended" : undefined}
              />
              <button 
                type="submit"
                disabled={!inputValue.trim() || conversationEnded}
                className={`p-2 rounded-r-lg flex items-center justify-center ${
                  inputValue.trim() && !conversationEnded
                    ? 'bg-amber-600 hover:bg-amber-700 text-white' 
                    : 'bg-amber-300 text-amber-100 cursor-not-allowed'
                }`}
                aria-label="Send message"
              >
                <Send size={20} aria-hidden="true" />
              </button>
            </form>
            
            {/* End conversation message */}
            {conversationEnded && (
              <div 
                id="conversation-ended"
                className="p-2 bg-amber-50 dark:bg-amber-900 text-center text-sm text-amber-800 dark:text-amber-300 border-t border-amber-200 dark:border-amber-700"
                role="status"
              >
                Conversation ended. Click the chat icon to start a new conversation.
              </div>
            )}
          </div>
        )}

        {/* Chat button - brown */}
        <Button
          onClick={toggleChatbot}
          className="rounded-full h-14 w-14 bg-amber-700 hover:bg-amber-800 p-0 flex items-center justify-center shadow-lg"
          aria-label={isChatbotOpen ? "Close chat" : "Chat with support"}
          aria-expanded={isChatbotOpen}
          aria-haspopup="dialog"
          title="Chat with Carax Finance support"
        >
          <MessageCircle size={26} className="text-white" aria-hidden="true" />
        </Button>
      </div>
    </>
  );
};

export default CustomerSupport;