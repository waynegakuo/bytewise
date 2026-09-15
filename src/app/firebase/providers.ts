import {
  makeEnvironmentProviders,
  PLATFORM_ID,
  type EnvironmentProviders,
} from '@angular/core';
import { getAI, GoogleAIBackend, type AI } from 'firebase/ai';
import { initializeApp } from 'firebase/app';
import type { AppCheck } from 'firebase/app-check';
import { environment } from '../../environments/environment';
import { initializeBytewiseAppCheck } from './app-check';
import { FIREBASE_AI, FIREBASE_APP, FIREBASE_APP_CHECK } from './tokens';

/**
 * Single Firebase app instance shared by App Check and Firebase AI Logic.
 *
 * Created at import time so App Check and `getAI()` all point at the same app.
 * Calling `initializeApp()` twice with the same options would create disconnected
 * instances and App Check tokens would not be attached to Gemini requests.
 */
const firebaseApp = initializeApp(environment.firebaseConfig);

/**
 * Registers Firebase App, App Check (reCAPTCHA Enterprise), and Firebase AI
 * Logic in Angular's injector.
 *
 * Uses the `firebase` JS SDK directly (no `@angular/fire`) so the app stays
 * compatible with newer Angular versions without AngularFire peer conflicts.
 *
 * Call this once from `appConfig.providers`. Downstream services should
 * inject {@link FIREBASE_AI} / {@link FIREBASE_APP} instead of repeating
 * `initializeApp` / `getAI`.
 *
 * **Console steps this code cannot do for you** (required for Gemini after
 * App Check enforcement, which Firebase is rolling out as mandatory):
 * 1. Firebase Console → Security → App Check → register this web app with
 *    reCAPTCHA Enterprise using {@link environment.recaptchaEnterpriseSiteKey}.
 * 2. APIs tab → Firebase AI Logic → enforce baseline protection.
 * 3. After this client is deployed, consider enforcing replay protection.
 * 4. For `ng serve`, register the debug token printed in the browser console.
 *
 * @returns Environment providers for the root injector.
 *
 * @see https://firebase.google.com/docs/ai-logic/app-check
 */
export function provideBytewiseFirebase(): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: FIREBASE_APP, useValue: firebaseApp },
    {
      provide: FIREBASE_APP_CHECK,
      useFactory: (platformId: object) =>
        initializeBytewiseAppCheck(firebaseApp, platformId),
      deps: [PLATFORM_ID],
    },
    {
      provide: FIREBASE_AI,
      useFactory: (_appCheck: AppCheck): AI =>
        getAI(firebaseApp, {
          backend: new GoogleAIBackend(),
          // Limited-use tokens are for production replay protection; skip in dev to
          // reduce failure modes while debugging App Check + API key issues.
          useLimitedUseAppCheckTokens: environment.production,
        }),
      deps: [FIREBASE_APP_CHECK],
    },
  ]);
}

export { FIREBASE_AI, FIREBASE_APP, FIREBASE_APP_CHECK };
