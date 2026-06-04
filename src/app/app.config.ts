import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { environment } from '../environments/environment';
import { initializeAppCheck, provideAppCheck } from '@angular/fire/app-check';
import { ReCaptchaEnterpriseProvider } from 'firebase/app-check';

const firebaseApp = initializeApp(environment.firebaseConfig);

export const appConfig: ApplicationConfig = {
  providers: [provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideClientHydration(withEventReplay()),
    provideHttpClient(withFetch()),
    provideFirebaseApp(() => firebaseApp),
    provideAppCheck(() => initializeAppCheck(firebaseApp, {
      provider: new ReCaptchaEnterpriseProvider('6LdlYAwtAAAAAPnACSivCdffjuNEYYCuo4cWqKv-'),
      isTokenAutoRefreshEnabled: true
    })),
    {
      provide: 'FIREBASE_APP',
      useValue: firebaseApp
    },
  ]
};
