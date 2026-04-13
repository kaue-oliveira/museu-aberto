import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { switchMap } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { CollectionService } from '../../../core/services/collection.service';
import { Collection, Artwork } from '../../../core/models/artwork.model';
import { ArtworkCardComponent } from '../../gallery/artwork-card/artwork-card.component';

@Component({
  selector: 'app-collection-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTooltipModule,
    ArtworkCardComponent
  ],
  template: `
    <div class="collection-detail-page page-container">
      <!-- Back -->
      <div class="back-nav">
        <a routerLink="/collections" class="back-link">
          <mat-icon>arrow_back</mat-icon>
          <span>Minhas Coleções</span>
        </a>
      </div>

      @if (loading()) {
        <div class="loading-center">
          <mat-spinner diameter="40"></mat-spinner>
        </div>
      } @else if (!collection()) {
        <div class="empty-state">
          <mat-icon>error_outline</mat-icon>
          <h3>Coleção não encontrada</h3>
          <a routerLink="/collections" class="btn-primary">Voltar</a>
        </div>
      } @else {
        <!-- Header -->
        <div class="collection-header">
          <div class="collection-icon">
            <mat-icon>collections_bookmark</mat-icon>
          </div>
          <div class="collection-info">
            <h1 class="collection-title">{{ collection()!.name }}</h1>
            @if (collection()!.description) {
              <p class="collection-desc">{{ collection()!.description }}</p>
            }
            <span class="artwork-count">
              {{ artworks().length }} obra{{ artworks().length !== 1 ? 's' : '' }}
            </span>
          </div>
        </div>

        <!-- Artworks -->
        @if (artworks().length === 0) {
          <div class="empty-state">
            <mat-icon>image_not_supported</mat-icon>
            <h3>Nenhuma obra nesta coleção</h3>
            <p>Adicione obras a partir da galeria ou das páginas de detalhe.</p>
            <a routerLink="/gallery" class="btn-primary">
              <mat-icon>grid_view</mat-icon>
              Explorar galeria
            </a>
          </div>
        } @else {
          <div class="masonry-grid">
            @for (artwork of artworks(); track artwork.id) {
              <div class="card-wrapper">
                <app-artwork-card [artwork]="artwork"></app-artwork-card>
                <button
                  class="remove-btn"
                  (click)="removeArtwork(artwork.id)"
                  matTooltip="Remover da coleção"
                >
                  <mat-icon>remove_circle_outline</mat-icon>
                </button>
              </div>
            }
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .collection-detail-page {
      padding-top: 2rem;
      padding-bottom: 4rem;
      min-height: 80vh;
    }

    .back-nav { margin-bottom: 2rem; }

    .back-link {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      color: var(--text-secondary);
      font-size: 0.875rem;
      text-decoration: none;
      transition: color var(--transition-fast);
      &:hover { color: var(--text-primary); }
      mat-icon { font-size: 1.1rem; width: 1.1rem; height: 1.1rem; }
    }

    .loading-center {
      display: flex;
      justify-content: center;
      padding: 4rem;
      mat-spinner { --mdc-circular-progress-active-indicator-color: var(--accent); }
    }

    .collection-header {
      display: flex;
      align-items: flex-start;
      gap: 1.5rem;
      margin-bottom: 3rem;
      padding-bottom: 2rem;
      border-bottom: 1px solid var(--border);
    }

    .collection-icon {
      width: 64px;
      height: 64px;
      border-radius: var(--radius-md);
      background: var(--accent-subtle);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      mat-icon { color: var(--accent); font-size: 1.75rem; width: 1.75rem; height: 1.75rem; }
    }

    .collection-info { flex: 1; }

    .collection-title {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 2rem;
      font-weight: 500;
      color: var(--text-primary);
      margin-bottom: 0.5rem;
    }

    .collection-desc {
      color: var(--text-secondary);
      font-size: 0.9rem;
      margin-bottom: 0.75rem;
    }

    .artwork-count {
      font-size: 0.8rem;
      color: var(--text-muted);
      letter-spacing: 0.05em;
    }

    .masonry-grid {
      columns: 4 280px;
      column-gap: 1.25rem;
      @media (max-width: 1200px) { columns: 3 280px; }
      @media (max-width: 900px) { columns: 2 240px; }
      @media (max-width: 560px) { columns: 1; }
    }

    .card-wrapper {
      position: relative;
      break-inside: avoid;
      margin-bottom: 1.25rem;

      &:hover .remove-btn { opacity: 1; }
    }

    .remove-btn {
      position: absolute;
      top: 0.5rem;
      left: 0.5rem;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: rgba(0, 0, 0, 0.7);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: #ff6b6b;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: all var(--transition-fast);
      z-index: 10;
      mat-icon { font-size: 1rem; width: 1rem; height: 1rem; }
      &:hover { background: rgba(255, 107, 107, 0.3); }
    }

    .btn-primary {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      background: var(--accent);
      color: #000;
      border: none;
      border-radius: 100px;
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      text-decoration: none;
      transition: all var(--transition-base);
      margin-top: 1.5rem;
      &:hover { background: var(--accent-light); }
    }
  `]
})
export class CollectionDetailComponent implements OnInit {
  collection = signal<Collection | null>(null);
  artworks = signal<Artwork[]>([]);
  loading = signal(true);

  constructor(
    private route: ActivatedRoute,
    private api: ApiService,
    private collectionService: CollectionService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.route.paramMap.pipe(
      switchMap(params => {
        const id = Number(params.get('id'));
        return this.collectionService.getCollectionById(id);
      })
    ).subscribe({
      next: (collection) => {
        this.collection.set(collection);
        this.loading.set(false);
        if (collection.artworkIds?.length) {
          this.loadArtworks(collection.artworkIds);
        }
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  loadArtworks(ids: number[]): void {
    const requests = ids.map(id => this.api.getArtworkById(id));
    Promise.all(requests.map(r => r.toPromise())).then(artworks => {
      this.artworks.set(artworks.filter(Boolean) as Artwork[]);
    });
  }

  removeArtwork(artworkId: number): void {
    const col = this.collection();
    if (!col) return;

    this.collectionService.removeArtworkFromCollection(col.id, artworkId).subscribe({
      next: () => {
        this.artworks.update(list => list.filter(a => a.id !== artworkId));
        this.snackBar.open('Obra removida da coleção.', 'OK', { duration: 2000 });
      },
      error: () => {
        this.snackBar.open('Erro ao remover obra.', 'OK', { duration: 2000 });
      }
    });
  }
}
