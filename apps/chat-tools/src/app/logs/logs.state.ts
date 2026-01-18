import { computed, inject, Injectable, signal } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { LogEntry } from "./log.model";
import { LogService } from "./log.service";

@Injectable({providedIn: 'root'})
export class LogsState {
  private readonly logService = inject(LogService);

  // Raw logs signal
  private readonly allLogs = toSignal(this.logService.getAll(), { initialValue: [] as LogEntry[] });

  // Filter signal
  readonly filter = signal<Partial<LogEntry>>({});

  // Filtered logs computed signal
  private readonly filteredLogs = computed(() => {
    const logs = this.allLogs();
    const filter = this.filter();

    // If no filter is applied, return all logs
    if (Object.keys(filter).length === 0) {
      return logs;
    }

    return logs.filter(log => {
      return Object.entries(filter).every(([key, filterValue]) => {
        const logValue = log[key as keyof LogEntry];
        
        // Special handling for message (partial match, case-insensitive)
        if (key === 'message' && typeof filterValue === 'string') {
          return logValue.toString().toLowerCase().includes(filterValue.toLowerCase());
        }
        
        // Exact match for other fields
        return logValue === filterValue;
      });
    });
  });

  // Derived signals for component
  readonly logVolumeData = computed(() => {
    const logs = this.filteredLogs();
    // Initialize dictionary with all 24 hours (00:00 to 23:00) with count 0
    const hourCounts: Record<string, number> = {};
    for (let hour = 0; hour < 24; hour++) {
      const hourStr = hour.toString().padStart(2, '0');
      hourCounts[`${hourStr}`] = 0;
    }

    // Reduce logs to count by hour
    const counts = logs.reduce((acc, log) => {
      // Extract hour from timestamp
      const date = new Date(log.timestamp);
      const hour = date.getHours().toString().padStart(2, '0');
      const hourKey = `${hour}`;
      
      if (acc[hourKey] !== undefined) {
        acc[hourKey]++;
      }
      
      return acc;
    }, hourCounts);

    // Convert dictionary to array of LogVolumeData
    return Object.entries(counts)
      .map(([hour, count]) => ({ hour, count }))
      .sort((a, b) => a.hour.localeCompare(b.hour));
  });

  readonly logTypes = computed(() => {
    const logs = this.filteredLogs();
    // Initialize counter for each log type
    const typeCounts: Record<string, number> = {
      'INFO': 0,
      'WARN': 0,
      'ERROR': 0,
      'DEBUG': 0
    };

    // Reduce logs to count by type
    const counts = logs.reduce((acc, log) => {
      const level = log.level;
      if (acc[level] !== undefined) {
        acc[level]++;
      }
      return acc;
    }, typeCounts);

    // Calculate total logs
    const total = Object.values(counts).reduce((sum, count) => sum + count, 0);

    // Map to color classes and display names
    const colorMap: Record<string, string> = {
      'INFO': 'bg-blue-500',
      'WARN': 'bg-yellow-500',
      'ERROR': 'bg-red-500',
      'DEBUG': 'bg-gray-500'
    };

    const nameMap: Record<string, string> = {
      'INFO': 'Info',
      'WARN': 'Warning',
      'ERROR': 'Error',
      'DEBUG': 'Debug'
    };

    // Convert to LogTypeDistribution array with percentages
    return Object.entries(counts)
      .map(([level, count]) => ({
        name: nameMap[level] || level,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0,
        color: colorMap[level] || 'bg-gray-500'
      }))
      .sort((a, b) => b.percentage - a.percentage); // Sort by percentage descending
  });

  readonly stats = computed(() => {
    const logs = this.filteredLogs();
    const total = logs.length;
    const errors = logs.filter(log => log.level === 'ERROR').length;
    const warnings = logs.filter(log => log.level === 'WARN').length;
    const successRate = total > 0 ? ((total - errors) / total) * 100 : 0;

    return {
      totalLogs: total,
      errors,
      warnings,
      successRate: Math.round(successRate * 10) / 10 // Round to 1 decimal place
    };
  });

  readonly recentLogs = computed(() => {
    const logs = this.filteredLogs();
    // Sort by timestamp descending (latest first) and take the first 10
    return [...logs]
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 10);
  });

  /**
   * Apply filters to constrain log processing.
   * All derived properties (logVolumeData, logTypes, stats, recentLogs) will use filtered logs.
   * 
   * @param filter - Partial LogEntry object where keys match LogEntry properties.
   *   - level: Exact match for log level
   *   - service: Exact match for service name
   *   - message: Partial string match (case-insensitive) in message
   *   - timestamp: Exact match for timestamp
   * 
   * @example
   * // Filter by level
   * logsState.applyFilter({ level: 'ERROR' });
   * 
   * // Filter by service
   * logsState.applyFilter({ service: 'api-service' });
   * 
   * // Filter by message (partial match)
   * logsState.applyFilter({ message: 'connection' });
   * 
   * // Combine filters
   * logsState.applyFilter({ level: 'ERROR', service: 'api-service' });
   * 
   * // Clear filters
   * logsState.applyFilter({});
   */
  applyFilter(filter: Partial<LogEntry>): void {
    this.filter.set(filter);
  }
}