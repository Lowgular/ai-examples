import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, throwError } from 'rxjs';

interface OllamaGenerateRequest {
  model: string;
  prompt: string;
  stream: boolean;
  format: string;
  options: {
    temperature: number;
  };
}

interface OllamaGenerateResponse<T> {
  response: T;
  done: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class OllamaService {
  private readonly http = inject(HttpClient);
  private readonly ollamaUrl = 'http://localhost:11434/api/generate';

  generate<T>(prompt: string, modelName: string, options: { temperature: number } = { temperature: 0 }): Observable<Partial<T>> {;

    const request: OllamaGenerateRequest = {
      model: modelName,
      prompt,
      stream: false,
      format: 'json',
      options
    };

    return this.http.post<OllamaGenerateResponse<string>>(this.ollamaUrl, request).pipe(
      map((response) => {
        try {
          // With format: 'json', Ollama returns valid JSON in the response field
          // Parse it directly since it's guaranteed to be valid JSON
          const parsed = JSON.parse(response.response) as Partial<T>;
          return parsed;
        } catch (error) {
          throw new Error(`Failed to parse Ollama JSON response: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }),
      catchError((error) => {
        return throwError(() => 
          new Error(error.error?.error || error.message || 'Failed to generate filters from Ollama')
        );
      })
    );
  }
}
