import { ApplicationConfig, importProvidersFrom, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { credentialsInterceptor } from './core/interceptors/credentials.interceptor';
import {
  LucideAngularModule,
  Github,
  GitPullRequest,
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
  ChevronRight,
  Sparkles,
  RefreshCw,
  LogOut,
  Layers,
  Bot,
  Workflow,
  MessageSquare,
  Check,
  Copy,
  X,
  AlertCircle,
} from 'lucide-angular';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withInterceptors([credentialsInterceptor])),
    importProvidersFrom(
      LucideAngularModule.pick({
        Github,
        GitPullRequest,
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
        ChevronRight,
        Sparkles,
        RefreshCw,
        LogOut,
        Layers,
        Bot,
        Workflow,
        MessageSquare,
        Check,
        Copy,
        X,
        AlertCircle,
      })
    ),
  ],
};
