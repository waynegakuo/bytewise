import {Component, inject, signal} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgClass } from '@angular/common';
import {AiService} from '../../services/ai.service';
import {ProductService} from '../../services/product.service';
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
  readonly messageHistory = signal<Message[]>([
    { text: 'Hello! I\'m your ByteWise AI shopping assistant. How can I help you today?', isUser: false }
  ]);
  readonly productList = signal<Product[]>([]);

  userInput: string = '';
  isOpen = signal<boolean>(false);

  constructor() {
    this.productList.set(this.productService.getProducts());
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

    const response = await this.aiService.askAgent(userQuestion);
    this.messageHistory.update((history) => [
      ...history,
      { isUser: false, text: response }
    ])
  }

  toggleWindow(): void {
    this.isOpen.update(value => !value);
  }
}
