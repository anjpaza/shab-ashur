import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAs3iwCKY6z_nN-QCV-EEXkUqDNLFWVE5Y",
  authDomain: "apa-shabashur.firebaseapp.com",
  projectId: "apa-shabashur",
  storageBucket: "apa-shabashur.firebasestorage.app",
  messagingSenderId: "586166076976",
  appId: "1:586166076976:web:20ad3ce5c05dda6a62cff5",
  measurementId: "G-3RGT5JC8FB"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export { collection, doc, setDoc, updateDoc, onSnapshot, serverTimestamp, query, orderBy };
