import type { FirebaseOptions } from 'firebase/app';



/**

 * Shared Firebase web-app credentials.

 *

 * Paste the firebaseConfig object from Firebase Console → Project settings →

 * Your apps → Web app → SDK setup. See FIREBASE_SETUP.md for the full checklist.

 *

 * **Browser key API restrictions (Google Cloud → Credentials):** allow at least

 * Firebase AI Logic API and Firebase App Check API. Do not add Generative

 * Language API. Application restrictions can stay "None" for local dev.

 *

 * @see https://firebase.google.com/docs/projects/api-keys

 */

export const firebaseConfig: FirebaseOptions = {

  // Values from Firebase Console → Project settings → Your apps → Web (see FIREBASE_SETUP.md).

  apiKey: 'AIzaSyBkxIHGoH4LSQ9hmZihfr2sfDE3Z6taQqY',

  authDomain: 'bytewiseshop.firebaseapp.com',

  projectId: 'bytewiseshop',

  storageBucket: 'bytewiseshop.firebasestorage.app',

  messagingSenderId: '26082582948',

  appId: '1:26082582948:web:dd1f50f26df28b03e26131',

  measurementId: 'G-FBQMR2Q97N',

};



/**

 * Score-based reCAPTCHA Enterprise site key used by Firebase App Check on web.

 *

 * Create in Google Cloud → Security → reCAPTCHA Enterprise (score-based, not

 * checkbox). Register the same key on the web app under Firebase Console →

 * App Check → reCAPTCHA Enterprise.

 *

 * Production domains only on this key — not localhost (use App Check debug tokens locally).

 *

 * @see https://firebase.google.com/docs/app-check/web/recaptcha-enterprise-provider

 */

export const recaptchaEnterpriseSiteKey = '6LfI5LotAAAAAFrllju2KLgSUmmiEg72XkuFGwav';


