import { inject, Injectable } from '@angular/core';
import {
  getGenerativeModel,
  type ChatSession,
  type GenerateContentResult,
} from 'firebase/ai';
import { FIREBASE_AI } from '../firebase/tokens';
import { ProductService } from './product.service';
import {
  executeShoppingTool,
  SHOPPING_AGENT_MODEL,
  SHOPPING_AGENT_SYSTEM_INSTRUCTION,
  shoppingTools,
} from './ai.tools';

/**
 * Caps tool-call round trips in a single user turn.
 *
 * Gemini may chain tools (list inventory, then add to cart). Without a cap,
 * a malformed loop could burn quota. Eight rounds covers the shopping flows
 * in this demo with headroom.
 */
const MAX_TOOL_ROUNDS = 8;

/**
 * Shopping assistant built on Firebase AI Logic (Gemini) + function calling.
 *
 * **How the pieces connect**
 * 1. {@link provideBytewiseFirebase} initializes App Check (reCAPTCHA
 *    Enterprise or a debug token) and a Gemini client that sends
 *    *limited-use* App Check tokens on every request.
 * 2. This service starts a chat with {@link shoppingTools} so Gemini can
 *    choose store actions instead of hallucinating stock/cart state.
 * 3. {@link askAgent} sends the user prompt, runs any tool calls against
 *    {@link ProductService}, and returns Gemini's final text.
 *
 * The UI ({@link AgentWindowComponent}) never talks to Firebase AI directly;
 * it only calls {@link askAgent}.
 */
@Injectable({
  providedIn: 'root',
})
export class AiService {
  private readonly productService = inject(ProductService);

  /**
   * Gemini client from DI. Resolving this token also initializes App Check
   * (see `createFirebaseAI` in `firebase.providers.ts`).
   */
  private readonly ai = inject(FIREBASE_AI);

  /**
   * Multi-turn chat. Created lazily on the first user message so SSR never
   * opens a Gemini session.
   */
  private chat: ChatSession | null = null;

  /**
   * Sends a user prompt and resolves tool calls until Gemini returns text.
   *
   * Function calling is a loop, not a single request:
   * user text → (optional tool calls → we execute → function responses)* →
   * assistant text. All tool results from one model turn are sent together
   * so Gemini sees a complete picture.
   *
   * @param userPrompt - Natural-language question or instruction from the UI.
   * @returns Assistant reply to render in the chat transcript.
   */
  async askAgent(userPrompt: string): Promise<string> {
    const chat = this.getChat();
    let result = await chat.sendMessage(userPrompt);
    result = await this.resolveToolCalls(chat, result);
    return result.response.text();
  }

  /**
   * Returns the existing chat, or starts one with the shopping tools attached.
   *
   * @returns Live {@link ChatSession} for this browser session.
   */
  private getChat(): ChatSession {
    if (this.chat) {
      return this.chat;
    }

    const model = getGenerativeModel(this.ai, {
      model: SHOPPING_AGENT_MODEL,
      systemInstruction: SHOPPING_AGENT_SYSTEM_INSTRUCTION,
      tools: [shoppingTools],
    });

    this.chat = model.startChat();
    return this.chat;
  }

  /**
   * Executes Gemini function calls until the model stops requesting tools.
   *
   * @param chat - Session that must receive `functionResponse` parts next.
   * @param result - Latest model response, which may include `functionCalls()`.
   * @returns The first response that contains no further tool calls.
   */
  private async resolveToolCalls(
    chat: ChatSession,
    result: GenerateContentResult,
  ): Promise<GenerateContentResult> {
    for (let round = 0; round < MAX_TOOL_ROUNDS; round += 1) {
      const functionCalls = result.response.functionCalls();
      if (!functionCalls?.length) {
        return result;
      }

      const functionResponses = functionCalls.map((call) => ({
        functionResponse: {
          name: call.name,
          // Gemini 3.x maps results back to the model turn via this id.
          ...(call.id !== undefined ? { id: call.id } : {}),
          response: executeShoppingTool(call, this.productService),
        },
      }));

      result = await chat.sendMessage(functionResponses);
    }

    return result;
  }
}
