import { Injectable, signal, computed } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { ApiService } from './api.service';
import { Collection, CreateCollectionRequest } from '../models/artwork.model';

@Injectable({
  providedIn: 'root'
})
export class CollectionService {
  private collectionsSubject = new BehaviorSubject<Collection[]>([]);
  collections$ = this.collectionsSubject.asObservable();

  constructor(private api: ApiService) {
    this.loadCollections();
  }

  loadCollections(): void {
    this.api.getCollections().subscribe({
      next: (collections) => this.collectionsSubject.next(collections),
      error: (err) => console.error('Error loading collections:', err)
    });
  }

  createCollection(data: CreateCollectionRequest): Observable<Collection> {
    return this.api.createCollection(data).pipe(
      tap(() => this.loadCollections())
    );
  }

  updateCollection(id: number, data: CreateCollectionRequest): Observable<Collection> {
    return this.api.updateCollection(id, data).pipe(
      tap(() => this.loadCollections())
    );
  }

  deleteCollection(id: number): Observable<void> {
    return this.api.deleteCollection(id).pipe(
      tap(() => this.loadCollections())
    );
  }

  addArtworkToCollection(collectionId: number, artworkId: number): Observable<Collection> {
    return this.api.addArtworkToCollection(collectionId, artworkId).pipe(
      tap(() => this.loadCollections())
    );
  }

  removeArtworkFromCollection(collectionId: number, artworkId: number): Observable<Collection> {
    return this.api.removeArtworkFromCollection(collectionId, artworkId).pipe(
      tap(() => this.loadCollections())
    );
  }

  isArtworkInAnyCollection(artworkId: number): boolean {
    return this.collectionsSubject.value.some(c => c.artworkIds?.includes(artworkId));
  }

  getCollectionsForArtwork(artworkId: number): Collection[] {
    return this.collectionsSubject.value.filter(c => c.artworkIds?.includes(artworkId));
  }

  getCollectionById(id: number): Observable<Collection> {
    return this.api.getCollection(id);
  }
}
