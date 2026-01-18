import { APP_INITIALIZER, Provider } from "@angular/core";
import { ToolRegistry } from "../tools/tool.registry";
import { ThemeService } from "./theme.service";

export function provideThemeTool(): Provider {
  return {
    provide: APP_INITIALIZER,
    useFactory: (toolRegistry: ToolRegistry, themeService: ThemeService) => {
      return () => {
        toolRegistry.registerTool('change_theme', {
          execute: (args: { theme: 'light' | 'dark' }) => {
            themeService.changeTheme(args.theme);
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
        });
      };
    },
    deps: [ToolRegistry, ThemeService],
    multi: true,
  };
}
