import {Inject, inject, Injectable} from '@angular/core';
import {ProductService} from './product.service';
import {
  ChatSession,
  FunctionDeclarationsTool,
  GenerativeModel, getGenerativeModel,
  getVertexAI,
  ObjectSchemaInterface,
  Schema
} from '@angular/fire/vertexai';
import {FirebaseApp} from '@angular/fire/app';
import {Product} from '../models/product.model';
import { getAI, GoogleAIBackend, VertexAIBackend } from "firebase/ai";


@Injectable({
  providedIn: 'root'
})
export class AiService {
  private readonly productService = inject(ProductService);
  private readonly model: GenerativeModel;
  private readonly chat: ChatSession;

  constructor(@Inject("FIREBASE_APP") private firebaseApp: FirebaseApp) {
    const productsToolSet: FunctionDeclarationsTool = {
      functionDeclarations: [
        {
          name: "getTotalNumberOfProducts",
          description: "Get the total number of products available in the store.",
        },
        {
          name: "getProducts",
          description: "Get an array of the products with the name and price of each product.",
        },
        {
          name: "clearCart",
          description: "Clear one or more products from the cart."
        },
        {
          name: "addToCart",
          description: "Add one or more products to the cart.",
          parameters: Schema.object({
            properties: {
              productsToAdd: Schema.array({
                items: Schema.object({
                  description: "A single product with its name and price.",
                  properties: {
                    name: Schema.string({
                      description: "The name of the product.",
                    }),
                    price: Schema.number({
                      description: "The numerical price of the product.",
                    }),
                  },
                  // Specify which properties within each product object are required
                  required: ["name", "price"],
                }),
              }),
            },
          }) as ObjectSchemaInterface,
        },
      ]
    };

    // Initialize Gemini Developer API/Vertex AI Gemini API Service
    // const geminiAI = getAI(this.firebaseApp, {backend: new GoogleAIBackend()});
    const vertexAI = getAI(this.firebaseApp, {backend: new VertexAIBackend() }); // the new Firebase AI Logic client SDK
    const systemInstruction =
      "Welcome to ByteWise. You are a superstar agent for this ecommerce store. you will assist users by answering questions about the inventory and event being able to add items to the cart. The currency is KES and should precede the numerical price. All price values should be formatted with commas to delineate thousands. For example, instead of '1000', use '1,000'.";

    // Initialize the generative model with a model that supports use case
    // change the AI API to vertexAI in case you want a higher level of performance & reliability
    this.model = getGenerativeModel(vertexAI, {
      model: "gemini-2.0-flash",
      systemInstruction: systemInstruction,
      tools: [productsToolSet],
    })

    this.chat = this.model.startChat();
  }

  async askAgent(userPrompt: string) {
    let result = await this.chat.sendMessage(userPrompt);
    const functionCalls = result.response.functionCalls();

    if(functionCalls && functionCalls.length > 0) {
      for (const functionCall of functionCalls) {
        switch (functionCall.name) {
          case "getTotalNumberOfProducts": {
            const functionResult = this.getTotalNumberOfProducts();
            result = await this.chat.sendMessage([
              {
                functionResponse: {
                  name: functionCall.name,
                  response: { numberOfItems: functionResult },
                }
              }
            ]);
            break;
          }
          case "getProducts": {
            const functionResult = this.getProducts();
            result = await this.chat.sendMessage([
              {
                functionResponse: {
                  name: functionCall.name,
                  response: { products: functionResult },
                }
              }
            ]);
            break;
          }
          case "clearCart": {
            const cartCount = this.getCartCount();
            const functionResult = this.clearCart();
            result = await this.chat.sendMessage([
              {
                functionResponse: {
                  name: functionCall.name,
                  response: {numberOfProductsRemoved: cartCount},
                }
              }
            ]);
            break;
          }
          case "addToCart": {
            console.log(functionCall.args);

            const args = functionCall.args as { productsToAdd: Product[]}

            const functionResult = this.addToCart(args.productsToAdd);

            result = await this.chat.sendMessage([
              {
                functionResponse: {
                  name: functionCall.name,
                  response: { numberOfProductsAdded: functionResult },
                },
              }
            ]);
            break;
          }
        }
      }
    }
    return result.response.text();
  }

  getProducts() {
    return this.productService.getProducts();
  }

  getTotalNumberOfProducts(): number {
    return this.productService.getProducts().length;
  }

  clearCart() {
    return this.productService.clearCart();
  }

  getCartCount(): number {
    return this.productService.cartItemCount();
  }

  addToCart(products: Product[]) {
    products.forEach(product => this.productService.addToCart(product));
  }
}
