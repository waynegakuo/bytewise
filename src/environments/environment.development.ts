import {
  firebaseConfig,
  recaptchaEnterpriseSiteKey,
} from './firebase.config';
import type { BytewiseEnvironment } from './environment.model';

/**
 * Local development environment. Swapped in by `angular.json` fileReplacements
 * when you run `ng serve` / `ng build --configuration development`.
 *
 * App Check treats `localhost` as an invalid device, so reCAPTCHA Enterprise
 * cannot be used here. Instead, `appCheckDebugToken: true` prints a debug
 * token in the browser console on first load. Register that token in
 * Firebase Console → Security → App Check → your web app → Manage debug tokens.
 *
 * After it is registered, you can replace `true` with the token string so the
 * same browser keeps working without minting a new token. Never commit a
 * debug token string to a public repository.
 *
 * @see https://firebase.google.com/docs/app-check/web/debug-provider
 */
export const environment: BytewiseEnvironment = {
  production: false,
  firebaseConfig,
  recaptchaEnterpriseSiteKey,
  appCheckDebugToken: true,
};
