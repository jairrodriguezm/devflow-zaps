import { ApplicationConfig, importProvidersFrom, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
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
    provideZonelessChangeDetection(),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withFetch(), withInterceptors([credentialsInterceptor])),
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
