import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import {
  LucideAngularModule,
  Plus,
  Play,
  Pause,
  Trash2,
  Edit3,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  LogOut,
  Workflow,
  Sparkles,
  RefreshCw,
  X,
  GitPullRequest,
  AlertCircle,
  MessageSquare,
} from 'lucide-angular';
import { AuthService } from '../../core/services/auth.service';
import { ZapService } from '../../core/services/zap.service';
import { ZapDefinition, ExecutionLogItem } from '../../core/models/zap.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideAngularModule],
  template: `
    <div class="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <!-- Top Navigation Bar -->
      <nav class="sticky top-0 z-30 bg-slate-950/80 border-b border-slate-800/80 backdrop-blur-md">
        <div class="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <!-- Logo & Brand -->
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center shadow-md shadow-indigo-500/20 border border-indigo-400/30">
              <lucide-icon [img]="Workflow" class="w-5 h-5 text-white"></lucide-icon>
            </div>
            <span class="text-lg font-bold tracking-tight text-white flex items-center gap-2">
              DevFlow <span class="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">Zaps</span>
            </span>
          </div>

          <!-- User Profile & Sign Out -->
          <div class="flex items-center gap-4">
            @if (authService.currentUser(); as user) {
              <div class="flex items-center gap-3 pl-3 pr-2 py-1.5 rounded-full bg-slate-900 border border-slate-800">
                @if (user.avatarUrl) {
                  <img [src]="user.avatarUrl" [alt]="user.username" class="w-6 h-6 rounded-full ring-1 ring-slate-700 object-cover" />
                } @else {
                  <div class="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold text-white">
                    {{ user.username.charAt(0).toUpperCase() }}
                  </div>
                }
                <span class="text-xs font-medium text-slate-300">&#64;{{ user.username }}</span>
                <button
                  (click)="authService.logout()"
                  title="Sign Out"
                  class="p-1 rounded-full text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <lucide-icon [img]="LogOut" class="w-3.5 h-3.5"></lucide-icon>
                </button>
              </div>
            }
          </div>
        </div>
      </nav>

      <!-- Main Body Container -->
      <main class="flex-1 max-w-7xl w-full mx-auto px-6 py-8">
        <!-- Header Section -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 class="text-2xl sm:text-3xl font-bold tracking-tight text-white">Workflows</h1>
            <p class="text-sm text-slate-400 mt-1">Manage and monitor your automated pull request workflows.</p>
          </div>
          <button
            routerLink="/builder"
            class="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/30 transition-all cursor-pointer"
          >
            <lucide-icon [img]="Plus" class="w-4 h-4"></lucide-icon>
            <span>+ Create Zap</span>
          </button>
        </div>

        <!-- Loading State -->
        @if (zapService.isLoading()) {
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            @for (item of [1, 2, 3]; track item) {
              <div class="h-48 rounded-2xl bg-slate-900/50 border border-slate-800/80 animate-pulse p-6"></div>
            }
          </div>
        } @else {
          <!-- Empty State -->
          @if (zapService.zaps().length === 0) {
            <div class="rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 p-12 text-center max-w-xl mx-auto my-12">
              <div class="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto mb-4">
                <lucide-icon [img]="Workflow" class="w-6 h-6"></lucide-icon>
              </div>
              <h3 class="text-lg font-semibold text-white mb-2">No workflows found</h3>
              <p class="text-sm text-slate-400 mb-6 leading-relaxed">
                No workflows found. Create your first Zap to start automating your pull requests.
              </p>
              <button
                routerLink="/builder"
                class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-950 font-semibold text-sm shadow-md transition-all cursor-pointer"
              >
                <lucide-icon [img]="Plus" class="w-4 h-4 text-slate-950"></lucide-icon>
                <span>Create Zap</span>
              </button>
            </div>
          } @else {
            <!-- Zaps Grid -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              @for (zap of zapService.zaps(); track zap._id) {
                <div class="rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700/80 p-5 flex flex-col justify-between shadow-xl transition-all duration-200 hover:-translate-y-0.5">
                  <div>
                    <!-- Top Card Bar: Name and Active Status -->
                    <div class="flex items-start justify-between gap-3 mb-3">
                      <h2 class="font-semibold text-white text-base truncate flex-1" [title]="zap.name">
                        {{ zap.name }}
                      </h2>
                      <!-- Active / Inactive Badge -->
                      <span
                        class="px-2.5 py-0.5 text-xs font-semibold rounded-full border inline-flex items-center gap-1.5 shrink-0"
                        [ngClass]="{
                          'bg-emerald-500/10 text-emerald-400 border-emerald-500/20': zap.isActive,
                          'bg-slate-800/80 text-slate-400 border-slate-700/60': !zap.isActive
                        }"
                      >
                        <span class="w-1.5 h-1.5 rounded-full" [ngClass]="zap.isActive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'"></span>
                        {{ zap.isActive ? 'Active' : 'Inactive' }}
                      </span>
                    </div>

                    <!-- Flow Summary Chip -->
                    <div class="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 mb-4 text-xs font-mono">
                      <div class="flex items-center gap-2 text-slate-300">
                        <lucide-icon [img]="GitPullRequest" class="w-3.5 h-3.5 text-indigo-400 shrink-0"></lucide-icon>
                        <span class="truncate font-semibold">{{ zap.trigger.config.repoFullName }}</span>
                      </div>
                      <div class="flex items-center gap-2 text-slate-400 mt-2 pl-0.5">
                        <lucide-icon [img]="ArrowRight" class="w-3 h-3 text-slate-600 shrink-0"></lucide-icon>
                        <span class="truncate text-[11px] text-slate-300">
                          Action: Comment on PR
                        </span>
                      </div>
                    </div>
                  </div>

                  <!-- Card Bottom Actions & Reactive Toggle Switch -->
                  <div class="border-t border-slate-800/80 pt-3.5 flex items-center justify-between">
                    <!-- Toggle Switch -->
                    <label class="inline-flex items-center gap-2 cursor-pointer select-none">
                      <div class="relative inline-flex items-center">
                        <input
                          type="checkbox"
                          [checked]="zap.isActive"
                          (change)="zapService.toggleZapStatus(zap._id!, !zap.isActive)"
                          class="sr-only peer"
                        />
                        <div class="w-8 h-4 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-500"></div>
                      </div>
                      <span class="text-xs font-medium text-slate-400">
                        {{ zap.isActive ? 'Active' : 'Inactive' }}
                      </span>
                    </label>

                    <!-- Buttons: Edit, Logs, Delete -->
                    <div class="flex items-center gap-1">
                      <button
                        (click)="openLogsDrawer(zap)"
                        title="Execution Logs"
                        class="p-2 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-slate-800 transition-colors cursor-pointer text-xs flex items-center gap-1"
                      >
                        <lucide-icon [img]="Clock" class="w-4 h-4"></lucide-icon>
                      </button>

                      <a
                        [routerLink]="['/builder', zap._id]"
                        title="Edit Zap"
                        class="p-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors cursor-pointer"
                      >
                        <lucide-icon [img]="Edit3" class="w-4 h-4"></lucide-icon>
                      </a>

                      <button
                        (click)="confirmDelete(zap)"
                        title="Delete Zap"
                        class="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
                      >
                        <lucide-icon [img]="Trash2" class="w-4 h-4"></lucide-icon>
                      </button>
                    </div>
                  </div>
                </div>
              }
            </div>
          }
        }
      </main>

      <!-- Slide-Out Drawer for Execution History -->
      @if (selectedZapForLogs()) {
        <div class="fixed inset-0 z-50 overflow-hidden">
          <!-- Backdrop -->
          <div
            (click)="closeLogsDrawer()"
            class="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
          ></div>

          <div class="fixed inset-y-0 right-0 pl-10 max-w-full flex">
            <div class="w-screen max-w-md bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col">
              <!-- Drawer Header -->
              <div class="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
                <div>
                  <h3 class="text-lg font-bold text-white flex items-center gap-2">
                    <lucide-icon [img]="Clock" class="w-5 h-5 text-indigo-400"></lucide-icon>
                    Execution History
                  </h3>
                  <p class="text-xs text-slate-400 mt-0.5 truncate max-w-[280px]">
                    {{ selectedZapForLogs()?.name }}
                  </p>
                </div>
                <div class="flex items-center gap-2">
                  <button
                    (click)="refreshLogs()"
                    [disabled]="zapService.isLoadingLogs()"
                    title="Refresh logs"
                    class="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <lucide-icon [img]="RefreshCw" class="w-4 h-4" [ngClass]="{ 'animate-spin': zapService.isLoadingLogs() }"></lucide-icon>
                  </button>
                  <button
                    (click)="closeLogsDrawer()"
                    class="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <lucide-icon [img]="X" class="w-4 h-4"></lucide-icon>
                  </button>
                </div>
              </div>

              <!-- Drawer Body: Logs List -->
              <div class="flex-1 overflow-y-auto p-6 space-y-4">
                @if (zapService.isLoadingLogs()) {
                  <div class="text-center py-12 text-slate-500 text-sm">
                    <lucide-icon [img]="RefreshCw" class="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-400"></lucide-icon>
                    Loading execution logs...
                  </div>
                } @else if (zapService.activeLogs().length === 0) {
                  <div class="text-center py-12 px-4 rounded-xl border border-dashed border-slate-800 text-slate-500">
                    <lucide-icon [img]="Clock" class="w-8 h-8 mx-auto mb-2 opacity-50"></lucide-icon>
                    <p class="text-sm font-medium text-slate-400">No executions recorded yet</p>
                    <p class="text-xs text-slate-500 mt-1">
                      Logs will appear here once GitHub sends a pull_request.opened event.
                    </p>
                  </div>
                } @else {
                  @for (log of zapService.activeLogs(); track log._id) {
                    <div class="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-mono space-y-2">
                      <!-- Status and Date -->
                      <div class="flex items-center justify-between">
                        <span
                          class="px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider inline-flex items-center gap-1"
                          [ngClass]="{
                            'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60': log.status === 'success',
                            'bg-rose-950/80 text-rose-400 border border-rose-800/60': log.status === 'failed',
                            'bg-indigo-950/80 text-indigo-400 border border-indigo-800/60': log.status === 'simulated'
                          }"
                        >
                          @if (log.status === 'success') {
                            <lucide-icon [img]="CheckCircle2" class="w-3 h-3"></lucide-icon>
                          } @else if (log.status === 'failed') {
                            <lucide-icon [img]="XCircle" class="w-3 h-3"></lucide-icon>
                          } @else {
                            <lucide-icon [img]="Sparkles" class="w-3 h-3"></lucide-icon>
                          }
                          {{ log.status }}
                        </span>

                        <span class="text-slate-500 text-[11px]">
                          {{ formatDate(log.executedAt) }}
                        </span>
                      </div>

                      <!-- PR Link if available -->
                      @if (log.details.prNumber) {
                        <div class="flex items-center justify-between pt-1 text-slate-300">
                          <span>Pull Request #{{ log.details.prNumber }}</span>
                          @if (log.details.prUrl) {
                            <a
                              [href]="log.details.prUrl"
                              target="_blank"
                              rel="noopener noreferrer"
                              class="text-indigo-400 hover:text-indigo-300 inline-flex items-center gap-1 text-[11px] underline"
                            >
                              <span>View PR</span>
                              <lucide-icon [img]="ExternalLink" class="w-3 h-3"></lucide-icon>
                            </a>
                          }
                        </div>
                      }

                      <!-- Rendered Comment or Error -->
                      @if (log.details.renderedComment) {
                        <div class="p-2.5 rounded-lg bg-slate-900 border border-slate-800/80 text-slate-300 text-[11px] break-words">
                          <span class="text-slate-500 block mb-1">Comment Posted:</span>
                          {{ log.details.renderedComment }}
                        </div>
                      }

                      @if (log.details.error) {
                        <div class="p-2.5 rounded-lg bg-rose-950/30 border border-rose-900/50 text-rose-300 text-[11px] break-words">
                          <span class="text-rose-400 font-semibold block mb-0.5">Error:</span>
                          {{ log.details.error }}
                        </div>
                      }

                      <div class="text-[10px] text-slate-600 truncate pt-1">
                        Delivery ID: {{ log.deliveryId }}
                      </div>
                    </div>
                  }
                }
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export class DashboardComponent implements OnInit {
  readonly authService = inject(AuthService);
  readonly zapService = inject(ZapService);
  private readonly router = inject(Router);

  readonly selectedZapForLogs = signal<ZapDefinition | null>(null);

  // Icons
  readonly Plus = Plus;
  readonly Play = Play;
  readonly Pause = Pause;
  readonly Trash2 = Trash2;
  readonly Edit3 = Edit3;
  readonly ExternalLink = ExternalLink;
  readonly CheckCircle2 = CheckCircle2;
  readonly XCircle = XCircle;
  readonly Clock = Clock;
  readonly ArrowRight = ArrowRight;
  readonly LogOut = LogOut;
  readonly Workflow = Workflow;
  readonly Sparkles = Sparkles;
  readonly RefreshCw = RefreshCw;
  readonly X = X;
  readonly GitPullRequest = GitPullRequest;
  readonly AlertCircle = AlertCircle;
  readonly MessageSquare = MessageSquare;

  ngOnInit(): void {
    this.zapService.loadZaps();
  }

  openLogsDrawer(zap: ZapDefinition): void {
    this.selectedZapForLogs.set(zap);
    if (zap._id) {
      this.zapService.loadLogs(zap._id);
    }
  }

  closeLogsDrawer(): void {
    this.selectedZapForLogs.set(null);
  }

  refreshLogs(): void {
    const zap = this.selectedZapForLogs();
    if (zap?._id) {
      this.zapService.loadLogs(zap._id);
    }
  }

  async confirmDelete(zap: ZapDefinition): Promise<void> {
    if (!zap._id) return;
    const confirmed = confirm(`Are you sure you want to delete workflow "${zap.name}"?`);
    if (confirmed) {
      await this.zapService.deleteZap(zap._id);
    }
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }
}
