import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CollectionService } from '../../core/services/collection.service';
import { Collection } from '../../core/models/artwork.model';
import { CreateCollectionDialogComponent } from './create-collection-dialog/create-collection-dialog.component';

@Component({
  selector: 'app-collections',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatDialogModule,
    MatSnackBarModule,
    MatTooltipModule,
    CreateCollectionDialogComponent
  ],
  templateUrl: './collections.component.html',
  styleUrls: ['./collections.component.scss']
})
export class CollectionsComponent implements OnInit {
  collections$ = this.collectionService.collections$;
  showCreateDialog = signal(false);

  constructor(
    private collectionService: CollectionService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.collectionService.loadCollections();
  }

  openCreateDialog(): void {
    this.showCreateDialog.set(true);
  }

  closeCreateDialog(): void {
    this.showCreateDialog.set(false);
  }

  onCollectionCreated(data: { name: string; description?: string }): void {
    this.collectionService.createCollection(data).subscribe({
      next: () => {
        this.showCreateDialog.set(false);
        this.snackBar.open('Coleção criada com sucesso!', 'OK', { duration: 2500 });
      },
      error: () => {
        this.snackBar.open('Erro ao criar coleção.', 'OK', { duration: 2500 });
      }
    });
  }

  deleteCollection(collection: Collection, event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    if (confirm(`Deseja excluir a coleção "${collection.name}"?`)) {
      this.collectionService.deleteCollection(collection.id).subscribe({
        next: () => {
          this.snackBar.open('Coleção excluída.', 'OK', { duration: 2500 });
        },
        error: () => {
          this.snackBar.open('Erro ao excluir coleção.', 'OK', { duration: 2500 });
        }
      });
    }
  }
}
