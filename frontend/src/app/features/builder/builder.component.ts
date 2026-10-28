import { Component, OnInit, ElementRef, ViewChild, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  LucideAngularModule,
  ArrowRight,
  GitPullRequest,
  Bot,
  MessageSquare,
  Sparkles,
  ChevronLeft,
  Check,
  RefreshCw,
  AlertCircle,
  HelpCircle,
} from 'lucide-angular';
import { ZapService } from '../../core/services/zap.service';
import { SupportedApp, TriggerEventType, ActionEventType, ZapDefinition } from '../../core/models/zap.model';

interface AppOption {
  id: SupportedApp;
  name: string;
  badge: 'Active' | 'Simulated';
  description: string;
}

@Component({
  selector: 'app-builder',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, LucideAngularModule],
  template: `
    <div class="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans pb-16">
      <!-- Top Navigation Header -->
      <header class="sticky top-0 z-30 bg-slate-950/80 border-b border-slate-800/80 backdrop-blur-md">
        <div class="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
          <!-- Back and Editable Title -->
          <div class="flex items-center gap-4 flex-1 min-w-0">
            <a
              routerLink="/"
              class="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent hover:border-slate-800 transition-colors"
              title="Back to Workflows"
            >
              <lucide-icon [img]="ChevronLeft" class="w-5 h-5"></lucide-icon>
            </a>

            <div class="flex items-center gap-2 flex-1 min-w-0">
              <input
                type="text"
                [(ngModel)]="zapName"
                placeholder="Untitled Zap"
                class="bg-transparent hover:bg-slate-900/60 focus:bg-slate-900 border border-transparent focus:border-slate-700 rounded-lg px-2.5 py-1 text-lg font-bold text-white focus:outline-none transition-colors w-full max-w-sm"
              />
              <span class="text-xs px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800 shrink-0">
                {{ isEditMode() ? 'Editing' : 'Draft' }}
              </span>
            </div>
          </div>

          <!-- Save & Activate CTA Button -->
          <div class="flex items-center gap-3">
            <button
              (click)="saveZap()"
              [disabled]="!isFormValid() || isSaving()"
              class="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/30 transition-all cursor-pointer"
            >
              @if (isSaving()) {
                <lucide-icon [img]="RefreshCw" class="w-4 h-4 animate-spin"></lucide-icon>
                <span>Saving...</span>
              } @else {
                <lucide-icon [img]="Check" class="w-4 h-4"></lucide-icon>
                <span>Save &amp; Activate</span>
              }
            </button>
          </div>
        </div>
      </header>

      <!-- Main Visual Pipeline Canvas -->
      <main class="flex-1 max-w-3xl w-full mx-auto px-6 py-10 flex flex-col items-center">
        <!-- Vertical Pipeline Container -->
        <div class="w-full space-y-6">

          <!-- ================= STEP 1: TRIGGER CARD ================= -->
          <section class="rounded-2xl bg-slate-900/90 border border-slate-800 p-6 shadow-xl relative backdrop-blur-sm">
            <div class="flex items-center justify-between pb-4 mb-5 border-b border-slate-800">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-sm">
                  1
                </div>
                <div>
                  <h2 class="text-base font-semibold text-white">Trigger: When this happens...</h2>
                  <p class="text-xs text-slate-400">Specifies the developer event that triggers this workflow.</p>
                </div>
              </div>
              <span class="text-[11px] font-mono uppercase tracking-wider text-indigo-400 bg-indigo-950/60 border border-indigo-800/50 px-2 py-0.5 rounded">
                Trigger
              </span>
            </div>

            <!-- App Picker Selector -->
            <div class="mb-5">
              <label class="block text-xs font-semibold text-slate-300 mb-2">Select App</label>
              <div class="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                @for (app of availableTriggerApps; track app.id) {
                  <button
                    type="button"
                    (click)="triggerApp.set(app.id)"
                    [class.border-indigo-500]="triggerApp() === app.id"
                    [class.bg-indigo-950]="triggerApp() === app.id"
                    class="p-3 rounded-xl border border-slate-800 bg-slate-950/60 hover:border-slate-700 text-left transition-all cursor-pointer relative"
                  >
                    <div class="flex items-center justify-between mb-1">
                      <span class="font-semibold text-xs text-white">{{ app.name }}</span>
                      <span
                        class="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase"
                        [ngClass]="app.badge === 'Active' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-slate-800 text-slate-400'"
                      >
                        {{ app.badge }}
                      </span>
                    </div>
                    <p class="text-[11px] text-slate-400 leading-tight">{{ app.description }}</p>
                  </button>
                }
              </div>
            </div>

            <!-- Event Selector -->
            <div class="mb-5">
              <label class="block text-xs font-semibold text-slate-300 mb-2">Event</label>
              <div class="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs flex items-center justify-between">
                <div class="flex items-center gap-2.5 text-white">
                  <lucide-icon [img]="GitPullRequest" class="w-4 h-4 text-indigo-400"></lucide-icon>
                  <span class="font-medium">Pull Request Opened</span>
                </div>
                <span class="text-slate-500 text-[11px] font-mono">pull_request.opened</span>
              </div>
            </div>

            <!-- Repository Selector -->
            <div>
              <div class="flex items-center justify-between mb-2">
                <label class="block text-xs font-semibold text-slate-300">GitHub Repository</label>
                <button
                  type="button"
                  (click)="zapService.fetchUserRepositories()"
                  [disabled]="zapService.isLoadingRepos()"
                  class="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
                >
                  <lucide-icon [img]="RefreshCw" class="w-3 h-3" [ngClass]="{ 'animate-spin': zapService.isLoadingRepos() }"></lucide-icon>
                  <span>Refresh repos</span>
                </button>
              </div>

              @if (zapService.userRepos().length > 0) {
                <select
                  [(ngModel)]="selectedRepoFullName"
                  class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 text-xs text-white focus:outline-none transition-colors"
                >
                  <option value="" disabled>-- Select a GitHub repository --</option>
                  @for (repo of zapService.userRepos(); track repo.id) {
                    <option [value]="repo.fullName">
                      {{ repo.fullName }} {{ repo.private ? '(Private)' : '' }}
                    </option>
                  }
                </select>
              } @else {
                <!-- Manual input fallback if API is fetching or user types directly -->
                <div class="relative">
                  <input
                    type="text"
                    [(ngModel)]="selectedRepoFullName"
                    placeholder="owner/repository-name (e.g. octocat/Hello-World)"
                    class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 text-xs text-white focus:outline-none transition-colors"
                  />
                </div>
              }
              <p class="text-[11px] text-slate-500 mt-1.5">
                DevFlow will automatically subscribe a webhook to this repository to listen for incoming pull requests.
              </p>
            </div>
          </section>

          <!-- Vertical Pipeline Connector (Arrow) -->
          <div class="flex flex-col items-center justify-center my-1">
            <div class="w-0.5 h-6 bg-gradient-to-b from-indigo-500 to-indigo-600/50"></div>
            <div class="w-7 h-7 rounded-full bg-slate-900 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shadow-lg shadow-indigo-500/10">
              <span class="text-xs font-bold leading-none">&#8595;</span>
            </div>
            <div class="w-0.5 h-6 bg-gradient-to-b from-indigo-600/50 to-indigo-500"></div>
          </div>

          <!-- ================= STEP 2: ACTION CARD ================= -->
          <section class="rounded-2xl bg-slate-900/90 border border-slate-800 p-6 shadow-xl relative backdrop-blur-sm">
            <div class="flex items-center justify-between pb-4 mb-5 border-b border-slate-800">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-sm">
                  2
                </div>
                <div>
                  <h2 class="text-base font-semibold text-white">Action: Do this...</h2>
                  <p class="text-xs text-slate-400">Action performed automatically whenever the trigger fires.</p>
                </div>
              </div>
              <span class="text-[11px] font-mono uppercase tracking-wider text-emerald-400 bg-emerald-950/60 border border-emerald-800/50 px-2 py-0.5 rounded">
                Action
              </span>
            </div>

            <!-- Action App Selector -->
            <div class="mb-5">
              <label class="block text-xs font-semibold text-slate-300 mb-2">Target App</label>
              <div class="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs flex items-center justify-between">
                <div class="flex items-center gap-2.5 text-white">
                  <div class="w-5 h-5 rounded-md bg-white flex items-center justify-center text-slate-950 text-xs font-bold">
                    GH
                  </div>
                  <span class="font-medium">GitHub</span>
                </div>
                <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                  Fully Functional
                </span>
              </div>
            </div>

            <!-- Action Event Selector -->
            <div class="mb-5">
              <label class="block text-xs font-semibold text-slate-300 mb-2">Action Event</label>
              <div class="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs flex items-center justify-between">
                <div class="flex items-center gap-2.5 text-white">
                  <lucide-icon [img]="Bot" class="w-4 h-4 text-emerald-400"></lucide-icon>
                  <span class="font-medium">Comment on Pull Request</span>
                </div>
                <span class="text-slate-500 text-[11px] font-mono">issues.createComment</span>
              </div>
            </div>

            <!-- Comment Template Editor -->
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <label class="block text-xs font-semibold text-slate-300">
                  Comment Template
                </label>
                <span class="text-[11px] text-slate-500">Supports Markdown &amp; Tokens</span>
              </div>

              <!-- Field Mapping Bar (Pill Buttons) -->
              <div class="p-2.5 rounded-xl bg-slate-950/90 border border-slate-800 space-y-1.5">
                <span class="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Available Variables (click to insert):
                </span>
                <div class="flex flex-wrap gap-1.5">
                  @for (token of availableTokens; track token) {
                    <button
                      type="button"
                      (click)="insertToken(token)"
                      class="px-2.5 py-1 rounded-lg bg-indigo-950/60 hover:bg-indigo-900/80 border border-indigo-800/60 hover:border-indigo-600 text-indigo-300 font-mono text-[11px] transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95"
                      title="Click to insert {{ token }} into comment template"
                    >
                      {{ token }}
                    </button>
                  }
                </div>
              </div>

              <!-- Textarea for Template -->
              <textarea
                #commentTextarea
                [(ngModel)]="commentTemplate"
                rows="4"
                [placeholder]="defaultPlaceholder"
                class="w-full px-3.5 py-3 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 text-xs font-mono text-slate-100 placeholder-slate-600 focus:outline-none transition-colors resize-y leading-relaxed"
              ></textarea>

              <!-- Live Preview Rendering -->
              <div class="p-3 rounded-xl bg-slate-950/50 border border-slate-800/80">
                <span class="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                  Live Preview:
                </span>
                <p class="text-xs text-slate-300 font-mono italic break-words">
                  {{ renderedPreview() }}
                </p>
              </div>
            </div>
          </section>

        </div>
      </main>
    </div>
  `,
})
export class BuilderComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly zapService = inject(ZapService);

  @ViewChild('commentTextarea') commentTextarea?: ElementRef<HTMLTextAreaElement>;

  // Icons
  readonly ArrowRight = ArrowRight;
  readonly GitPullRequest = GitPullRequest;
  readonly Bot = Bot;
  readonly MessageSquare = MessageSquare;
  readonly Sparkles = Sparkles;
  readonly ChevronLeft = ChevronLeft;
  readonly Check = Check;
  readonly RefreshCw = RefreshCw;
  readonly AlertCircle = AlertCircle;
  readonly HelpCircle = HelpCircle;

  // Form State Signals
  readonly isEditMode = signal<boolean>(false);
  readonly zapId = signal<string | null>(null);
  readonly isSaving = signal<boolean>(false);

  zapName = 'Auto PR Commenter';
  triggerApp = signal<SupportedApp>('github');
  selectedRepoFullName = '';
  commentTemplate = 'Thank you @{{pr.author}} for opening pull request #{{pr.number}}: "{{pr.title}}"! devflow-bot';
  readonly defaultPlaceholder = 'Thank you @{{pr.author}} for opening pull request #{{pr.number}}: "{{pr.title}}"! devflow-bot';

  // Available Tokens
  readonly availableTokens = [
    '{{pr.author}}',
    '{{pr.title}}',
    '{{pr.number}}',
    '{{pr.url}}',
    '{{repo.name}}',
  ];

  // Available Trigger Apps
  readonly availableTriggerApps: AppOption[] = [
    {
      id: 'github',
      name: 'GitHub',
      badge: 'Active',
      description: 'Triggered directly via real GitHub webhook events.',
    },
    {
      id: 'slack',
      name: 'Slack',
      badge: 'Simulated',
      description: 'Incoming channel message event.',
    },
    {
      id: 'linear',
      name: 'Linear',
      badge: 'Simulated',
      description: 'Issue status or pull request linked.',
    },
    {
      id: 'jira',
      name: 'Jira',
      badge: 'Simulated',
      description: 'Ticket transitioned or comment created.',
    },
    {
      id: 'discord',
      name: 'Discord',
      badge: 'Simulated',
      description: 'Developer community channel event.',
    },
  ];

  // Live Interpolation Preview
  readonly renderedPreview = computed(() => {
    let t = this.commentTemplate || '';
    t = t.replace(/\{\{\s*pr\.author\s*\}\}/g, 'octocat');
    t = t.replace(/\{\{\s*pr\.title\s*\}\}/g, 'feat: support dark mode');
    t = t.replace(/\{\{\s*pr\.number\s*\}\}/g, '42');
    t = t.replace(/\{\{\s*pr\.url\s*\}\}/g, 'https://github.com/octocat/Hello-World/pull/42');
    t = t.replace(/\{\{\s*repo\.name\s*\}\}/g, this.getRepoNameOnly());
    return t || '(Enter a comment template to see preview)';
  });

  // Form Validation
  readonly isFormValid = computed(() => {
    return (
      this.zapName.trim().length > 0 &&
      this.selectedRepoFullName.trim().length > 0 &&
      this.commentTemplate.trim().length > 0
    );
  });

  ngOnInit(): void {
    this.zapService.fetchUserRepositories();

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode.set(true);
      this.zapId.set(id);
      this.loadZapData(id);
    }
  }

  async loadZapData(id: string): Promise<void> {
    try {
      const zap = await this.zapService.getZap(id);
      this.zapName = zap.name;
      this.triggerApp.set(zap.trigger.app);
      this.selectedRepoFullName = zap.trigger.config.repoFullName;
      this.commentTemplate = zap.action.config.commentTemplate;
    } catch (err) {
      console.error('Failed to load Zap for editing:', err);
      this.router.navigate(['/']);
    }
  }

  insertToken(token: string): void {
    if (!this.commentTextarea) {
      this.commentTemplate += token;
      return;
    }

    const textarea = this.commentTextarea.nativeElement;
    const startPos = textarea.selectionStart ?? this.commentTemplate.length;
    const endPos = textarea.selectionEnd ?? this.commentTemplate.length;

    this.commentTemplate =
      this.commentTemplate.substring(0, startPos) +
      token +
      this.commentTemplate.substring(endPos);

    // Restore focus and cursor position after insertion
    setTimeout(() => {
      textarea.focus();
      const newPos = startPos + token.length;
      textarea.setSelectionRange(newPos, newPos);
    }, 0);
  }

  getRepoNameOnly(): string {
    const parts = this.selectedRepoFullName.split('/');
    return parts[1] || parts[0] || 'repository';
  }

  async saveZap(): Promise<void> {
    if (!this.isFormValid() || this.isSaving()) return;

    this.isSaving.set(true);
    const fullName = this.selectedRepoFullName.trim();
    const [owner, name] = fullName.split('/');

    const payload: Partial<ZapDefinition> = {
      name: this.zapName.trim(),
      isActive: true,
      trigger: {
        app: this.triggerApp(),
        event: 'github:pull_request_opened',
        config: {
          repoOwner: owner || 'owner',
          repoName: name || fullName,
          repoFullName: fullName,
        },
      },
      action: {
        app: 'github',
        event: 'github:comment_pull_request',
        config: {
          commentTemplate: this.commentTemplate.trim(),
        },
      },
    };

    try {
      if (this.isEditMode() && this.zapId()) {
        await this.zapService.updateZap(this.zapId()!, payload);
      } else {
        await this.zapService.createZap(payload);
      }
      this.router.navigate(['/']);
    } catch (err) {
      console.error('Failed to save Zap:', err);
      alert('Failed to save Zap. Please check your network and credentials.');
    } finally {
      this.isSaving.set(false);
    }
  }
}
