import { isPlatformBrowser } from '@angular/common';
import type { FirebaseApp } from 'firebase/app';
import {
  CustomProvider,
  getToken,
  initializeAppCheck,
  ReCaptchaEnterpriseProvider,
  type AppCheck,
} from 'firebase/app-check';
import { environment } from '../../environments/environment';
import { logFirebaseLocalDiagnostics } from './diagnostics';

/**
 * Global slot the Firebase App Check SDK reads **before** `initializeAppCheck()`.
 *
 * Set this before `initializeAppCheck()` on localhost so the SDK uses the debug
 * provider instead of reCAPTCHA Enterprise (which does not run on localhost).
 *
 * @see https://firebase.google.com/docs/ai-logic/app-check#web
 */
interface AppCheckDebugGlobal {
  FIREBASE_APPCHECK_DEBUG_TOKEN?: boolean | string;
}

/**
 * Enables the App Check debug provider for local / CI use.
 *
 * Must run before `initializeAppCheck()`. Production builds skip this so
 * end users attest with reCAPTCHA Enterprise instead.
 *
 * @param isBrowser - `false` during SSR; debug tokens are a browser concern.
 */
export function enableAppCheckDebugToken(isBrowser: boolean): void {
  if (!isBrowser || environment.production) {
    return;
  }

  const debugToken = environment.appCheckDebugToken ?? true;

  if (debugToken === false) {
    return;
  }

  (globalThis as typeof globalThis & AppCheckDebugGlobal)
    .FIREBASE_APPCHECK_DEBUG_TOKEN = debugToken;
}

/**
 * Initializes Firebase App Check for this web app.
 *
 * **Browser / production:** score-based reCAPTCHA Enterprise. The widget is
 * invisible; users never solve a challenge. Tokens auto-refresh so Gemini
 * calls keep a valid attestation attached.
 *
 * **Browser / `ng serve`:** {@link enableAppCheckDebugToken} switches App Check
 * to the debug provider (reCAPTCHA is not valid on `localhost`). Register the
 * printed token in the Firebase Console.
 *
 * **SSR:** reCAPTCHA cannot run on Node, and the shopping agent never calls
 * Gemini during server render. A `CustomProvider` satisfies the SDK without
 * touching the DOM.
 *
 * @param firebaseApp - The same {@link FirebaseApp} later passed to `getAI()`.
 * @param platformId - Angular `PLATFORM_ID`; used to skip reCAPTCHA on the server.
 * @returns The App Check instance registered on `firebaseApp`.
 *
 * @see https://firebase.google.com/docs/app-check/web/recaptcha-enterprise-provider
 */
export function initializeBytewiseAppCheck(
  firebaseApp: FirebaseApp,
  platformId: object,
): AppCheck {
  const isBrowser = isPlatformBrowser(platformId);
  enableAppCheckDebugToken(isBrowser);

  if (!isBrowser) {
    return initializeAppCheck(firebaseApp, {
      provider: new CustomProvider({
        getToken: async () => ({
          token: 'ssr-placeholder',
          expireTimeMillis: Date.now() + 60 * 60 * 1000,
        }),
      }),
      isTokenAutoRefreshEnabled: false,
    });
  }

  const usingDebugProvider =
    environment.appCheckDebugToken !== false &&
    (globalThis as typeof globalThis & AppCheckDebugGlobal)
      .FIREBASE_APPCHECK_DEBUG_TOKEN !== undefined;

  const appCheck = initializeAppCheck(firebaseApp, {
    provider: new ReCaptchaEnterpriseProvider(
      environment.recaptchaEnterpriseSiteKey,
    ),
    isTokenAutoRefreshEnabled: true,
  });

  if (usingDebugProvider) {
    logLocalAppCheckInstructions();
    void verifyAppCheckToken(appCheck).then(() =>
      logFirebaseLocalDiagnostics(firebaseApp, appCheck, platformId),
    );
  }

  return appCheck;
}

/**
 * Confirms App Check can mint a token on localhost (separate from Gemini/API-key errors).
 *
 * @param appCheck - Instance returned by {@link initializeAppCheck}.
 */
async function verifyAppCheckToken(appCheck: AppCheck): Promise<void> {
  try {
    const { token } = await getToken(appCheck, false);
    console.info(
      `[ByteWise] App Check token OK (${token.length} chars). If Gemini still 403s, check API key restrictions in Google Cloud.`,
    );
  } catch (error) {
    console.error('[ByteWise] App Check token fetch failed:', error);
  }
}

/**
 * Prints a short localhost checklist so the debug token is easy to find.
 *
 * Firebase logs the token separately (search the console for
 * "AppCheck debug token"). This message is just a pointer — the UUID itself
 * is never hard-coded here.
 */
function logLocalAppCheckInstructions(): void {
  console.info(
    [
      '[ByteWise] App Check debug mode is active (localhost).',
      '1. In DevTools → Console, find: AppCheck debug token: "..."',
      '2. Firebase Console → Security → App Check → your web app → Manage debug tokens → Add token.',
      '3. Hard-refresh this page (Ctrl+Shift+R), then try the chat again.',
      'The first chat attempt before step 3 will fail — that is expected.',
    ].join('\n'),
  );
}
