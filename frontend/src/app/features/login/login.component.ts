import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Github, GitPullRequest, ArrowRight, Sparkles, Workflow, Bot } from 'lucide-angular';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="relative min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between overflow-hidden selection:bg-indigo-500 selection:text-white">
      <!-- Background Ambient Glow -->
      <div class="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-indigo-600/20 via-purple-600/10 to-transparent blur-[120px] pointer-events-none"></div>
      <div class="absolute -top-32 left-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <!-- Top Header -->
      <header class="relative z-10 w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center shadow-lg shadow-indigo-500/20 border border-indigo-400/30">
            <lucide-icon [img]="Workflow" class="w-5 h-5 text-white"></lucide-icon>
          </div>
          <span class="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
            DevFlow <span class="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">Zaps</span>
          </span>
        </div>

        <div class="flex items-center gap-4 text-xs font-medium text-slate-400">
          <span class="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800">
            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            GitHub Webhooks Engine Ready
          </span>
        </div>
      </header>

      <!-- Hero Main Content -->
      <main class="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-12 max-w-4xl mx-auto text-center">
        <!-- Pill Badge -->
        <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-950/80 border border-indigo-500/30 text-indigo-300 text-xs font-medium mb-8 backdrop-blur-sm shadow-sm">
          <lucide-icon [img]="Sparkles" class="w-3.5 h-3.5 text-indigo-400"></lucide-icon>
          <span>Modern Developer Workflow Automation</span>
        </div>

        <!-- Main Heading -->
        <h1 class="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight mb-6 max-w-3xl">
          DevFlow: Workflow Automation for Developers
        </h1>

        <!-- Subtitle -->
        <p class="text-lg sm:text-xl text-slate-400 max-w-2xl mb-10 leading-relaxed font-normal">
          Connect your GitHub repositories, automate Pull Request reviews, and streamline development workflows.
        </p>

        <!-- GitHub Sign In Action -->
        <div class="flex flex-col sm:flex-row items-center gap-4 w-full justify-center max-w-md">
          <button
            (click)="authService.loginWithGitHub()"
            class="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-white hover:bg-slate-100 text-slate-950 font-semibold text-sm flex items-center justify-center gap-3 shadow-xl shadow-white/10 hover:shadow-white/20 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-slate-950 cursor-pointer"
          >
            <lucide-icon [img]="Github" class="w-5 h-5 text-slate-950"></lucide-icon>
            <span>Sign in with GitHub</span>
            <lucide-icon [img]="ArrowRight" class="w-4 h-4 text-slate-500"></lucide-icon>
          </button>
        </div>

        <p class="text-xs text-slate-500 mt-4">
          Requires read:user, repo, and admin:repo_hook permissions for webhook automation.
        </p>

        <!-- Interactive Workflow Simulation Preview Card -->
        <div class="mt-16 w-full max-w-2xl rounded-2xl bg-slate-900/90 border border-slate-800/80 p-5 shadow-2xl backdrop-blur-md text-left">
          <div class="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
            <div class="flex items-center gap-2">
              <span class="w-3 h-3 rounded-full bg-rose-500/80 inline-block"></span>
              <span class="w-3 h-3 rounded-full bg-amber-500/80 inline-block"></span>
              <span class="w-3 h-3 rounded-full bg-emerald-500/80 inline-block"></span>
              <span class="text-xs font-mono text-slate-400 ml-2">devflow-pipeline.zap</span>
            </div>
            <span class="text-[11px] font-mono uppercase tracking-wider text-emerald-400 bg-emerald-950/60 border border-emerald-800/50 px-2 py-0.5 rounded">
              Active Trigger
            </span>
          </div>

          <div class="space-y-3 font-mono text-xs">
            <div class="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between">
              <div class="flex items-center gap-2.5 text-slate-300">
                <lucide-icon [img]="GitPullRequest" class="w-4 h-4 text-indigo-400"></lucide-icon>
                <span>Trigger: <strong class="text-white">pull_request.opened</strong></span>
              </div>
              <span class="text-slate-500 text-[11px]">github / main</span>
            </div>

            <div class="flex justify-center text-indigo-400 my-0.5">
              <div class="w-0.5 h-3 bg-indigo-500/50"></div>
            </div>

            <div class="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between">
              <div class="flex items-center gap-2.5 text-slate-300">
                <lucide-icon [img]="Bot" class="w-4 h-4 text-emerald-400"></lucide-icon>
                <span>Action: <strong class="text-white">Comment on PR</strong></span>
              </div>
              <span ngNonBindable class="text-slate-400 text-[11px] truncate max-w-[220px]">
                "Thanks @{{pr.author}} for PR #{{pr.number}}!"
              </span>
            </div>
          </div>
        </div>
      </main>

      <!-- Footer -->
      <footer class="relative z-10 w-full max-w-7xl mx-auto px-6 py-6 text-center text-xs text-slate-600 border-t border-slate-900">
        DevFlow Zaps &copy; 2026. Built with MEAN Stack & TypeScript.
      </footer>
    </div>
  `,
})
export class LoginComponent {
  readonly authService = inject(AuthService);
  readonly Github = Github;
  readonly GitPullRequest = GitPullRequest;
  readonly ArrowRight = ArrowRight;
  readonly Sparkles = Sparkles;
  readonly Workflow = Workflow;
  readonly Bot = Bot;
}
