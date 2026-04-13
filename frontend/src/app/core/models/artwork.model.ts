export interface ColorInfo {
  h: number;
  l: number;
  s: number;
  percentage: number;
  population: number;
}

export interface ThumbnailInfo {
  lqip?: string;
  width?: number;
  height?: number;
  altText?: string;
}

export interface Artwork {
  id: number;
  title: string;
  artistTitle: string;
  artistDisplay: string;
  dateDisplay: string;
  mediumDisplay: string;
  dimensions: string;
  description: string;
  placeOfOrigin: string;
  styleTitle: string;
  classificationTitle: string;
  artworkTypeTitle: string;
  departmentTitle: string;
  isPublicDomain: boolean;
  imageId: string;
  color: ColorInfo;
  thumbnail: ThumbnailInfo;
  imageUrl: string;
  thumbnailUrl: string;
  articulUrl: string;
}

export interface ArtworkPageResponse {
  artworks: Artwork[];
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface WikipediaInfo {
  title: string;
  displayTitle: string;
  extract: string;
  pageUrl: string;
  thumbnailUrl: string;
  description: string;
  found: boolean;
}

export interface Collection {
  id: number;
  name: string;
  description: string;
  sessionId: string;
  createdAt: string;
  updatedAt: string;
  artworkIds?: number[];
  artworkCount: number;
}

export interface CreateCollectionRequest {
  name: string;
  description?: string;
}
