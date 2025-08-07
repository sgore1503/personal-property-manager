import { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, Send, Bot, User, Lightbulb, Loader2 } from 'lucide-react';
import { Property } from '@/types/property';
import { PropertyAIConsultant, ChatMessage } from '@/lib/aiConsultant';
import { useToast } from '@/hooks/use-toast';

interface AIChatConsultantProps {
  properties: Property[];
}

export const AIChatConsultant = ({ properties }: AIChatConsultantProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [consultant] = useState(() => new PropertyAIConsultant());
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadSuggestedQuestions();
    
    // Add welcome message
    const welcomeMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'assistant',
      content: `Hello! I'm your AI Property Investment Consultant. I've analyzed your portfolio of ${properties.length} properties and I'm ready to help you maximize your profits. 

I can provide advice on:
• Cash flow optimization strategies
• Rent pricing adjustments
• Property improvement recommendations  
• Refinancing opportunities
• Tax optimization strategies
• Market trend analysis

What would you like to discuss about your property portfolio?`,
      timestamp: new Date()
    };

    setMessages([welcomeMessage]);
  }, [properties.length]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadSuggestedQuestions = async () => {
    try {
      const questions = await consultant.getSuggestedQuestions(properties);
      setSuggestedQuestions(questions);
    } catch (error) {
      console.error('Failed to load suggested questions:', error);
    }
  };


  const sendMessage = async (messageText?: string) => {
    const text = messageText || inputMessage.trim();
    if (!text) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await consultant.getConsultation(text, properties);
      
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('AI consultation error:', error);
      toast({
        title: "Consultation Failed",
        description: error instanceof Error ? error.message : "Failed to get AI response. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };


  return (
    <Card className="flex flex-col h-[600px]">
      {/* Header */}
      <div className="flex items-center gap-2 p-4 border-b border-border">
        <Bot className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-foreground">AI Property Consultant</h3>
        <Badge variant="secondary" className="ml-auto text-xs">
          {properties.length} Properties Analyzed
        </Badge>
      </div>

      {/* Suggested Questions */}
      {messages.length <= 1 && suggestedQuestions.length > 0 && (
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="h-4 w-4 text-warning" />
            <span className="text-sm font-medium text-foreground">Suggested Questions</span>
          </div>
          <div className="space-y-1">
            {suggestedQuestions.map((question, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                className="text-left justify-start h-auto p-2 text-xs"
                onClick={() => sendMessage(question)}
              >
                {question}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.role === 'assistant' && (
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                    <Bot className="h-4 w-4 text-primary-foreground" />
                  </div>
                </div>
              )}
              
              <div className={`max-w-[80%] ${message.role === 'user' ? 'order-2' : ''}`}>
                <div
                  className={`rounded-lg p-3 ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted/50 text-foreground'
                  }`}
                >
                  <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>

              {message.role === 'user' && (
                <div className="flex-shrink-0 order-3">
                  <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              )}
            </div>
          ))}
          
          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <Bot className="h-4 w-4 text-primary-foreground" />
                </div>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Analyzing your portfolio...</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t border-border">
        <div className="flex gap-2">
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about rent optimization, cash flow improvements, or investment strategies..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button
            onClick={() => sendMessage()}
            disabled={isLoading || !inputMessage.trim()}
            size="sm"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};