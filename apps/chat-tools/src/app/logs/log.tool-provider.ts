import { APP_INITIALIZER, Provider } from "@angular/core";
import { ToolRegistry } from "../tools/tool.registry";
import { LogsState } from "./logs.state";

export function provideLogTools(): Provider {
  return {
    provide: APP_INITIALIZER,
    useFactory: (toolRegistry: ToolRegistry, logsState: LogsState) => {
      return () => {
        // Tool to filter logs by level
        toolRegistry.registerTool('filter_logs_by_level', {
          execute: (args: { level: string }) => {
            logsState.applyFilter({ level: args.level as 'INFO' | 'WARN' | 'ERROR' | 'DEBUG' });
            return `Filtered logs to show only ${args.level} level logs`;
          },
          definition: {
            name: 'filter_logs_by_level',
            description: 'Filter logs by log level. Only logs matching the specified level will be shown. This affects all log statistics, charts, and recent logs display.',
            parameters: {
              type: 'object',
              properties: {
                level: { 
                  type: 'string', 
                  description: 'The log level to filter by. Must be one of: INFO, WARN, ERROR, or DEBUG.', 
                  enum: ['INFO', 'WARN', 'ERROR', 'DEBUG'] 
                },
              },
              required: ['level'],
            },
          },
        });

        // Tool to filter logs by service
        toolRegistry.registerTool('filter_logs_by_service', {
          execute: (args: { service: string }) => {
            logsState.applyFilter({ service: args.service });
            return `Filtered logs to show only logs from service: ${args.service}`;
          },
          definition: {
            name: 'filter_logs_by_service',
            description: 'Filter logs by service name. Only logs from the specified service will be shown. This affects all log statistics, charts, and recent logs display. Use exact service name (e.g., "api-service", "db-service", "cache-service").',
            parameters: {
              type: 'object',
              properties: {
                service: { 
                  type: 'string', 
                  description: 'The exact service name to filter by (e.g., "api-service", "db-service", "cache-service", "worker-service")' 
                },
              },
              required: ['service'],
            },
          },
        });

        // Tool to filter logs by message content
        toolRegistry.registerTool('filter_logs_by_message', {
          execute: (args: { message: string }) => {
            logsState.applyFilter({ message: args.message });
            return `Filtered logs to show only logs containing: "${args.message}"`;
          },
          definition: {
            name: 'filter_logs_by_message',
            description: 'Filter logs by message content. Only logs whose message contains the specified text will be shown. The search is case-insensitive and matches partial text. This affects all log statistics, charts, and recent logs display.',
            parameters: {
              type: 'object',
              properties: {
                message: { 
                  type: 'string', 
                  description: 'The text to search for in log messages. Case-insensitive partial match. Only provide actual search terms, not placeholder text.' 
                },
              },
              required: ['message'],
            },
          },
        });

        // Tool to clear log filters
        toolRegistry.registerTool('clear_log_filter', {
          execute: () => {
            logsState.applyFilter({});
            return 'Cleared all log filters. All logs are now visible.';
          },
          definition: {
            name: 'clear_log_filter',
            description: 'Clear all log filters. This will reset the log view to show all logs without any filtering applied. Use this when you want to see the complete log dataset.',
            parameters: {
              type: 'object',
              properties: {},
              required: [],
            },
          },
        });
      };
    },
    deps: [ToolRegistry, LogsState],
    multi: true,
  };
}
