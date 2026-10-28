import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { ZapDefinition, ExecutionLogItem, RepositoryItem } from '../models/zap.model';

@Injectable({
  providedIn: 'root',
})
export class ZapService {
  private readonly http = inject(HttpClient);
  private readonly apiBase = 'http://localhost:3000/api/zaps';

  readonly zaps = signal<ZapDefinition[]>([]);
  readonly isLoading = signal<boolean>(false);
  readonly userRepos = signal<RepositoryItem[]>([]);
  readonly isLoadingRepos = signal<boolean>(false);
  readonly activeLogs = signal<ExecutionLogItem[]>([]);
  readonly isLoadingLogs = signal<boolean>(false);

  /**
   * Loads all Zaps owned by the authenticated user.
   */
  async loadZaps(): Promise<ZapDefinition[]> {
    this.isLoading.set(true);
    try {
      const data = await firstValueFrom(
        this.http.get<ZapDefinition[]>(this.apiBase)
      );
      this.zaps.set(data);
      return data;
    } catch (err) {
      console.error('Failed to load Zaps:', err);
      return [];
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Retrieves single Zap definition by ID.
   */
  async getZap(id: string): Promise<ZapDefinition> {
    return firstValueFrom(
      this.http.get<ZapDefinition>(`${this.apiBase}/${id}`)
    );
  }

  /**
   * Creates a new Zap and adds it to local signal state.
   */
  async createZap(zap: Partial<ZapDefinition>): Promise<ZapDefinition> {
    const created = await firstValueFrom(
      this.http.post<ZapDefinition>(this.apiBase, zap)
    );
    this.zaps.update((current) => [created, ...current]);
    return created;
  }

  /**
   * Updates an existing Zap.
   */
  async updateZap(id: string, zap: Partial<ZapDefinition>): Promise<ZapDefinition> {
    const updated = await firstValueFrom(
      this.http.put<ZapDefinition>(`${this.apiBase}/${id}`, zap)
    );
    this.zaps.update((current) =>
      current.map((item) => (item._id === id ? updated : item))
    );
    return updated;
  }

  /**
   * Optimistically toggles isActive status for a Zap.
   */
  async toggleZapStatus(id: string, isActive: boolean): Promise<void> {
    // Optimistic update
    this.zaps.update((current) =>
      current.map((item) => (item._id === id ? { ...item, isActive } : item))
    );

    try {
      await firstValueFrom(
        this.http.put<ZapDefinition>(`${this.apiBase}/${id}`, { isActive })
      );
    } catch (err) {
      console.error(`Failed to toggle status for Zap ${id}:`, err);
      // Rollback on error
      this.zaps.update((current) =>
        current.map((item) => (item._id === id ? { ...item, isActive: !isActive } : item))
      );
    }
  }

  /**
   * Deletes a Zap from database and local signal state.
   */
  async deleteZap(id: string): Promise<void> {
    await firstValueFrom(this.http.delete(`${this.apiBase}/${id}`));
    this.zaps.update((current) => current.filter((item) => item._id !== id));
  }

  /**
   * Fetches execution history logs for a specific Zap.
   */
  async loadLogs(zapId: string): Promise<ExecutionLogItem[]> {
    this.isLoadingLogs.set(true);
    try {
      const logs = await firstValueFrom(
        this.http.get<ExecutionLogItem[]>(`${this.apiBase}/${zapId}/logs`)
      );
      this.activeLogs.set(logs);
      return logs;
    } catch (err) {
      console.error(`Failed to load logs for Zap ${zapId}:`, err);
      this.activeLogs.set([]);
      return [];
    } finally {
      this.isLoadingLogs.set(false);
    }
  }

  /**
   * Fetches accessible GitHub repositories to populate repository picker.
   */
  async fetchUserRepositories(): Promise<RepositoryItem[]> {
    this.isLoadingRepos.set(true);
    try {
      const repos = await firstValueFrom(
        this.http.get<RepositoryItem[]>(`${this.apiBase}/repos`)
      );
      this.userRepos.set(repos);
      return repos;
    } catch (err) {
      console.error('Failed to fetch repositories:', err);
      this.userRepos.set([]);
      return [];
    } finally {
      this.isLoadingRepos.set(false);
    }
  }
}
