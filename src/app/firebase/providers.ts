import { inject, makeEnvironmentProviders, PLATFORM_ID, type EnvironmentProviders, type Injector } from '@angular/core';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { AppCheck, provideAppCheck } from '@angular/fire/app-check';
import { getAI, GoogleAIBackend, type AI } from 'firebase/ai';
import { environment } from '../../environments/environment';
import { initializeBytewiseAppCheck } from './app-check';
import { FIREBASE_AI, FIREBASE_APP } from './tokens';

/**
 * Single Firebase app instance shared by App Check and Firebase AI Logic.
 *
 * Created at import time so `provideFirebaseApp`, `provideAppCheck`, and
 * `getAI()` all point at the same app. Calling `initializeApp()` twice with
 * the same options would create disconnected instances and App Check tokens
 * would not be attached to Gemini requests.
 */
const firebaseApp = initializeApp(environment.firebaseConfig);

/**
 * Builds the Gemini client that every shopping-agent call goes through.
 *
 * `useLimitedUseAppCheckTokens: true` asks App Check for a **one-time**
 * token per request. That is required (on the client) before you can enforce
 * replay protection in Firebase Console → Security → App Check → Firebase AI
 * Logic. Limited-use tokens are backwards compatible: they still work when
 * replay protection is only in monitoring mode.
 *
 * {@link AppCheck} is injected first so `initializeAppCheck()` has already
 * registered the reCAPTCHA (or debug) provider on `firebaseApp`. Without
 * that order, `getAI()` would send Gemini traffic with no attestation.
 *
 * Switch to Gemini on Vertex AI / Agent Platform by replacing
 * `GoogleAIBackend` with `new AgentPlatformBackend('us-central1')` (or
 * `'global'` for preview models). Keep `useLimitedUseAppCheckTokens: true`
 * either way.
 *
 * @see https://firebase.google.com/docs/ai-logic/app-check
 */
function createFirebaseAI(): AI {
  inject(AppCheck);

  return getAI(firebaseApp, {
    backend: new GoogleAIBackend(),
    // Limited-use tokens are for production replay protection; skip in dev to
    // reduce failure modes while debugging App Check + API key issues.
    useLimitedUseAppCheckTokens: environment.production,
  });
}

/**
 * Registers Firebase App, App Check (reCAPTCHA Enterprise), and Firebase AI
 * Logic in Angular's injector.
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
 */
export function provideBytewiseFirebase(): EnvironmentProviders {
  return makeEnvironmentProviders([
    provideFirebaseApp(() => firebaseApp),
    provideAppCheck((injector: Injector) =>
      initializeBytewiseAppCheck(firebaseApp, injector.get(PLATFORM_ID)),
    ),
    { provide: FIREBASE_APP, useValue: firebaseApp },
    { provide: FIREBASE_AI, useFactory: createFirebaseAI },
  ]);
}

export { FIREBASE_AI, FIREBASE_APP };
