import {
  Component, Input, Output, EventEmitter, ElementRef, ViewChild,
  AfterViewInit, HostListener, signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-image-zoom',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="zoom-overlay" (click)="onOverlayClick($event)">
      <!-- Controls -->
      <div class="zoom-controls">
        <button class="zoom-ctrl-btn" (click)="zoomIn()" title="Ampliar">
          <mat-icon>add</mat-icon>
        </button>
        <span class="zoom-level">{{ (scale * 100).toFixed(0) }}%</span>
        <button class="zoom-ctrl-btn" (click)="zoomOut()" title="Reduzir">
          <mat-icon>remove</mat-icon>
        </button>
        <button class="zoom-ctrl-btn" (click)="resetZoom()" title="Resetar">
          <mat-icon>fit_screen</mat-icon>
        </button>
        <button class="zoom-ctrl-btn close-btn" (click)="close.emit()" title="Fechar">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <!-- Image Container -->
      <div
        class="zoom-container"
        #container
        (mousedown)="startDrag($event)"
        (mousemove)="onDrag($event)"
        (mouseup)="stopDrag()"
        (mouseleave)="stopDrag()"
        (wheel)="onWheel($event)"
        [style.cursor]="isDragging ? 'grabbing' : 'grab'"
      >
        <img
          #zoomImg
          [src]="displayImageUrl"
          [alt]="title"
          class="zoom-image"
          [style.transform]="'translate(' + translateX + 'px, ' + translateY + 'px) scale(' + scale + ')'"
          (load)="onImageLoad()"
          (error)="onImageError()"
          draggable="false"
        />
        @if (!imageLoaded()) {
          <div class="zoom-loading">
            <div class="spinner"></div>
            <p>Carregando imagem em alta resolução...</p>
          </div>
        }
      </div>

      <!-- Instructions -->
      <div class="zoom-instructions">
        <span>Scroll para zoom · Arraste para mover · ESC para fechar</span>
      </div>
    </div>
  `,
  styles: [`
    .zoom-overlay {
      position: fixed;
      inset: 0;
      z-index: 9999;
      background: rgba(0, 0, 0, 0.97);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      animation: fadeIn 0.2s ease;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .zoom-controls {
      position: fixed;
      top: 1rem;
      right: 1rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      z-index: 10000;
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(10px);
      padding: 0.5rem;
      border-radius: 100px;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .zoom-ctrl-btn {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: transparent;
      border: none;
      color: rgba(255, 255, 255, 0.8);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.15s ease;

      mat-icon { font-size: 1.1rem; width: 1.1rem; height: 1.1rem; }

      &:hover {
        background: rgba(255, 255, 255, 0.1);
        color: white;
      }
    }

    .close-btn {
      &:hover {
        background: rgba(220, 50, 50, 0.3) !important;
        color: #ff6b6b !important;
      }
    }

    .zoom-level {
      font-size: 0.75rem;
      color: rgba(255, 255, 255, 0.6);
      min-width: 40px;
      text-align: center;
      font-family: monospace;
    }

    .zoom-container {
      width: 100vw;
      height: 100vh;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      user-select: none;
    }

    .zoom-image {
      max-width: 90vw;
      max-height: 90vh;
      object-fit: contain;
      transition: transform 0.05s ease;
      transform-origin: center center;
      will-change: transform;
    }

    .zoom-loading {
      position: absolute;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      color: rgba(255, 255, 255, 0.6);
      font-size: 0.875rem;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid rgba(255, 255, 255, 0.1);
      border-top-color: #d4af37;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .zoom-instructions {
      position: fixed;
      bottom: 1.5rem;
      left: 50%;
      transform: translateX(-50%);
      font-size: 0.75rem;
      color: rgba(255, 255, 255, 0.35);
      background: rgba(0, 0, 0, 0.5);
      padding: 0.4rem 1rem;
      border-radius: 100px;
      white-space: nowrap;
    }
  `]
})
export class ImageZoomComponent implements AfterViewInit {
  @Input() imageUrl!: string;
  @Input() originalImageUrl?: string;
  @Input() title!: string;
  @Output() close = new EventEmitter<void>();

  @ViewChild('container') container!: ElementRef;
  @ViewChild('zoomImg') zoomImg!: ElementRef;

  scale = 1;
  translateX = 0;
  translateY = 0;
  isDragging = false;
  imageLoaded = signal(false);

  private lastX = 0;
  private lastY = 0;
  private minScale = 0.5;
  private maxScale = 5;
  private useOriginalUrl = signal(false);

  ngAfterViewInit(): void {}

  get displayImageUrl(): string {
    return this.useOriginalUrl() && this.originalImageUrl ? this.originalImageUrl : this.imageUrl;
  }

  onImageLoad(): void {
    this.imageLoaded.set(true);
  }

  onImageError(): void {
    if (!this.useOriginalUrl() && this.originalImageUrl) {
      this.useOriginalUrl.set(true);
      this.imageLoaded.set(false);
      return;
    }
    this.imageLoaded.set(true);
  }

  onOverlayClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('zoom-overlay')) {
      this.close.emit();
    }
  }

  zoomIn(): void {
    this.scale = Math.min(this.scale * 1.3, this.maxScale);
  }

  zoomOut(): void {
    this.scale = Math.max(this.scale / 1.3, this.minScale);
    if (this.scale <= 1) {
      this.translateX = 0;
      this.translateY = 0;
    }
  }

  resetZoom(): void {
    this.scale = 1;
    this.translateX = 0;
    this.translateY = 0;
  }

  onWheel(event: WheelEvent): void {
    event.preventDefault();
    const delta = event.deltaY > 0 ? 0.9 : 1.1;
    this.scale = Math.min(Math.max(this.scale * delta, this.minScale), this.maxScale);
    if (this.scale <= 1) {
      this.translateX = 0;
      this.translateY = 0;
    }
  }

  startDrag(event: MouseEvent): void {
    this.isDragging = true;
    this.lastX = event.clientX;
    this.lastY = event.clientY;
  }

  onDrag(event: MouseEvent): void {
    if (!this.isDragging || this.scale <= 1) return;
    const dx = event.clientX - this.lastX;
    const dy = event.clientY - this.lastY;
    this.translateX += dx;
    this.translateY += dy;
    this.lastX = event.clientX;
    this.lastY = event.clientY;
  }

  stopDrag(): void {
    this.isDragging = false;
  }
}
