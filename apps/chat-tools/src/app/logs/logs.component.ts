import { CommonModule } from "@angular/common";
import { Component, computed, inject } from "@angular/core";
import { LogEntry } from "./log.model";
import { LogsState } from "./logs.state";

@Component({selector: 'app-logs', templateUrl: './logs.component.html', imports: [CommonModule]})
export class LogsComponent {
  protected readonly logsState = inject(LogsState);

  protected readonly logVolumeData = this.logsState.logVolumeData;
  protected readonly logTypes = this.logsState.logTypes;
  protected readonly recentLogs = this.logsState.recentLogs;
  protected readonly stats = this.logsState.stats;

  protected readonly maxLogCount = computed(() => {
    return Math.max(...this.logVolumeData().map(d => d.count));
  })

  // Get bar height percentage
  getBarHeight(count: number): number {
    const max = this.maxLogCount();
    if (max === 0) return 0;
    return (count / max) * 100;
  }

  // Get bar height in pixels (for 256px container height minus padding)
  getBarHeightPx(count: number): string {
    const max = this.maxLogCount();
    if (max === 0) return '2px';
    const containerHeight = 200; // Approximate available height (256px - 56px for labels)
    const height = (count / max) * containerHeight;
    return Math.max(height, 2) + 'px'; // Minimum 2px to ensure visibility
  }

  // Get level class based on log level
  getLevelClass(level: LogEntry['level']): string {
    const classMap: Record<LogEntry['level'], string> = {
      'INFO': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      'WARN': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      'ERROR': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      'DEBUG': 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
    };
    return classMap[level] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
  }

  // Format timestamp to time string (HH:MM:SS)
  formatTime(timestamp: number): string {
    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  }
}