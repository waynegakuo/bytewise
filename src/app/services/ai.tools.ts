import {
  Schema,
  type FunctionCall,
  type FunctionDeclarationsTool,
  type ObjectSchema,
} from 'firebase/ai';
import type { Product } from '../models/product.model';
import type { ProductService } from './product.service';

/**
 * Gemini model served through Firebase AI Logic.
 *
 * Newer Gemini models reject unauthenticated / unattested traffic. App Check
 * must be initialized (and enforced in the console) before this model will
 * answer. Swap the ID here — not in the service — if you change models.
 *
 * Gemini 3.x function calling requires Firebase JS SDK **12.19.0+** (tool
 * results use role `user`, not legacy `function`).
 *
 * @see https://firebase.google.com/docs/ai-logic/models
 */
export const SHOPPING_AGENT_MODEL = 'gemini-3.8-flash';

/**
 * System instruction baked into every chat session.
 *
 * This is still client-side (the model sees it, and a determined user can
 * read the bundle). For production hardening, Firebase recommends moving
 * prompts to [server prompt templates](https://firebase.google.com/docs/ai-logic/security-checklist)
 * and then enforcing template-only mode. Kept here so the codelab stays
 * runnable without extra Console setup.
 */
export const SHOPPING_AGENT_SYSTEM_INSTRUCTION =
  "Welcome to ByteWise. You are a superstar agent for this ecommerce store. You will assist users by answering questions about the inventory and even being able to add items to the cart. The currency is KES and should precede the numerical price. All price values should be formatted with commas to delineate thousands. For example, instead of '1000', use '1,000'.";

/**
 * Tool declarations advertised to Gemini.
 *
 * The model never runs these functions itself. It returns a `functionCall`;
 * {@link executeShoppingTool} runs the matching `ProductService` method and
 * the result is sent back so Gemini can write a natural-language reply.
 *
 * Keep descriptions action-oriented — they are the model's only API docs.
 */
export const shoppingTools: FunctionDeclarationsTool = {
  functionDeclarations: [
    {
      name: 'getTotalNumberOfProducts',
      description:
        'Get the total number of products available in the store inventory.',
    },
    {
      name: 'getProducts',
      description:
        'Get the catalog: an array of products with the name and price of each product.',
    },
    {
      name: 'clearCart',
      description: 'Remove every product currently in the shopping cart.',
    },
    {
      name: 'addToCart',
      description: 'Add one or more products from the catalog to the cart.',
      parameters: Schema.object({
        properties: {
          productsToAdd: Schema.array({
            items: Schema.object({
              description: 'A single product with its name and price.',
              properties: {
                name: Schema.string({
                  description: 'The name of the product.',
                }),
                price: Schema.number({
                  description: 'The numerical price of the product.',
                }),
              },
            }),
          }),
        },
      }) as ObjectSchema,
    },
  ],
};

/**
 * Arguments Gemini sends with `addToCart`. Names may not match catalog
 * titles exactly; {@link resolveCatalogProduct} maps them back to inventory.
 */
interface AddToCartArgs {
  productsToAdd?: Array<{ name?: string; price?: number }>;
}

/**
 * Finds the catalog product for a tool argument so the cart stores full
 * `Product` records (images, id, slug) instead of the model's partial payload.
 *
 * @param candidate - Name/price pair from Gemini.
 * @param catalog - Live inventory from {@link ProductService.getProducts}.
 */
function resolveCatalogProduct(
  candidate: { name?: string; price?: number },
  catalog: Product[],
): Product | undefined {
  const needle = candidate.name?.trim().toLowerCase();
  if (!needle) {
    return undefined;
  }

  return (
    catalog.find((product) => product.title.toLowerCase() === needle) ??
    catalog.find((product) => product.title.toLowerCase().includes(needle))
  );
}

/**
 * Executes one Gemini function call against the store.
 *
 * Add new store actions here **and** in {@link shoppingTools} so the model's
 * declared API stays in sync with the code that actually runs.
 *
 * @param call - Function name + JSON args from `response.functionCalls()`.
 * @param productService - Shared cart/inventory source of truth.
 * @returns JSON the model receives as a `functionResponse`.
 */
export function executeShoppingTool(
  call: FunctionCall,
  productService: ProductService,
): Record<string, unknown> {
  switch (call.name) {
    case 'getTotalNumberOfProducts':
      return { numberOfItems: productService.getProducts().length };

    case 'getProducts':
      return { products: productService.getProducts() };

    case 'clearCart': {
      const numberOfProductsRemoved = productService.cartItemCount();
      productService.clearCart();
      return { numberOfProductsRemoved };
    }

    case 'addToCart': {
      const args = call.args as AddToCartArgs;
      const catalog = productService.getProducts();
      const resolved = (args.productsToAdd ?? [])
        .map((item) => resolveCatalogProduct(item, catalog))
        .filter((product): product is Product => product !== undefined);

      resolved.forEach((product) => productService.addToCart(product));
      return { numberOfProductsAdded: resolved.length };
    }

    default:
      return { error: `Unknown tool: ${call.name}` };
  }
}
