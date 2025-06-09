import {Component, effect, inject, signal} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgClass } from '@angular/common';
import {AiService} from '../../services/ai.service';
import {ProductService} from '../../services/product.service';
import {SpeechRecognitionService} from '../../services/speech-recognition.service';
import {Message} from '../../models/message.model';
import {Product} from '../../models/product.model';

@Component({
  selector: 'app-agent-window',
  standalone: true,
  imports: [FormsModule, NgClass],
  templateUrl: './agent-window.component.html',
  styleUrl: './agent-window.component.scss'
})
export class AgentWindowComponent {
  private readonly aiService = inject(AiService);
  readonly productService = inject(ProductService);
  private readonly speechService = inject(SpeechRecognitionService);
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
    } finally {
      // Set thinking state to false regardless of success or failure
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
