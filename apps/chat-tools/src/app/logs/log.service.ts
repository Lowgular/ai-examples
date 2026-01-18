import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { LogEntry } from './log.model';

@Injectable({
  providedIn: 'root'
})
export class LogService {
  private logsUrl = '/assets/logs.json';
  private readonly http = inject(HttpClient);

  getAll(): Observable<LogEntry[]> {
    return this.http.get<LogEntry[]>(this.logsUrl);
  }
}
