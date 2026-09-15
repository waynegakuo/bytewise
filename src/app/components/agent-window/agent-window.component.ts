import {afterNextRender, Component, DestroyRef, effect, inject, PLATFORM_ID, signal} from '@angular/core';
import {isPlatformBrowser} from '@angular/common';
import { FormsModule } from '@angular/forms';
import {MarkdownPipe} from '../../pipes/markdown.pipe';
import {AiService} from '../../services/ai.service';
import {ProductService} from '../../services/product.service';
import {SpeechRecognitionService} from '../../services/speech-recognition.service';
import {Message} from '../../models/message.model';
import {Product} from '../../models/product.model';

@Component({
  selector: 'app-agent-window',
  standalone: true,
  imports: [FormsModule, MarkdownPipe],
  templateUrl: './agent-window.component.html',
  styleUrl: './agent-window.component.scss'
})
export class AgentWindowComponent {
  private readonly aiService = inject(AiService);
  readonly productService = inject(ProductService);
  private readonly speechService = inject(SpeechRecognitionService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);
  readonly messageHistory = signal<Message[]>([
    { text: 'Hello! I\'m your ByteWise AI shopping assistant. How can I help you today?', isUser: false }
  ]);
  readonly productList = signal<Product[]>([]);

  userInput: string = '';
  isOpen = signal<boolean>(false);
  isListening = signal<boolean>(false);
  isThinking = signal<boolean>(false);

  constructor() {
    this.productList.set(this.productService.getProducts());

    afterNextRender(() => {
      if (window.matchMedia('(min-width: 768px)').matches) {
        this.isOpen.set(true);
      }
    });

    effect(() => {
      const open = this.isOpen();
      if (!isPlatformBrowser(this.platformId)) {
        return;
      }
      document.body.classList.toggle('assistant-open', open);
    });

    this.destroyRef.onDestroy(() => {
      if (isPlatformBrowser(this.platformId)) {
        document.body.classList.remove('assistant-open');
      }
    });

    // Effect for isListening signal
    effect(() => {
      const isListening = this.speechService.isListening();
      console.log('Speech recognition isListening changed:', isListening);
      this.isListening.set(isListening);
    });

    // Effect for transcript signal
    effect(() => {
      const transcript = this.speechService.transcript();
      console.log('Transcript:', transcript);
      console.log('Is listening:', this.isListening());
      if (transcript && !this.isListening()) {
        this.userInput = transcript;
        console.log('User input:', this.userInput);
        // Auto-send the message if we have a transcript and we're not listening anymore
        if (this.userInput.trim() !== '') {
          this.sendMessage();
        }
      }
    });

    // Effect for error signal
    effect(() => {
      const error = this.speechService.error();
      if (error) {
        // Only log actual errors, not expected conditions like browser support or server-side rendering
        if (!error.includes('server environment') && !error.includes('not initialized')) {
          console.error('Speech recognition error:', error);
        }
      }
    });
  }

  onSubmit(event: Event): void {
    event.preventDefault();
    void this.sendMessage();
  }

  async sendMessage(): Promise<void> {
    if (this.userInput.trim() === '') return;

    // Add user message
    this.messageHistory.update((history) =>
      [...history, { text: this.userInput, isUser: true }]
    );

    // Clear input
    const userQuestion = this.userInput;
    this.userInput = '';

    // Set thinking state to true
    this.isThinking.set(true);

    try {
      const response = await this.aiService.askAgent(userQuestion);
      this.messageHistory.update((history) => [
        ...history,
        { isUser: false, text: response }
      ]);
    } catch (error) {
      console.error('[ByteWise] Agent request failed:', error);
      this.messageHistory.update((history) => [
        ...history,
        { isUser: false, text: this.describeAgentError(error) }
      ]);
    } finally {
      this.isThinking.set(false);
    }
  }

  toggleWindow(): void {
    this.isOpen.update(value => !value);
  }

  startVoiceRecognition(): void {
    console.log('Starting voice recognition from component');
    this.speechService.startListening();
  }

  stopVoiceRecognition(): void {
    console.log('Stopping voice recognition from component');
    this.speechService.stopListening();
  }

  /**
   * Turns Firebase / App Check failures into a short message the shopper can act on.
   *
   * Localhost needs a registered debug token; a deployed origin needs the
   * reCAPTCHA Enterprise site key allowed for that domain.
   */
  private describeAgentError(error: unknown): string {
    const detail = error instanceof Error ? error.message : String(error);

    if (/Role 'function' is not supported/i.test(detail)) {
      return 'Gemini 3.x no longer accepts the legacy function-calling role. Run npm install (Firebase SDK 12.19.0+), restart ng serve, and try again.';
    }

    if (/firebaseappcheck\.googleapis\.com.*blocked|ExchangeDebugToken/i.test(detail)) {
      return 'Your Browser API key is blocking App Check. In Google Cloud → Credentials → Browser key → API restrictions, add "Firebase App Check API" (firebaseappcheck.googleapis.com) alongside "Firebase AI Logic API". Save, wait ~5 minutes, hard refresh.';
    }

    if (/firebasevertexai\.googleapis\.com.*blocked|requests to this api/i.test(detail)) {
      return 'Google Cloud is blocking the Firebase AI Logic API for this app\'s API key. In Google Cloud → Credentials → your Browser key → API restrictions, add "Firebase AI Logic API" (firebasevertexai.googleapis.com). If you use HTTP referrer restrictions, include http://localhost:4200/* and http://127.0.0.1:4200/* for local testing.';
    }

    if (/caller does not have permission/i.test(detail)) {
      return 'Gemini returned 403 "The caller does not have permission". Run Firebase Console → AI Services → AI Logic → Get started → Gemini Developer API (this provisions the backend). Then verify the Firebase AI Logic service agent exists in IAM (service-<project-number>@gcp-sa-firebasevertexai.iam.gserviceaccount.com), and that your Browser key matches Project settings → Your apps. See FIREBASE_SETUP.md and DevTools → "[ByteWise] Localhost Firebase diagnostics".';
    }

    if (/must enforce firebase app check|deactivated in this project/i.test(detail)) {
      return 'Firebase AI Logic requires App Check. On localhost: register the App Check debug token from DevTools (not reCAPTCHA domains). Firebase Console → App Check → your web app → Manage debug tokens, then hard-refresh.';
    }

    if (/app check|403|permission_denied|unauthenticated/i.test(detail)) {
      return 'Gemini rejected this request (403). On localhost, reCAPTCHA domains do not apply — register the App Check debug token from DevTools → Console, then hard-refresh. Also verify Firebase Console → App Check → Firebase AI Logic is enforced and your debug token is listed.';
    }

    return 'Sorry, I could not complete that request. Please try again.';
  }

  toggleVoiceRecognition(): void {
    console.log('Toggling voice recognition. Current state:', this.isListening());
    if (this.isListening()) {
      console.log('Stopping voice recognition');
      this.stopVoiceRecognition();
    } else {
      console.log('Starting voice recognition');
      this.startVoiceRecognition();
    }
  }
}
