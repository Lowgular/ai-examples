import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { FitnessClass } from '@text2rest/shared';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AppService {
  private readonly apiUrl = environment.apiUrl;
  private readonly http = inject(HttpClient);

  getFitnessClasses(filters: Partial<FitnessClass> = {}): Observable<FitnessClass[]> {
    return this.http.get<FitnessClass[]>(this.apiUrl, { params: filters });
  }
}
