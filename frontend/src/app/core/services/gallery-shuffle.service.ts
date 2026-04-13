import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class GalleryShuffleService {
  private shuffleSubject = new Subject<void>();
  shuffle$ = this.shuffleSubject.asObservable();

  shuffle() {
    this.shuffleSubject.next();
  }
}