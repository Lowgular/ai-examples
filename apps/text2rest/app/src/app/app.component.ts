import { CommonModule } from '@angular/common';
import { Component, inject, signal, WritableSignal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FitnessClass } from '@text2rest/shared';
import { switchMap } from 'rxjs';
import { AppService } from './app.service';
import { OllamaService } from './ollama.service';
import { FITNESS_CLASS_FILTER_PROMPT } from './prompt';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  imports: [CommonModule, ReactiveFormsModule],
})
export class AppComponent {
  private readonly appService = inject(AppService);
  private readonly ollamaService = inject(OllamaService);
  private readonly formBuilder = inject(FormBuilder);

  protected readonly filters: WritableSignal<Partial<FitnessClass> | null> = signal(null);
  protected readonly isLoading: WritableSignal<boolean> = signal(false);
  protected readonly error: WritableSignal<string | null> = signal(null);

  protected readonly filterForm: FormGroup = this.formBuilder.group({
    query: ['', Validators.required],
  });

  protected readonly fitnessClasses = toSignal(
    toObservable(this.filters).pipe(
      switchMap((filters) => this.appService.getFitnessClasses(filters || {}))
    )
  );

  protected onFilter(): void {
    if (this.filterForm.invalid) {
      return;
    }

    const query = this.filterForm.get('query')?.value;

    this.isLoading.set(true);
    this.error.set(null);

    this.ollamaService.generate<FitnessClass>(FITNESS_CLASS_FILTER_PROMPT(query, this.fitnessClasses() || []), 'codegemma:7b').subscribe({
      next: (generatedFilters) => {
        this.filters.set(generatedFilters);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set(err.message || 'Failed to generate filters');
        this.isLoading.set(false);
      },
    });
  }

  protected clearFilters(): void {
    this.filters.set(null);
    this.error.set(null);
    this.filterForm.get('query')?.reset();
  }
}
