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

// Validate required environment variables
const requiredEnvVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID'
];

const missingVars = requiredEnvVars.filter(varName => !import.meta.env[varName]);

// Use production config if all required env vars are present, otherwise use dev config
const configToUse = missingVars.length === 0 ? productionConfig : devFirebaseConfig;

if (missingVars.length > 0) {
  console.warn(`Missing Firebase environment variables: ${missingVars.join(', ')}. Using development configuration.`);
}

export const firebaseConfig = configToUse;

const app = initializeApp(configToUse);
export const auth = getAuth(app);
export const db = getFirestore(app);