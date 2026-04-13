import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'gallery',
    pathMatch: 'full'
  },
  {
    path: 'gallery',
    loadComponent: () => import('./features/gallery/gallery.component').then(m => m.GalleryComponent)
  },
  {
    path: 'artwork/:id',
    loadComponent: () => import('./features/artwork-detail/artwork-detail.component').then(m => m.ArtworkDetailComponent)
  },
  {
    path: 'collections',
    loadComponent: () => import('./features/collections/collections.component').then(m => m.CollectionsComponent)
  },
  {
    path: 'collections/:id',
    loadComponent: () => import('./features/collections/collection-detail/collection-detail.component').then(m => m.CollectionDetailComponent)
  },
  {
    path: '**',
    redirectTo: 'gallery'
  }
];
