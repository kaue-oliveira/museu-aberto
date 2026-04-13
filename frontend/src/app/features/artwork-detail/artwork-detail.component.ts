import { Component, OnInit, signal, HostListener } from '@angular/core';
import { environment } from '../../../environments/environment';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';
import { switchMap, of } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { CollectionService } from '../../core/services/collection.service';
import { Artwork, WikipediaInfo } from '../../core/models/artwork.model';
import { ImageZoomComponent } from './image-zoom/image-zoom.component';

@Component({
  selector: 'app-artwork-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatMenuModule,
    MatSnackBarModule,
    MatDialogModule,
    MatChipsModule,
    ImageZoomComponent
  ],
  templateUrl: './artwork-detail.component.html',
  styleUrls: ['./artwork-detail.component.scss']
})
export class ArtworkDetailComponent implements OnInit {
  proxiedImageUrl(url: string | null | undefined): string {
    if (!url) return '';
    if (this.isProxyUrl(url)) return url;
    if (!this.shouldUseBackendProxy(url)) return url;
    return `${environment.apiUrl}/proxy-image?url=${encodeURIComponent(url)}`;
  }

  getDisplayImageUrl(url: string | null | undefined): string {
    if (!url) return '';
    return this.useProxyImage() ? this.proxiedImageUrl(url) : this.extractOriginalImageUrl(url);
  }
  artwork = signal<Artwork | null>(null);
  wikipedia = signal<WikipediaInfo | null>(null);
  loading = signal(true);
  loadingWiki = signal(false);
  imageLoaded = signal(false);
  useProxyImage = signal(true);
  imageError = signal(false);
  showZoom = signal(false);
  isInCollection = signal(false);
  collections$ = this.collectionService.collections$;

  constructor(
    private route: ActivatedRoute,
    private api: ApiService,
    private collectionService: CollectionService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.route.paramMap.pipe(
      switchMap(params => {
        const id = Number(params.get('id'));
        return this.api.getArtworkById(id);
      })
    ).subscribe({
      next: (artwork) => {
        console.log('Artwork carregada:', artwork);
        this.imageLoaded.set(false);
        this.useProxyImage.set(true);
        this.imageError.set(false);
        this.artwork.set(artwork);
        this.loading.set(false);
        this.isInCollection.set(this.collectionService.isArtworkInAnyCollection(artwork.id));
        this.loadWikipedia(artwork.id);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  loadWikipedia(id: number): void {
    this.loadingWiki.set(true);
    this.api.getArtworkWikipedia(id).subscribe({
      next: (info) => {
        this.wikipedia.set(info);
        this.loadingWiki.set(false);
      },
      error: () => {
        this.loadingWiki.set(false);
      }
    });
  }

  openZoom(): void {
    const art = this.artwork();
    if (art?.imageUrl) {
      this.showZoom.set(true);
    }
  }

  closeZoom(): void {
    this.showZoom.set(false);
  }

  onMainImageError(): void {
    if (this.useProxyImage()) {
      this.useProxyImage.set(false);
      this.imageLoaded.set(false);
      return;
    }
    this.imageError.set(true);
    this.imageLoaded.set(true);
  }

  getOriginalImageUrl(url: string | null | undefined): string {
    if (!url) return '';
    return this.extractOriginalImageUrl(url);
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

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.showZoom()) {
      this.closeZoom();
    }
  }

  addToCollection(collectionId: number): void {
    const art = this.artwork();
    if (!art) return;

    this.collectionService.addArtworkToCollection(collectionId, art.id).subscribe({
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
    const art = this.artwork();
    if (!art?.color) return '';
    const { h, s, l } = art.color;
    return `hsl(${h}, ${s}%, ${l}%)`;
  }

  stripHtml(html: string): string {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '');
  }
}
