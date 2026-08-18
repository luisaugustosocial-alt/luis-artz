import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

export const firebaseEnabled = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId &&
  firebaseConfig.appId
);

let authInstance = null;
let dbInstance = null;

if (firebaseEnabled) {
  try {
    const app = initializeApp(firebaseConfig);

    authInstance = getAuth(app);
    dbInstance = getFirestore(app);
  } catch (error) {
    console.warn(
      'Firebase ainda não configurado corretamente. O site público continuará funcionando.',
      error
    );
  }
}

export const auth = authInstance;
export const db = dbInstance;
