import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Artwork, ArtworkPageResponse, WikipediaInfo, Collection, CreateCollectionRequest } from '../models/artwork.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Artworks
  getArtworks(page: number = 1, limit: number = 20): Observable<ArtworkPageResponse> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    return this.http.get<ArtworkPageResponse>(`${this.baseUrl}/artworks`, { params });
  }

  searchArtworks(query: string, page: number = 1, limit: number = 20): Observable<ArtworkPageResponse> {
    const params = new HttpParams()
      .set('q', query)
      .set('page', page.toString())
      .set('limit', limit.toString());
    return this.http.get<ArtworkPageResponse>(`${this.baseUrl}/artworks/search`, { params });
  }

  getArtworkById(id: number): Observable<Artwork> {
    return this.http.get<Artwork>(`${this.baseUrl}/artworks/${id}`);
  }

  getArtworkWikipedia(id: number): Observable<WikipediaInfo> {
    return this.http.get<WikipediaInfo>(`${this.baseUrl}/artworks/${id}/wikipedia`);
  }

  getArtworksByDepartment(department: string, page: number = 1, limit: number = 20): Observable<ArtworkPageResponse> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    return this.http.get<ArtworkPageResponse>(`${this.baseUrl}/artworks/department/${encodeURIComponent(department)}`, { params });
  }

  // Collections
  getCollections(): Observable<Collection[]> {
    return this.http.get<Collection[]>(`${this.baseUrl}/collections`);
  }

  getCollection(id: number): Observable<Collection> {
    return this.http.get<Collection>(`${this.baseUrl}/collections/${id}`);
  }

  createCollection(data: CreateCollectionRequest): Observable<Collection> {
    return this.http.post<Collection>(`${this.baseUrl}/collections`, data);
  }

  updateCollection(id: number, data: CreateCollectionRequest): Observable<Collection> {
    return this.http.put<Collection>(`${this.baseUrl}/collections/${id}`, data);
  }

  deleteCollection(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/collections/${id}`);
  }

  addArtworkToCollection(collectionId: number, artworkId: number): Observable<Collection> {
    return this.http.post<Collection>(`${this.baseUrl}/collections/${collectionId}/artworks/${artworkId}`, {});
  }

  removeArtworkFromCollection(collectionId: number, artworkId: number): Observable<Collection> {
    return this.http.delete<Collection>(`${this.baseUrl}/collections/${collectionId}/artworks/${artworkId}`);
  }

  getArtworksInCollection(collectionId: number): Observable<Artwork[]> {
    return this.http.get<Artwork[]>(`${this.baseUrl}/collections/${collectionId}/artworks`);
  }

  getCollectionsForArtwork(artworkId: number): Observable<Collection[]> {
    return this.http.get<Collection[]>(`${this.baseUrl}/collections/artwork/${artworkId}`);
  }
}
