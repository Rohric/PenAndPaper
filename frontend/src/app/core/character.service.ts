import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService } from './api.service';

/**
 * Where a character is read and written: the NPCs of a game master, the own characters
 * of a player, or the characters of all players as the game master sees them.
 */
export type CharacterSource = 'npcs' | 'player-characters' | 'gm/player-characters';

/** Backend calls for NPCs and player characters. */
@Injectable({ providedIn: 'root' })
export class CharacterService {
  private readonly api = inject(ApiService);

  /** Load all characters of a source. */
  list<T>(source: CharacterSource): Observable<T[]> {
    return this.api.get<T[]>(`${source}/`);
  }

  /** Load one character with its skills, its inventory and everything else. */
  get<T>(source: CharacterSource, id: number): Observable<T> {
    return this.api.get<T>(`${source}/${id}/`);
  }

  /** Create a character from its name. */
  create<T>(source: CharacterSource, name: string): Observable<T> {
    return this.api.post<T>(`${source}/`, { name });
  }

  /** Save changed fields of a character. */
  update<T>(source: CharacterSource, id: number, changes: object): Observable<T> {
    return this.api.patch<T>(`${source}/${id}/`, changes);
  }

  /** Upload the picture of a character; it replaces the one before and is shown instead of the symbol. */
  setImage<T>(source: CharacterSource, id: number, file: File): Observable<T> {
    const body = new FormData();
    body.append('image', file);
    return this.api.put<T>(`${source}/${id}/image/`, body);
  }

  /** Remove the picture of a character. */
  removeImage<T>(source: CharacterSource, id: number): Observable<T> {
    return this.api.delete<T>(`${source}/${id}/image/`);
  }

  /** Delete a character. */
  remove(source: CharacterSource, id: number): Observable<void> {
    return this.api.delete(`${source}/${id}/`);
  }
}
