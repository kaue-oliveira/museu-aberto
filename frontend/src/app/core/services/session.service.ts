import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SessionService {
  private readonly SESSION_KEY = 'museu-aberto-session-id';
  private sessionId: string;

  constructor() {
    this.sessionId = this.getOrCreateSessionId();
  }

  getSessionId(): string {
    return this.sessionId;
  }

  private getOrCreateSessionId(): string {
    let id = localStorage.getItem(this.SESSION_KEY);
    if (!id) {
      id = this.generateId();
      localStorage.setItem(this.SESSION_KEY, id);
    }
    return id;
  }

  private generateId(): string {
    // Simple UUID-like generation without external dependency
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
}
