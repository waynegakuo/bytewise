import { InjectionToken } from '@angular/core';
import type { FirebaseApp } from '@angular/fire/app';
import type { AI } from 'firebase/ai';

/**
 * The initialized Firebase app instance.
 *
 * Prefer this token over a string provider (`'FIREBASE_APP'`) so injectors are
 * typed and refactor-safe. Created once in {@link provideBytewiseFirebase} and
 * shared by App Check and Firebase AI Logic.
 */
export const FIREBASE_APP = new InjectionToken<FirebaseApp>('FIREBASE_APP');

/**
 * Firebase AI Logic client, already pointed at the Gemini Developer API and
 * configured to send limited-use App Check tokens on every model request.
 *
 * {@link AiService} injects this token instead of calling `getAI()` itself so
 * App Check is always initialized first (see `FIREBASE_AI`'s factory).
 */
export const FIREBASE_AI = new InjectionToken<AI>('FIREBASE_AI');
