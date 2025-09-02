import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import {
  ChevronDown,
  ChevronRight,
  Clock,
  ExternalLink,
  FileText,
  Headphones,
  HelpCircle,
  Mail,
  MessageCircle,
  Phone,
  RefreshCw,
  Send,
} from "lucide-react";
import React, { useState } from "react";

// API function for submitting support ticket
const submitSupportTicket = async (userId: number, ticketData: any) => {
  const response = await fetch("/api/support/tickets", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({
      userId,
      ...ticketData,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to submit support ticket");
  }

  return response.json();
};

// FAQ Data
const FAQ_DATA = [
  {
    category: "Account & Security",
    questions: [
      {
        question: "How do I verify my account?",
        answer:
          "To verify your account, go to your Profile page and upload the required documents including a government-issued ID and proof of address. Verification typically takes 1-3 business days.",
      },
      {
        question: "How do I change my password?",
        answer:
          "Go to Profile > Security tab and use the Change Password form. You'll need to enter your current password and choose a new secure password.",
      },
      {
        question: "Is my personal information secure?",
        answer:
          "Yes, we use bank-level encryption and security measures to protect your personal and financial information. We never share your data with third parties without your consent.",
      },
    ],
  },
  {
    category: "Deposits & Investments",
    questions: [
      {
        question: "How do I make a deposit?",
        answer:
          "Go to the Deposit page, select an investment plan, choose your payment method (cryptocurrency), and follow the instructions. Make sure to submit your transaction hash for verification.",
      },
      {
        question: "What cryptocurrencies do you accept?",
        answer:
          "We accept Bitcoin (BTC), Ethereum (ETH), USDT (TRC20), and BNB (BSC). More cryptocurrencies may be added in the future.",
      },
      {
        question: "How long does it take for deposits to be processed?",
        answer:
          "Cryptocurrency deposits are typically processed within 1-24 hours after submission of the transaction hash and network confirmation.",
      },
      {
        question: "What are the minimum and maximum deposit amounts?",
        answer:
          "Minimum deposit varies by investment plan, typically starting from $100. Maximum amounts depend on your account verification level and selected plan.",
      },
    ],
  },
  {
    category: "Withdrawals",
    questions: [
      {
        question: "How do I withdraw my funds?",
        answer:
          "Go to the Withdraw page, enter the amount you wish to withdraw, select your preferred cryptocurrency, and provide your wallet address. Withdrawals require admin approval.",
      },
      {
        question: "How long do withdrawals take?",
        answer:
          "Withdrawals are typically processed within 24-48 hours after admin approval. Network confirmation may take additional time depending on the cryptocurrency.",
      },
      {
        question: "Are there any withdrawal fees?",
        answer:
          "Yes, network fees apply based on the cryptocurrency you choose. These fees cover blockchain transaction costs and are clearly displayed before you confirm your withdrawal.",
      },
      {
        question: "What is the minimum withdrawal amount?",
        answer:
          "The minimum withdrawal amount is $10 for most cryptocurrencies. This may vary depending on network fees and the specific cryptocurrency.",
      },
    ],
  },
  {
    category: "Trading & Returns",
    questions: [
      {
        question: "How are investment returns calculated?",
        answer:
          "Returns are calculated based on your selected investment plan's rate and duration. Daily profits are added to your account balance automatically.",
      },
      {
        question: "Can I cancel my investment before maturity?",
        answer:
          "Investment terms vary by plan. Some plans allow early withdrawal with penalties, while others require completion of the full term. Check your specific plan details.",
      },
      {
        question: "How can I track my investment performance?",
        answer:
          "Visit your Portfolio page to see detailed information about your active investments, returns, and performance metrics.",
      },
    ],
  },
];

// Contact information
const CONTACT_INFO = [
  {
    icon: Mail,
    title: "Email Support",
    value: "support@axixfinance.com",
    description: "Get help via email within 24 hours",
    action: "Send Email",
  },
  {
    icon: MessageCircle,
    title: "Live Chat",
    value: "Available 24/7",
    description: "Instant support via live chat",
    action: "Start Chat",
  },
  {
    icon: Phone,
    title: "Phone Support",
    value: "+1 (555) 123-4567",
    description: "Speak with our support team",
    action: "Call Now",
  },
];

const NewSupport: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState("faq");
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);

  // Support ticket form state
  const [ticketForm, setTicketForm] = useState({
    subject: "",
    category: "general",
    priority: "medium",
    message: "",
    attachments: [],
  });

  // Submit support ticket mutation
  const submitTicketMutation = useMutation({
    mutationFn: (data: any) => submitSupportTicket(user?.id as number, data),
    onSuccess: () => {
      setTicketForm({
        subject: "",
        category: "general",
        priority: "medium",
        message: "",
        attachments: [],
      });
      toast({
        title: "Ticket Submitted",
        description:
          "Your support ticket has been submitted successfully. We'll respond within 24 hours.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Submission Failed",
        description: error.message || "Failed to submit support ticket.",
        variant: "destructive",
      });
    },
  });

  // Handle ticket form submit
  const handleTicketSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!ticketForm.subject.trim() || !ticketForm.message.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    submitTicketMutation.mutate(ticketForm);
  };

  // Toggle FAQ expansion
  const toggleFaq = (id: string) => {
    setExpandedFaq(expandedFaq === id ? null : id);
  };

  // Get priority badge
  const getPriorityBadge = (priority: string) => {
    const styles = {
      low: { bg: "bg-blue-100", text: "text-blue-800" },
      medium: { bg: "bg-yellow-100", text: "text-yellow-800" },
      high: { bg: "bg-red-100", text: "text-red-800" },
    };

    const style = styles[priority as keyof typeof styles] || styles.medium;

    return (
      <Badge className={`${style.bg} ${style.text} border-0 text-xs`}>
        {priority.charAt(0).toUpperCase() + priority.slice(1)}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <HelpCircle className="h-8 w-8 text-blue-600" />
          Help & Support
        </h1>
        <p className="text-gray-600 mt-2">
          Get help with your account, find answers to common questions, or
          contact our support team.
        </p>
      </div>

      {/* Quick Contact Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {CONTACT_INFO.map((contact, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-blue-100 rounded-full">
                  <contact.icon className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold">{contact.title}</h3>
                  <p className="text-sm text-gray-600">{contact.value}</p>
                </div>
              </div>
              <p className="text-sm text-gray-500 mb-4">
                {contact.description}
              </p>
              <Button variant="outline" className="w-full">
                <ExternalLink className="h-4 w-4 mr-2" />
                {contact.action}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="faq">FAQ</TabsTrigger>
          <TabsTrigger value="contact">Contact Support</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
        </TabsList>

        {/* FAQ Tab */}
        <TabsContent value="faq" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Frequently Asked Questions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {FAQ_DATA.map((category, categoryIndex) => (
                  <div key={categoryIndex}>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      {category.category}
                    </h3>
                    <div className="space-y-2">
                      {category.questions.map((faq, faqIndex) => {
                        const faqId = `${categoryIndex}-${faqIndex}`;
                        const isExpanded = expandedFaq === faqId;

                        return (
                          <div
                            key={faqIndex}
                            className="border border-gray-200 rounded-lg"
                          >
                            <button
                              onClick={() => toggleFaq(faqId)}
                              className="w-full p-4 text-left flex items-center justify-between hover:bg-gray-50"
                            >
                              <span className="font-medium">
                                {faq.question}
                              </span>
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4 text-gray-500" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-gray-500" />
                              )}
                            </button>
                            {isExpanded && (
                              <div className="px-4 pb-4 border-t border-gray-100">
                                <p className="text-gray-600 pt-3">
                                  {faq.answer}
                                </p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contact Support Tab */}
        <TabsContent value="contact" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Submit a Support Ticket
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleTicketSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="subject">Subject</Label>
                    <Input
                      id="subject"
                      placeholder="Brief description of your issue"
                      value={ticketForm.subject}
                      onChange={(e) =>
                        setTicketForm((prev) => ({
                          ...prev,
                          subject: e.target.value,
                        }))
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <select
                      id="category"
                      value={ticketForm.category}
                      aria-label="Support ticket category"
                      onChange={(e) =>
                        setTicketForm((prev) => ({
                          ...prev,
                          category: e.target.value,
                        }))
                      }
                      className="w-full h-10 pl-3 pr-10 py-2 border rounded-md bg-background text-foreground"
                    >
                      <option value="general">General Question</option>
                      <option value="account">Account Issues</option>
                      <option value="deposit">Deposit Problems</option>
                      <option value="withdrawal">Withdrawal Issues</option>
                      <option value="technical">Technical Support</option>
                      <option value="billing">Billing Questions</option>
                    </select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="priority">Priority Level</Label>
                  <select
                    id="priority"
                    value={ticketForm.priority}
                    aria-label="Support ticket priority"
                    onChange={(e) =>
                      setTicketForm((prev) => ({
                        ...prev,
                        priority: e.target.value,
                      }))
                    }
                    className="w-full h-10 pl-3 pr-10 py-2 border rounded-md bg-background text-foreground"
                  >
                    <option value="low">Low - General question</option>
                    <option value="medium">Medium - Account issue</option>
                    <option value="high">High - Urgent problem</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    placeholder="Please describe your issue in detail..."
                    value={ticketForm.message}
                    onChange={(e) =>
                      setTicketForm((prev) => ({
                        ...prev,
                        message: e.target.value,
                      }))
                    }
                    rows={6}
                    required
                  />
                </div>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Clock className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-1">Response Times:</p>
                      <ul className="space-y-1 text-xs">
                        <li>• Low Priority: Within 48 hours</li>
                        <li>• Medium Priority: Within 24 hours</li>
                        <li>• High Priority: Within 4 hours</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={submitTicketMutation.isPending}
                >
                  {submitTicketMutation.isPending ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Submit Ticket
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Resources Tab */}
        <TabsContent value="resources" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Documentation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button variant="outline" className="w-full justify-start">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Getting Started Guide
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Investment Plans Overview
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Security Best Practices
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Terms of Service
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Headphones className="h-5 w-5" />
                  Additional Support
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-3 border border-gray-200 rounded-lg">
                    <h4 className="font-medium mb-1">Community Forum</h4>
                    <p className="text-sm text-gray-600 mb-2">
                      Connect with other users and get community support
                    </p>
                    <Button variant="outline" size="sm">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Visit Forum
                    </Button>
                  </div>

                  <div className="p-3 border border-gray-200 rounded-lg">
                    <h4 className="font-medium mb-1">Video Tutorials</h4>
                    <p className="text-sm text-gray-600 mb-2">
                      Watch step-by-step guides for common tasks
                    </p>
                    <Button variant="outline" size="sm">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Watch Videos
                    </Button>
                  </div>

                  <div className="p-3 border border-gray-200 rounded-lg">
                    <h4 className="font-medium mb-1">Status Page</h4>
                    <p className="text-sm text-gray-600 mb-2">
                      Check platform status and scheduled maintenance
                    </p>
                    <Button variant="outline" size="sm">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Status
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default NewSupport;
