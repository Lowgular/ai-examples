import { inject, Injectable } from "@angular/core";
import { ToolContext } from "../chat/chat.component";
import { ThemeService } from "../theme/theme.service";

@Injectable({providedIn: 'root'})
export class ToolRegistry {
  private readonly themeService = inject(ThemeService);
  private readonly TOOLS: Record<string, ToolContext> = {}

  registerTool(name: string, tool: ToolContext) {
    this.TOOLS[name] = tool;
  }
  
  getAll() {
    return Object.values(this.TOOLS).map(tool => ({
      type: 'function' as const,
      function: tool.definition
    }));
  }

  getByName(name: string) {
    return this.TOOLS[name];
  }
}