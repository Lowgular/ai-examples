export interface LogEntry {
  time: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  service: string;
  message: string;
}

export interface LogVolumeData {
  hour: string;
  count: number;
}

export interface LogTypeDistribution {
  name: string;
  percentage: number;
  color: string;
}

export interface LogStats {
  totalLogs: number;
  errors: number;
  warnings: number;
  successRate: number;
}

export interface LogsResponse {
  recentLogs: LogEntry[];
}
