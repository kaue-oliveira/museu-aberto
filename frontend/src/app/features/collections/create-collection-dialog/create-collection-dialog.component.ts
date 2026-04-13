import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-create-collection-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule
  ],
  template: `
    <div class="dialog-backdrop" (click)="onBackdropClick($event)">
      <div class="dialog-panel">
        <div class="dialog-header">
          <h2>Nova Coleção</h2>
          <button class="close-btn" (click)="cancel.emit()">
            <mat-icon>close</mat-icon>
          </button>
        </div>
        <div class="dialog-body">
          <div class="field-group">
            <label class="field-label">Nome da coleção *</label>
            <input
              type="text"
              class="field-input"
              [(ngModel)]="name"
              placeholder="Ex: Impressionismo Francês"
              maxlength="100"
              autofocus
            />
          </div>
          <div class="field-group">
            <label class="field-label">Descrição (opcional)</label>
            <textarea
              class="field-input field-textarea"
              [(ngModel)]="description"
              placeholder="Uma breve descrição desta coleção..."
              maxlength="500"
              rows="3"
            ></textarea>
          </div>
        </div>
        <div class="dialog-footer">
          <button class="btn-cancel" (click)="cancel.emit()">Cancelar</button>
          <button
            class="btn-save"
            [disabled]="!name.trim()"
            (click)="onSave()"
          >
            <mat-icon>add</mat-icon>
            Criar Coleção
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dialog-backdrop {
      position: fixed;
      inset: 0;
      z-index: 2000;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
      animation: fadeIn 0.2s ease;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .dialog-panel {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      width: 100%;
      max-width: 480px;
      box-shadow: var(--shadow-xl);
      animation: slideUp 0.25s ease;
    }

    @keyframes slideUp {
      from { transform: translateY(20px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }

    .dialog-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1.5rem 1.5rem 1rem;
      border-bottom: 1px solid var(--border);

      h2 {
        font-family: 'Playfair Display', Georgia, serif;
        font-size: 1.25rem;
        font-weight: 500;
        color: var(--text-primary);
      }
    }

    .close-btn {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: transparent;
      border: none;
      cursor: pointer;
      color: var(--text-muted);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.15s ease;

      &:hover {
        background: rgba(255, 255, 255, 0.08);
        color: var(--text-primary);
      }
    }

    .dialog-body {
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .field-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .field-label {
      font-size: 0.75rem;
      font-weight: 600;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      color: var(--text-muted);
    }

    .field-input {
      width: 100%;
      padding: 0.75rem 1rem;
      background: var(--bg-secondary);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      color: var(--text-primary);
      font-size: 0.9rem;
      font-family: inherit;
      outline: none;
      transition: all 0.2s ease;
      resize: none;

      &::placeholder { color: var(--text-muted); }

      &:focus {
        border-color: var(--accent);
        background: var(--bg-card-hover);
        box-shadow: 0 0 0 3px var(--accent-subtle);
      }
    }

    .field-textarea {
      min-height: 80px;
    }

    .dialog-footer {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 0.75rem;
      padding: 1rem 1.5rem 1.5rem;
    }

    .btn-cancel {
      padding: 0.6rem 1.25rem;
      background: transparent;
      border: 1px solid var(--border);
      border-radius: 100px;
      color: var(--text-secondary);
      font-size: 0.875rem;
      cursor: pointer;
      transition: all 0.15s ease;

      &:hover {
        border-color: var(--border-hover);
        color: var(--text-primary);
      }
    }

    .btn-save {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.6rem 1.25rem;
      background: var(--accent);
      color: #000;
      border: none;
      border-radius: 100px;
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s ease;

      mat-icon { font-size: 1rem; width: 1rem; height: 1rem; }

      &:hover:not(:disabled) {
        background: var(--accent-light);
      }

      &:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }
    }
  `]
})
export class CreateCollectionDialogComponent {
  @Output() save = new EventEmitter<{ name: string; description?: string }>();
  @Output() cancel = new EventEmitter<void>();

  name = '';
  description = '';

  onSave(): void {
    if (this.name.trim()) {
      this.save.emit({
        name: this.name.trim(),
        description: this.description.trim() || undefined
      });
    }
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('dialog-backdrop')) {
      this.cancel.emit();
    }
  }
}
