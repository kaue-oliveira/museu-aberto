import { Component, Input, OnInit, signal } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Artwork } from '../../../core/models/artwork.model';
import { CollectionService } from '../../../core/services/collection.service';

@Component({
  selector: 'app-artwork-card',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatIconModule,
    MatTooltipModule,
    MatMenuModule,
    MatSnackBarModule
  ],
  templateUrl: './artwork-card.component.html',
  styleUrls: ['./artwork-card.component.scss']
})
export class ArtworkCardComponent implements OnInit {
  proxiedImageUrl(url: string | null | undefined): string {
    if (!url) return '';
    if (this.isProxyUrl(url)) return url;
    if (!this.shouldUseBackendProxy(url)) return url;
    return `${environment.apiUrl}/proxy-image?url=${encodeURIComponent(url)}`;
  }
  @Input() artwork!: Artwork;

  imageLoaded = signal(false);
  imageError = signal(false);
  useProxyImage = signal(true);
  isInCollection = signal(false);
  collections$ = this.collectionService.collections$;

  constructor(
    private collectionService: CollectionService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.useProxyImage.set(true);
    this.imageError.set(false);
    this.imageLoaded.set(false);
    this.isInCollection.set(this.collectionService.isArtworkInAnyCollection(this.artwork.id));
  }

  getLqipUrl(): string {
    return this.artwork.thumbnail?.lqip || '';
  }

  hasLqip(): boolean {
    return !!this.getLqipUrl();
  }

  getDisplayImageUrl(): string {
    const rawUrl = this.artwork.thumbnailUrl || this.artwork.imageUrl;
    if (!rawUrl) return '';
    return this.useProxyImage()
      ? this.proxiedImageUrl(rawUrl)
      : this.extractOriginalImageUrl(rawUrl);
  }

  onImageLoad(): void {
    this.imageLoaded.set(true);
  }

  onImageError(): void {
    if (this.useProxyImage()) {
      this.useProxyImage.set(false);
      this.imageLoaded.set(false);
      return;
    }
    this.imageError.set(true);
    this.imageLoaded.set(true);
  }

  addToCollection(collectionId: number, event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    this.collectionService.addArtworkToCollection(collectionId, this.artwork.id).subscribe({
      next: () => {
        this.isInCollection.set(true);
        this.snackBar.open('Obra adicionada à coleção!', 'OK', { duration: 2500 });
      },
      error: () => {
        this.snackBar.open('Erro ao adicionar à coleção.', 'OK', { duration: 2500 });
      }
    });
  }

  getColorStyle(): string {
    if (!this.artwork.color) return '';
    const { h, s, l } = this.artwork.color;
    return `hsl(${h}, ${s}%, ${l}%)`;
  }

  getAspectRatio(): string {
    if (this.artwork.thumbnail?.width && this.artwork.thumbnail?.height) {
      const ratio = this.artwork.thumbnail.height / this.artwork.thumbnail.width;
      if (ratio > 1.5) return 'tall';
      if (ratio < 0.7) return 'wide';
    }
    return 'normal';
  }

  getShortDescription(maxChars: number = 140): string {
    const raw = this.artwork?.description || '';
    const text = this.stripHtml(raw).replace(/\s+/g, ' ').trim();
    if (!text) return '';
    if (text.length <= maxChars) return text;
    return text.slice(0, maxChars).replace(/\s+\S*$/, '').trimEnd() + '…';
  }

  private stripHtml(html: string): string {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '');
  }

  private isProxyUrl(url: string): boolean {
    return url.includes('/api/proxy-image?url=');
  }

  private shouldUseBackendProxy(url: string): boolean {
    return url.includes('artic.edu/iiif/') || url.includes('www.artic.edu/assets/');
  }

  private extractOriginalImageUrl(url: string): string {
    let current = url;
    for (let i = 0; i < 5 && this.isProxyUrl(current); i++) {
      const marker = 'url=';
      const markerIndex = current.indexOf(marker);
      if (markerIndex === -1) return current;
      const encoded = current.slice(markerIndex + marker.length);
      try {
        current = decodeURIComponent(encoded);
      } catch {
        current = encoded;
      }
    }
    return current;
  }
}
