import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService } from '../../core/api.service';
import { Npc } from '../../core/models';

/** Backend calls for the NPCs of the game master. */
@Injectable({ providedIn: 'root' })
export class NpcService {
  private readonly api = inject(ApiService);

  /** Load one NPC with its skills, inventory and phrases. */
  get(id: number): Observable<Npc> {
    return this.api.get<Npc>(`npcs/${id}/`);
  }

  /** Save changed fields of an NPC. */
  update(id: number, changes: Partial<Npc>): Observable<Npc> {
    return this.api.patch<Npc>(`npcs/${id}/`, changes);
  }

  /** Delete an NPC. */
  remove(id: number): Observable<void> {
    return this.api.delete(`npcs/${id}/`);
  }
}
