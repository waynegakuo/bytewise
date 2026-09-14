import {
  firebaseConfig,
  recaptchaEnterpriseSiteKey,
} from './firebase.config';
import type { BytewiseEnvironment } from './environment.model';

/**
 * Production environment. Loaded by default and for `ng build`.
 *
 * Production traffic must attest with reCAPTCHA Enterprise. Do not set
 * `appCheckDebugToken` here — a debug token in a production bundle would let
 * anyone skip device attestation.
 */
export const environment: BytewiseEnvironment = {
  production: true,
  firebaseConfig,
  recaptchaEnterpriseSiteKey,
};
