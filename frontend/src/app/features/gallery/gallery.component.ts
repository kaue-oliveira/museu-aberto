
import {
  Component, OnInit, OnDestroy, HostListener, ChangeDetectionStrategy, ChangeDetectorRef, signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatMenuModule } from '@angular/material/menu';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { GalleryShuffleService } from '../../core/services/gallery-shuffle.service';
import { CollectionService } from '../../core/services/collection.service';
import { Artwork, ArtworkPageResponse } from '../../core/models/artwork.model';
import { ArtworkCardComponent } from './artwork-card/artwork-card.component';
import { ColorFilterComponent } from './color-filter/color-filter.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-gallery',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatMenuModule,
    ArtworkCardComponent,
    ColorFilterComponent
  ],
  templateUrl: './gallery.component.html',
  styleUrls: ['./gallery.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GalleryComponent implements OnInit, OnDestroy {
  shuffleArtworks(): void {
    if (!this.totalPages || this.totalPages <= 1) {
      this.loadArtworks();
      this.saveGalleryState();
      this.router.navigate([], { replaceUrl: true });
      return;
    }
    const randomPage = Math.floor(Math.random() * this.totalPages) + 1;
    this.loading.set(true);
    this.hasError = false;
    this.currentPage = randomPage;
    this.isSearchMode = false;
    this.api.getArtworks(randomPage, 20).pipe(takeUntil(this.destroy$)).subscribe({
      next: (response) => {
        this.artworks = response.artworks;
        this.totalPages = response.totalPages;
        this.applyColorFilter();
        this.loading.set(false);
        this.cdr.markForCheck();
        this.saveGalleryState();
        this.router.navigate([], { replaceUrl: true });
      },
      error: () => {
        this.hasError = true;
        this.loading.set(false);
        this.cdr.markForCheck();
        this.saveGalleryState();
        this.router.navigate([], { replaceUrl: true });
      }
    });
  }

  private saveGalleryState(): void {
    const state = {
      artworks: this.artworks,
      currentPage: this.currentPage,
      totalPages: this.totalPages
    };
    sessionStorage.setItem('galleryState', JSON.stringify(state));
  }

  private restoreGalleryState(): boolean {
    const stateStr = sessionStorage.getItem('galleryState');
    if (stateStr) {
      try {
        const state = JSON.parse(stateStr);
        if (state.artworks && Array.isArray(state.artworks)) {
          this.artworks = state.artworks;
          this.currentPage = state.currentPage || 1;
          this.totalPages = state.totalPages || 1;
          this.applyColorFilter();
          this.cdr.markForCheck();
          return true;
        }
      } catch {}
    }
    return false;
  }
  artworks: Artwork[] = [];
  filteredArtworks: Artwork[] = [];
  loading = signal(false);
  loadingMore = signal(false);
  currentPage = 1;
  totalPages = 0;
  searchQuery = '';
  selectedColorHue: number | null = null;
  isSearchMode = false;
  hasError = false;

  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();

  constructor(
    private api: ApiService,
    private collectionService: CollectionService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef,
    private galleryShuffleService: GalleryShuffleService,
    private router: Router
  ) {
    this.galleryShuffleService.shuffle$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.shuffleArtworks();
    });
  }

  ngOnInit(): void {
    if (!this.restoreGalleryState()) {
      this.loadArtworks();
    }
    this.searchSubject.pipe(
      debounceTime(500),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(query => {
      this.performSearch(query);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadArtworks(): void {
    this.loading.set(true);
    this.hasError = false;
    this.currentPage = 1;
    this.isSearchMode = false;

    this.api.getArtworks(1, 20).pipe(takeUntil(this.destroy$)).subscribe({
      next: (response) => {
        this.artworks = response.artworks;
        this.totalPages = response.totalPages;
        this.applyColorFilter();
        this.loading.set(false);
        this.cdr.markForCheck();
      },
      error: () => {
        this.hasError = true;
        this.loading.set(false);
        this.cdr.markForCheck();
      }
    });
  }

  onSearchChange(query: string): void {
    this.searchSubject.next(query);
  }

  performSearch(query: string): void {
    if (!query.trim()) {
      this.loadArtworks();
      return;
    }

    this.loading.set(true);
    this.isSearchMode = true;
    this.currentPage = 1;
    this.artworks = [];

    this.api.searchArtworks(query, 1, 20).pipe(takeUntil(this.destroy$)).subscribe({
      next: (response) => {
        this.artworks = response.artworks;
        this.totalPages = response.totalPages;
        this.applyColorFilter();
        this.loading.set(false);
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading.set(false);
        this.cdr.markForCheck();
      }
    });
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.loadArtworks();
  }

  onColorFilter(hue: number | null): void {
    this.selectedColorHue = hue;
    this.applyColorFilter();
  }

  applyColorFilter(): void {
    if (this.selectedColorHue === null) {
      this.filteredArtworks = this.artworks;
    } else {
      const tolerance = 30;
      this.filteredArtworks = this.artworks.filter(artwork => {
        if (!artwork.color) return false;
        const diff = Math.abs(artwork.color.h - this.selectedColorHue!);
        return diff <= tolerance || diff >= (360 - tolerance);
      });
    }
    this.cdr.markForCheck();
  }

  @HostListener('window:scroll')
  onScroll(): void {
    if (this.loadingMore() || this.loading()) return;

    const scrollPosition = window.innerHeight + window.scrollY;
    const documentHeight = document.documentElement.scrollHeight;

    if (scrollPosition >= documentHeight - 400) {
      this.loadMore();
    }
  }

  loadMore(): void {
    if (this.currentPage >= this.totalPages || this.loadingMore()) return;

    this.loadingMore.set(true);
    const nextPage = this.currentPage + 1;

    const request = this.isSearchMode && this.searchQuery
      ? this.api.searchArtworks(this.searchQuery, nextPage, 20)
      : this.api.getArtworks(nextPage, 20);

    request.pipe(takeUntil(this.destroy$)).subscribe({
      next: (response) => {
        this.artworks = [...this.artworks, ...response.artworks];
        this.currentPage = nextPage;
        this.applyColorFilter();
        this.loadingMore.set(false);
        this.cdr.markForCheck();
      },
      error: () => {
        this.loadingMore.set(false);
        this.cdr.markForCheck();
      }
    });
  }

  trackByArtwork(index: number, artwork: Artwork): number {
    return artwork.id;
  }
}
