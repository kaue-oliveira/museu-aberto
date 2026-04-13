import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

interface ColorOption {
  hue: number;
  label: string;
  color: string;
}

@Component({
  selector: 'app-color-filter',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatTooltipModule],
  template: `
    <div class="color-filter">
      <span class="filter-label hide-mobile">Filtrar por cor:</span>
      <div class="swatches">
        <button
          class="swatch-btn"
          [class.selected]="selectedHue === null"
          (click)="selectColor(null)"
          matTooltip="Todas as cores"
        >
          <mat-icon>palette</mat-icon>
        </button>
        @for (option of colorOptions; track option.hue) {
          <button
            class="swatch-btn color-swatch"
            [class.selected]="selectedHue === option.hue"
            [style.background]="option.color"
            (click)="selectColor(option.hue)"
            [matTooltip]="option.label"
          ></button>
        }
      </div>
    </div>
  `,
  styles: [`
    .color-filter {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .filter-label {
      font-size: 0.75rem;
      color: var(--text-muted);
      letter-spacing: 0.05em;
      text-transform: uppercase;
      white-space: nowrap;
    }

    .swatches {
      display: flex;
      align-items: center;
      gap: 0.4rem;
    }

    .swatch-btn {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      border: 2px solid transparent;
      cursor: pointer;
      transition: all 0.15s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--bg-card);
      color: var(--text-muted);

      mat-icon {
        font-size: 0.9rem;
        width: 0.9rem;
        height: 0.9rem;
      }

      &:hover {
        transform: scale(1.2);
        border-color: rgba(255, 255, 255, 0.3);
      }

      &.selected {
        border-color: var(--accent);
        box-shadow: 0 0 0 2px var(--accent-subtle);
        transform: scale(1.15);
      }
    }

    .color-swatch {
      background: transparent;
    }

    @media (max-width: 768px) {
      .hide-mobile { display: none; }
    }
  `]
})
export class ColorFilterComponent {
  @Input() selectedHue: number | null = null;
  @Output() colorSelected = new EventEmitter<number | null>();

  colorOptions: ColorOption[] = [
    { hue: 0, label: 'Vermelho', color: 'hsl(0, 75%, 50%)' },
    { hue: 30, label: 'Laranja', color: 'hsl(30, 85%, 55%)' },
    { hue: 55, label: 'Amarelo', color: 'hsl(55, 90%, 55%)' },
    { hue: 120, label: 'Verde', color: 'hsl(120, 55%, 40%)' },
    { hue: 200, label: 'Azul claro', color: 'hsl(200, 70%, 50%)' },
    { hue: 240, label: 'Azul', color: 'hsl(240, 65%, 50%)' },
    { hue: 280, label: 'Roxo', color: 'hsl(280, 60%, 50%)' },
    { hue: 330, label: 'Rosa', color: 'hsl(330, 70%, 55%)' },
    { hue: 30, label: 'Marrom', color: 'hsl(25, 40%, 30%)' },
  ];

  selectColor(hue: number | null): void {
    this.colorSelected.emit(hue);
  }
}
