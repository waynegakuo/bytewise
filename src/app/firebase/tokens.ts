import { InjectionToken } from '@angular/core';
import type { AI } from 'firebase/ai';
import type { FirebaseApp } from 'firebase/app';
import type { AppCheck } from 'firebase/app-check';

/**
 * The initialized Firebase app instance.
 *
 * Prefer this token over a string provider (`'FIREBASE_APP'`) so injectors are
 * typed and refactor-safe. Created once in {@link provideBytewiseFirebase} and
 * shared by App Check and Firebase AI Logic.
 */
export const FIREBASE_APP = new InjectionToken<FirebaseApp>('FIREBASE_APP');

/**
 * Firebase App Check instance for the shared app.
 *
 * Initialized before {@link FIREBASE_AI} so attestation is ready for Gemini calls.
 */
export const FIREBASE_APP_CHECK = new InjectionToken<AppCheck>('FIREBASE_APP_CHECK');

/**
 * Firebase AI Logic client, already pointed at the Gemini Developer API and
 * configured to send limited-use App Check tokens on every model request.
 *
 * {@link AiService} injects this token instead of calling `getAI()` itself so
 * App Check is always initialized first (see {@link FIREBASE_APP_CHECK}).
 */
export const FIREBASE_AI = new InjectionToken<AI>('FIREBASE_AI');
