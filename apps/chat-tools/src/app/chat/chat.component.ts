import { CommonModule } from "@angular/common";
import { Component, effect, ElementRef, inject, signal, ViewChild } from "@angular/core";
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { ToolRegistry } from "../tools/tool.registry";
import { Message, OllamaChatResponse, OllamaService } from "./ollama.service";

export interface ChatMessage {
  type: 'user' | 'assistant';
  content: string;
  timestamp: string;
  functionCall?: {
    name: string;
    parameters: Record<string, unknown>;
    status: 'success' | 'error';
    result?: string;
  };
}

export interface FunctionGemmaResponse {  name: string; parameters: Record<string, string> }

export interface ToolContext {
  definition: {
    name: string;
    description: string;
    parameters: {
      type: string;
      properties: Record<string, { type: string; description: string; enum?: string[] }>;
      required: string[];
    };
  }
  execute: (args: any) => string | void;
}

@Component({selector: 'app-chat', templateUrl: './chat.component.html', imports: [CommonModule, ReactiveFormsModule]})
export class ChatComponent {
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef<HTMLDivElement>;
  
  private readonly fb = inject(FormBuilder);
  private readonly ollamaService = inject(OllamaService);
  private readonly toolRegistry = inject(ToolRegistry);
  
  protected readonly isChatOpen = signal(false);
  protected readonly chatForm: FormGroup = this.fb.group({
    message: ['', Validators.required]
  });

  // Chat messages signal - starts empty
  protected readonly chatMessages = signal<ChatMessage[]>([]);
  
  // Track if we're currently processing a message to avoid duplicate calls
  private isProcessing = false;
  private readonly model = 'functiongemma:270m';

  constructor() {
    // Auto-scroll to bottom when messages change
    effect(() => {
      this.chatMessages(); // Track changes
      this.scrollToBottom();
    });

    // Auto-scroll when chat opens
    effect(() => {
      if (this.isChatOpen()) {
        setTimeout(() => this.scrollToBottom(), 100);
      }
    });
  }
  
  toggleChat() {
    this.isChatOpen.update(open => !open);
  }

  private scrollToBottom(): void {
    if (this.messagesContainer) {
      const element = this.messagesContainer.nativeElement;
      element.scrollTop = element.scrollHeight;
    }
  }

  formatParameters(params: Record<string, unknown>): string {
    return JSON.stringify(params, null, 2);
  }

  onSubmit() {
    if (this.chatForm.valid && !this.isProcessing) {
      const messageText = this.chatForm.get('message')?.value;
      
      if (messageText && messageText.trim()) {
        // Add user message to signal
        const userMessage: ChatMessage = {
          type: 'user',
          content: messageText,
          timestamp: new Date().toLocaleTimeString()
        };
        
        this.chatMessages.update(messages => [...messages, userMessage]);
        this.chatForm.reset();
        
        // Automatically call Ollama when user message is added
        this.callOllama(messageText);
      }
    }
  }

  private callOllama(userMessage: string, conversationHistory: Message[] = [], previousFunctionCall?: { name: string; parameters: Record<string, unknown>; status: 'success' | 'error'; result?: string }) {
    if (this.isProcessing) return;
    
    this.isProcessing = true;
    const messages: Message[] = conversationHistory.length > 0 
      ? conversationHistory 
      : userMessage ? [{ role: 'user', content: userMessage }] : [];
    
    this.ollamaService.chatWithTools(this.model, messages, this.toolRegistry.getAll()).subscribe({
      next: (response) => {
        console.log('Response:', response.message);
        const functionCall = this.resolveFunctionCall(response);
        
        if (functionCall) {
          // Execute the tool
          try {
            const toolContext = this.toolRegistry.getByName(functionCall.name);
            if (toolContext) {
              const result = toolContext.execute(functionCall.parameters);
              if (result !== undefined) {
                functionCall.result = result;
              }
            } else {
              functionCall.status = 'error';
              functionCall.result = `Tool ${functionCall.name} not found`;
            }
          } catch (error) {
            console.error('Tool execution error:', error);
            functionCall.status = 'error';
            functionCall.result = `Error executing tool: ${error}`;
          }
          
          // Continue conversation with tool result (don't add message yet)
          const updatedHistory: Message[] = [
            ...messages,
            { role: 'assistant', content: response.message.content || '', tool_calls: response.message.tool_calls },
            { role: 'tool', name: functionCall.name, content: functionCall.result || '' }
          ];
          
          // Make another call to get the final response, passing the function call info
          this.isProcessing = false;
          this.callOllama('', updatedHistory, functionCall);
        } else {
          // No tool call - this is the final response
          const assistantMessage: ChatMessage = {
            type: 'assistant',
            content: response.message.content || 'No response',
            timestamp: new Date().toLocaleTimeString(),
            ...(previousFunctionCall && {
              functionCall: {
                ...previousFunctionCall,
                status: 'success' as const
              }
            })
          };
          
          this.chatMessages.update(messages => [...messages, assistantMessage]);
          this.isProcessing = false;
        }
      },
      error: (error) => {
        console.error('Ollama error:', error);
        this.isProcessing = false;
        
        // Add error message
        const errorMessage: ChatMessage = {
          type: 'assistant',
          content: 'Error processing request',
          timestamp: new Date().toLocaleTimeString(),
          functionCall: {
            name: 'unknown',
            parameters: {},
            status: 'error'
          }
        };
        
        this.chatMessages.update(messages => [...messages, errorMessage]);
      }
    });
  }

  private resolveFunctionCall(response: OllamaChatResponse): { name: string; parameters: Record<string, unknown>; status: 'success' | 'error'; result?: string } | undefined {
    // Check if tool_calls exists
    if (response.message.tool_calls?.length) {
      const tool = response.message.tool_calls[0].function;
      return {
        name: tool.name,
        parameters: tool.arguments as Record<string, unknown>,
        status: 'success'
      };
      
      
    } else if (response.message.content) {
      // Try to parse JSON from content
      try {
        const parsed = JSON.parse(response.message.content) as { name: string; parameters?: Record<string, unknown>; arguments?: Record<string, unknown> };
        // FunctionGemma uses 'arguments', but interface expects 'parameters' - normalize it
        const params = parsed.arguments || parsed.parameters || {};
        
        return {
          name: parsed.name,
          parameters: params as Record<string, unknown>,
          status: 'success',
        };
      } catch {
        // Not a tool call, just regular content - ignore for command-based system
        console.log('Regular content response (ignored):', response.message.content);
      }
    }
    return undefined;
  }
}