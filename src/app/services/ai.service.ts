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

    // Initialize Vertex AI Service
    const vertexAI = getVertexAI(this.firebaseApp);
    const systemInstruction =
      "Welcome to ByteWise. You are a superstar agent for this ecommerce store. you will assist users by answering questions about the inventory and event being able to add items to the cart.";

    // Initialize the generative model with a model that supports use case
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

  getTotalNumberOfProducts() {
    return this.productService.getProducts().length;
  }

  addToCart(products: Product[]) {
    products.forEach(product => this.productService.addToCart(product));
  }
}
