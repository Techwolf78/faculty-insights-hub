import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Production configuration using environment variables
const productionConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Development fallback configuration (for local development only)
const devFirebaseConfig = {
  apiKey: "AIzaSyBmf_qgSR_f7aY69IzSXHxuWLEo69KzClE",
  authDomain: "feedback-builder-fe792.firebaseapp.com",
  projectId: "feedback-builder-fe792",
  storageBucket: "feedback-builder-fe792.firebasestorage.app",
  messagingSenderId: "898918068260",
  appId: "1:898918068260:web:3bb691f233e937c62ae8b1",
  measurementId: "G-79BFWGPJE5"
};

// Production Firebase config
const prodFirebaseConfig = {
  apiKey: "AIzaSyDph_LOtSSDyUm2-hyyRVkXdGjk5l_n37U",
  authDomain: "faculty-feedback-c51ae.firebaseapp.com",
  projectId: "faculty-feedback-c51ae",
  storageBucket: "faculty-feedback-c51ae.firebasestorage.app",
  messagingSenderId: "54575983908",
  appId: "1:54575983908:web:ce9a45ea88294b23ca57b1",
  measurementId: "G-GDJYKJ41ZY"
};

// Use dev config for localhost, prod config for production domain
let configToUse: typeof productionConfig;
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
  configToUse = devFirebaseConfig;
} else if (typeof window !== 'undefined' && window.location.hostname === 'faculty.gryphonacademy.co.in') {
  configToUse = prodFirebaseConfig;
} else {
  configToUse = devFirebaseConfig; // Default to dev for safety during testing
}

export const firebaseConfig = configToUse;

const app = initializeApp(configToUse);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Secondary app for user creation to avoid logging out admin
const secondaryApp = initializeApp(configToUse, "secondaryApp");
export const secondaryAuth = getAuth(secondaryApp);