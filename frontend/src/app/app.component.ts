import { Component } from '@angular/core';
import { GalleryShuffleService } from './core/services/gallery-shuffle.service';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatIconModule,
    CommonModule
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'Museu Aberto';

  constructor(private galleryShuffleService: GalleryShuffleService) {}

  shuffleGallery() {
    this.galleryShuffleService.shuffle();
  }
}
