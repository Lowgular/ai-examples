import { CommonModule } from "@angular/common";
import { Component, inject, signal } from "@angular/core";
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { ThemeService } from "../theme/theme.service";
import { Message, OllamaService } from "./ollama.service";

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
  private readonly fb = inject(FormBuilder);
  private readonly ollamaService = inject(OllamaService);
  private readonly themeService = inject(ThemeService);
  
  protected readonly isChatOpen = signal(false);
  protected readonly chatForm: FormGroup = this.fb.group({
    message: ['', Validators.required]
  });

  private readonly TOOLS: Record<string, ToolContext> = {
    'change_theme': { 
      execute: (args: { theme: 'light' | 'dark' }) => {
        this.themeService.changeTheme(args.theme);
        return `Theme changed to ${args.theme}`;
      }, 
      definition: {
        name: 'change_theme',
        description: 'Change the theme of the application.',
        parameters: {
          type: 'object',
          properties: {
            theme: { type: 'string', description: 'The theme to change to', enum: ['light', 'dark'] },
          },
          required: ['theme'],
        },
      },
    },
  };

  get tools() {
    return Object.values(this.TOOLS).map(tool => ({
      type: 'function' as const,
      function: tool.definition
    }));
  }

  // Chat messages signal - starts empty
  protected readonly chatMessages = signal<ChatMessage[]>([]);
  
  // Track if we're currently processing a message to avoid duplicate calls
  private isProcessing = false;
  private readonly model = 'functiongemma:270m';
  
  toggleChat() {
    this.isChatOpen.update(open => !open);
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

  private callOllama(userMessage: string) {
    if (this.isProcessing) return;
    
    this.isProcessing = true;
    const messages: Message[] = [
      { role: 'user', content: userMessage }
    ];
    
    this.ollamaService.chatWithTools(this.model, messages, this.tools).subscribe({
      next: (response) => {
        console.log('Response:', response.message);
        
        let functionCall: { name: string; parameters: Record<string, unknown>; status: 'success' | 'error'; result?: string } | undefined;
        
        // Check if tool_calls exists
        if (response.message.tool_calls?.length) {
          const tool = response.message.tool_calls[0].function;
          functionCall = {
            name: tool.name,
            parameters: tool.arguments as Record<string, unknown>,
            status: 'success'
          };
          
          // Execute the tool
          try {
            const toolContext = this.TOOLS[tool.name];
            if (toolContext) {
              const result = toolContext.execute(tool.arguments);
              if (result !== undefined) {
                functionCall.result = result;
              }
            } else {
              functionCall.status = 'error';
            }
          } catch (error) {
            console.error('Tool execution error:', error);
            functionCall.status = 'error';
          }
        } else if (response.message.content) {
          // Try to parse JSON from content
          try {
            const parsed = JSON.parse(response.message.content) as { name: string; parameters?: Record<string, unknown>; arguments?: Record<string, unknown> };
            // FunctionGemma uses 'arguments', but interface expects 'parameters' - normalize it
            const params = parsed.arguments || parsed.parameters || {};
            
            functionCall = {
              name: parsed.name,
              parameters: params as Record<string, unknown>,
              status: 'success',
            };
            
            // Execute the tool
            try {
              const toolContext = this.TOOLS[parsed.name];
              if (toolContext) {
                const result = toolContext.execute(params);
                if (result !== undefined) {
                  functionCall.result = result;
                }
              } else {
                functionCall.status = 'error';
              }
            } catch (error) {
              console.error('Tool execution error:', error);
              functionCall.status = 'error';
            }
          } catch {
            // Not a tool call, just regular content - ignore for command-based system
            console.log('Regular content response (ignored):', response.message.content);
          }
        }
        
        // Add assistant message with function call info
        if (functionCall) {
          const assistantMessage: ChatMessage = {
            type: 'assistant',
            content: `Called ${functionCall.name}`,
            timestamp: new Date().toLocaleTimeString(),
            functionCall: functionCall
          };
          
          this.chatMessages.update(messages => [...messages, assistantMessage]);
        }
        
        this.isProcessing = false;
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
}