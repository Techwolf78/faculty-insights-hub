import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBmf_qgSR_f7aY69IzSXHxuWLEo69KzClE",
  authDomain: "feedback-builder-fe792.firebaseapp.com",
  projectId: "feedback-builder-fe792",
  storageBucket: "feedback-builder-fe792.firebasestorage.app",
  messagingSenderId: "898918068260",
  appId: "1:898918068260:web:3bb691f233e937c62ae8b1",
  measurementId: "G-79BFWGPJE5"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);