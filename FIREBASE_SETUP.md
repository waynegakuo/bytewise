# ByteWise — Firebase setup guide

Use this checklist to connect a **clone of this repo** to **your own** Firebase project. Replace `<project-id>` everywhere with the project ID you choose at creation time — that ID also becomes your default Hosting URL:

- `https://<project-id>.web.app`
- `https://<project-id>.firebaseapp.com`

**Prerequisites:** Node.js, [Firebase CLI](https://firebase.google.com/docs/cli) (`npm install -g firebase-tools`), and a Google account.

**SDK note:** Gemini 3.x function calling requires **Firebase JS SDK 12.19.0+** (see `package.json`).

---

## 1. Create a Firebase project

1. [Create a project](https://console.firebase.google.com/)
2. Pick a **Project ID** (globally unique, 6–30 characters, lowercase letters/numbers/hyphens). Example: `my-store-app`
3. Finish the wizard (Google Analytics optional)

---

## 2. Register the web app

1. Firebase Console → your project → **Add app** → **Web** (`</>`)
2. App nickname: e.g. `ByteWise Web`
3. Copy the `firebaseConfig` object from SDK setup
4. Paste values into `src/environments/firebase.config.ts`:
   - All fields in `firebaseConfig`
   - Leave `recaptchaEnterpriseSiteKey` for step 4
5. Set your project in `.firebaserc`:

```json
{
  "projects": {
    "default": "<project-id>"
  }
}
```

---

## 3. Firebase AI Logic (do this early)

1. **Build** → **AI Logic**
2. **Get started** → **Gemini Developer API**
3. Complete the wizard (enables APIs, provisions the service agent, updates the Browser key allowlist)

Wait **5–10 minutes**, then verify in Google Cloud → **APIs & Services** → **Enabled APIs**:

- Firebase AI Logic API (`firebasevertexai.googleapis.com`)
- Gemini Developer API (`generativelanguage.googleapis.com`)

Console link pattern: `https://console.cloud.google.com/apis/dashboard?project=<project-id>`

---

## 4. reCAPTCHA Enterprise + App Check

### 4a. Create a reCAPTCHA Enterprise key

1. Google Cloud → **Security** → **reCAPTCHA Enterprise** (same GCP project as Firebase)
2. **Create key** → **Website** → **Score based (v3)** — not checkbox challenge
3. **Domains** — production only (do **not** add `localhost`):
   - `<project-id>.web.app`
   - `<project-id>.firebaseapp.com`
   - Any custom domain you use later
4. Copy the **site key** → `recaptchaEnterpriseSiteKey` in `firebase.config.ts`

### 4b. Register App Check

1. Firebase Console → **App Check** → your **web app** → **reCAPTCHA Enterprise** → paste the site key
2. **APIs** tab → **Firebase AI Logic** → **Enforced** (after localhost debug token works, or enforce now and use debug tokens locally)

---

## 5. Browser API key restrictions

1. Google Cloud → **APIs & Services** → **Credentials**
2. Open the **Browser key** that matches `apiKey` in your `firebase.config.ts`
3. **Application restrictions:** **None** while developing on localhost (add HTTP referrers before locking down production)
4. **API restrictions** → **Restrict key** → add **only**:
   - Firebase AI Logic API
   - Firebase App Check API
5. **Do not** add Generative Language API to this key

Save → wait ~5 minutes for propagation.

The API key is sent as the `x-goog-api-key` header (not a `key=` query param) — that is normal.

---

## 6. Local development

```powershell
firebase login
firebase use <project-id>
npm install
npm start
```

1. Open `http://localhost:4200`
2. DevTools → Console → find `AppCheck debug token: "..."`
3. Firebase Console → App Check → your web app → **Manage debug tokens** → add that UUID
4. Hard refresh (`Ctrl+Shift+R`)
5. Confirm `[ByteWise] Gemini generateContent probe: OK` (dev-only diagnostics; not shown in production builds)
6. Test the shopping agent chat

Debug tokens are for localhost only. Production uses reCAPTCHA Enterprise.

---

## 7. Deploy to Firebase Hosting

```powershell
npm run build
firebase deploy --only hosting --project <project-id>
```

Add your Hosting domains to the reCAPTCHA key if you have not already.

---

## 8. GitHub Actions (optional CI deploy)

1. Firebase Console → **Project settings** → **Service accounts** → **Generate new private key**
2. GitHub repo → **Settings** → **Secrets** → add the JSON (e.g. `FIREBASE_SERVICE_ACCOUNT_<YOUR_PROJECT>`)
3. Update `.github/workflows/firebase-hosting-*.yml`:
   - `projectId: <project-id>`
   - `firebaseServiceAccount: ${{ secrets.FIREBASE_SERVICE_ACCOUNT_<YOUR_PROJECT> }}`

---

## Troubleshooting

| Symptom | Fix |
|--------|-----|
| `ExchangeDebugToken` blocked | Add **Firebase App Check API** to the Browser key |
| `generateContent` 403, caller does not have permission | Run **AI Logic → Get started**; verify `x-goog-api-key` matches Project settings → Your apps |
| App Check token OK, Gemini still fails | Register debug token on the **correct web app**; Application restrictions = None for localhost |
| `Role 'function' is not supported` | Upgrade to Firebase SDK **12.19.0+** and restart the dev server |
| `must enforce Firebase App Check` | Enforce App Check for Firebase AI Logic + register debug token (localhost) |

**Service agent** (created by AI Logic setup):  
`service-<PROJECT_NUMBER>@gcp-sa-firebasevertexai.iam.gserviceaccount.com`  
(`PROJECT_NUMBER` is the `messagingSenderId` in your `firebaseConfig`.)

**Diagnostics:** `[ByteWise] Localhost Firebase diagnostics` runs only in development (`ng serve`), not in production builds.
