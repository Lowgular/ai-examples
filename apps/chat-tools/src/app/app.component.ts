import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { LogTypeDistribution, LogVolumeData } from './models/log.model';
import { LogService } from './services/log.service';

@Component({
  imports: [RouterModule, CommonModule],
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit {
  isDarkMode = signal(false);
  isChatOpen = signal(false);
  logVolumeData: LogVolumeData[] = [];
  logTypes: LogTypeDistribution[] = [];

  constructor(private logService: LogService) {}

  // Get max count for scaling
  get maxLogCount(): number {
    if (!this.logVolumeData || this.logVolumeData.length === 0) {
      return 1;
    }
    return Math.max(...this.logVolumeData.map(d => d.count));
  }

  // Get bar height percentage
  getBarHeight(count: number): number {
    const max = this.maxLogCount;
    if (max === 0) return 0;
    return (count / max) * 100;
  }

  // Get bar height in pixels (for 256px container height minus padding)
  getBarHeightPx(count: number): string {
    const max = this.maxLogCount;
    if (max === 0) return '2px';
    const containerHeight = 200; // Approximate available height (256px - 56px for labels)
    const height = (count / max) * containerHeight;
    return Math.max(height, 2) + 'px'; // Minimum 2px to ensure visibility
  }


  // Recent logs sample data
  recentLogs = [
    { time: '14:32:15', level: 'INFO', levelClass: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400', service: 'api-service', message: 'User authentication successful' },
    { time: '14:31:42', level: 'WARN', levelClass: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400', service: 'db-service', message: 'Connection pool at 80% capacity' },
    { time: '14:30:18', level: 'ERROR', levelClass: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400', service: 'cache-service', message: 'Failed to connect to Redis cluster' },
    { time: '14:29:55', level: 'INFO', levelClass: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400', service: 'api-service', message: 'Request processed in 45ms' },
    { time: '14:28:33', level: 'INFO', levelClass: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400', service: 'worker-service', message: 'Background job completed successfully' },
    { time: '14:27:12', level: 'WARN', levelClass: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400', service: 'api-service', message: 'Rate limit approaching threshold' },
    { time: '14:26:08', level: 'INFO', levelClass: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400', service: 'db-service', message: 'Query executed in 12ms' },
    { time: '14:25:41', level: 'ERROR', levelClass: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400', service: 'api-service', message: 'Invalid request payload received' },
  ];

  // Chat conversation data
  chatMessages = [
    { text: 'Hello! How can I help you with your logs today?', sender: 'bot', timestamp: '10:15 AM' },
    { text: 'Hi, I noticed there are some errors in the recent logs. Can you help me investigate?', sender: 'user', timestamp: '10:16 AM' },
    { text: 'Of course! I can see there are 234 errors in the system. Would you like me to show you the details of the most recent errors?', sender: 'bot', timestamp: '10:16 AM' },
    { text: 'Yes, please show me the error details.', sender: 'user', timestamp: '10:17 AM' },
    { text: 'I\'ve identified the main issues: Redis connection failures and invalid request payloads. The Redis cluster connection issue started at 14:30:18. Would you like me to generate a detailed report?', sender: 'bot', timestamp: '10:18 AM' },
  ];

  ngOnInit() {
    // Check for saved theme preference or default to light mode
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      this.isDarkMode.set(true);
      document.documentElement.classList.add('dark');
    }

    // Load log volume data from service
    this.logService.getLogVolumeData().subscribe(data => {
      this.logVolumeData = data;
    });

    // Load log types distribution from service
    this.logService.getLogTypes().subscribe(data => {
      this.logTypes = data;
    });
  }

  toggleTheme() {
    this.isDarkMode.update(mode => !mode);
    if (this.isDarkMode()) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }

  toggleChat() {
    this.isChatOpen.update(open => !open);
  }
}
