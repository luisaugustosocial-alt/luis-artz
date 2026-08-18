import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyADko6HMRpMZd1myMAClpgxIsQcarnnodg",
  authDomain: "luis-artz.firebaseapp.com",
  projectId: "luis-artz",
  storageBucket: "luis-artz.firebasestorage.app",
  messagingSenderId: "540915700262",
  appId: "1:540915700262:web:ba63212e24ae75c2038ce7"
};

let auth = null;
let db = null;
let firebaseReady = false;

try {
  const app = initializeApp(firebaseConfig);

  auth = getAuth(app);
  db = getFirestore(app);
  firebaseReady = true;
} catch (error) {
  console.error('Firebase indisponível:', error);
}

export {
  auth,
  db,
  firebaseReady
};
