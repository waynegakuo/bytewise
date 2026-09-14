import type { FirebaseOptions } from 'firebase/app';

/**
 * Shape of `environment.ts` / `environment.development.ts`.
 *
 * Keeping one interface means App Check code can read `appCheckDebugToken`
 * without duplicating optional-property checks in every file.
 */
export interface BytewiseEnvironment {
  production: boolean;
  firebaseConfig: FirebaseOptions;
  /**
   * Score-based reCAPTCHA Enterprise site key for App Check on web.
   * Must match the key registered on the Firebase web app.
   */
  recaptchaEnterpriseSiteKey: string;
  /**
   * Local/CI only. `true` mints a debug token (register it in the Firebase
   * Console). A UUID string reuses an already-registered token.
   * Omit or leave unset in production.
   */
  appCheckDebugToken?: boolean | string;
}
