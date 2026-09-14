import { isPlatformBrowser } from '@angular/common';
import { isDevMode } from '@angular/core';
import type { FirebaseApp } from 'firebase/app';
import { getToken, getLimitedUseToken, type AppCheck } from 'firebase/app-check';
import { getAI, getGenerativeModel, GoogleAIBackend } from 'firebase/ai';
import { environment } from '../../environments/environment';

/** Smallest model used only for the localhost connectivity probe. */
const PROBE_MODEL = 'gemini-3.1-flash-lite';

/**
 * Logs a localhost troubleshooting report after App Check initializes.
 *
 * Run automatically in dev builds so you can tell whether a 403 is coming from
 * App Check (debug token) or from the Firebase API key / project setup.
 *
 * @param appCheck - Initialized App Check instance from Angular DI.
 * @param platformId - Angular `PLATFORM_ID`.
 */
export async function logFirebaseLocalDiagnostics(
  firebaseApp: FirebaseApp,
  appCheck: AppCheck,
  platformId: object,
): Promise<void> {
  if (!isPlatformBrowser(platformId) || environment.production || !isDevMode()) {
    return;
  }

  const apiKey = environment.firebaseConfig.apiKey ?? '(missing)';
  const maskedKey =
    apiKey.length > 8
      ? `${apiKey.slice(0, 6)}…${apiKey.slice(-4)}`
      : apiKey;

  console.group('[ByteWise] Localhost Firebase diagnostics');

  console.info('Project ID:', environment.firebaseConfig.projectId);
  console.info('Web app ID:', environment.firebaseConfig.appId);
  console.info('API key (masked):', maskedKey);
  console.info(
    'Register the debug token under THIS web app in Firebase Console → App Check (not a different app in the project).',
  );
  console.info(
    'Limited-use App Check tokens:',
    environment.production ? 'enabled (production)' : 'disabled (development)',
  );

  try {
    const { token } = await getToken(appCheck, false);
    console.info('App Check standard token: OK', `(${token.length} chars)`);
  } catch (error) {
    console.error(
      'App Check standard token: FAILED — register the debug token in Firebase Console → App Check → Manage debug tokens.',
      error,
    );
  }

  if (environment.production) {
    try {
      await getLimitedUseToken(appCheck);
      console.info('App Check limited-use token: OK');
    } catch (error) {
      console.error('App Check limited-use token: FAILED', error);
    }
  }

  await probeGeminiGenerateContent(firebaseApp);

  console.groupEnd();
}

/**
 * Sends one minimal Gemini request on localhost to separate App Check failures
 * from API-key / AI Logic setup failures.
 */
async function probeGeminiGenerateContent(firebaseApp: FirebaseApp): Promise<void> {
  const ai = getAI(firebaseApp, {
    backend: new GoogleAIBackend(),
    useLimitedUseAppCheckTokens: false,
  });

  // AIService stores the App Check instance used for X-Firebase-AppCheck headers.
  const aiService = ai as { appCheck?: AppCheck | null };
  if (!aiService.appCheck) {
    console.error(
      'getAI() has no App Check attached — Gemini requests are missing X-Firebase-AppCheck. This is a wiring bug; App Check must initialize on the same FirebaseApp before getAI().',
    );
    return;
  }

  console.info('getAI() App Check wiring: OK');

  try {
    const model = getGenerativeModel(ai, { model: PROBE_MODEL });
    await model.generateContent('ping');
    console.info('Gemini generateContent probe: OK');
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    const customData = (error as { customData?: { errorDetails?: unknown } })
      .customData;
    console.error('Gemini generateContent probe: FAILED', error);
    if (customData?.errorDetails) {
      console.error('Server error details:', customData.errorDetails);
    }

    if (/caller does not have permission/i.test(detail)) {
      console.error(
        [
          'App Check is OK but Gemini auth failed. Work through these in order:',
          '',
          'A) Firebase Console → AI Services → AI Logic → Get started → Gemini Developer API',
          '   (Required even if you ran gcloud manually. Enables generativelanguage.googleapis.com',
          '   and provisions the Firebase AI Logic service agent for this project.)',
          '',
          'B) Firebase Console → Project settings → Your apps → Web app → SDK setup',
          '   Re-copy firebaseConfig. The apiKey MUST match the key in the failed Network request.',
          '   If it differs, replace src/environments/firebase.config.ts and hard-refresh.',
          '',
          'C) Google Cloud → Credentials → open the key from step B (not a different key)',
          '   API restrictions: Firebase AI Logic + Firebase App Check only.',
          '   Application restrictions: None (for localhost).',
          '',
          'D) DevTools → Network → failed generateContent request → Headers tab:',
          '   • x-goog-api-key matches your Web app API key (not in the URL — that is normal)',
          '   • X-Firebase-AppCheck is present',
          '',
          'E) App Check header present ≠ token accepted. In Console → App Check → your WEB app',
          '   → Manage debug tokens: the UUID from "AppCheck debug token: ..." must be listed.',
          '   Re-add it, hard-refresh, retry.',
          '',
          'F) On that Browser key: Application restrictions must be None for localhost.',
          '',
          'G) If still failing: set the key to "Don\'t restrict key", wait 5 min, refresh.',
          '   Works → re-apply API restrictions. Still fails → check IAM service agent or AI Studio project status.',
          '',
          'H) For a clean slate, see FIREBASE_SETUP.md (new Firebase project + ordered setup).',
        ].join('\n'),
      );
      return;
    }

    if (/genai config not found/i.test(detail)) {
      console.error(
        'Firebase AI Logic is not set up for this project. Run Firebase Console → AI Logic → Get started.',
      );
      return;
    }

    if (/must enforce firebase app check|deactivated in this project/i.test(detail)) {
      console.error(
        'Register the App Check debug token under Firebase Console → App Check → Manage debug tokens, then hard-refresh.',
      );
    }
  }
}
