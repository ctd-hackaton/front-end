import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);
const functions = getFunctions(app);

const functionsRegion =
  import.meta.env.VITE_FIREBASE_FUNCTIONS_REGION || "us-central1";
const emulatorOrigin = import.meta.env.VITE_FUNCTIONS_EMULATOR_ORIGIN;

const resolveFunctionsOrigin = () => {
  if (emulatorOrigin) {
    return emulatorOrigin.replace(/\/+$/, "");
  }

  if (!firebaseConfig.projectId) {
    return null;
  }

  return `https://${functionsRegion}-${firebaseConfig.projectId}.cloudfunctions.net`;
};

const functionsOrigin = resolveFunctionsOrigin();
const streamOpenAIUrl = functionsOrigin
  ? `${functionsOrigin}/streamOpenAI`
  : null;

export { auth, db, functions, streamOpenAIUrl };
