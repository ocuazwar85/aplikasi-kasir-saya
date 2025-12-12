import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getAuth, type Auth } from "firebase/auth";

// This will be used if no config is found in local storage
const firebaseConfig = {
  apiKey: "AIzaSyBrDf2stmllgAyUUJZbHjQYpYgOTr-3Kio",
  authDomain: "dodol01.firebaseapp.com",
  projectId: "dodol01",
  storageBucket: "dodol01.appspot.com",
  messagingSenderId: "744219688240",
  appId: "1:744219688240:web:512d4290eddac008f51cf5",
  measurementId: "G-CHVT6TJ820"
};

let app: FirebaseApp;
let firestore: Firestore;
let auth: Auth;

function initializeFirebase(): { app: FirebaseApp, firestore: Firestore, auth: Auth } {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }

  firestore = getFirestore(app);
  auth = getAuth(app);

  return { app, firestore, auth };
}

// Initial call to set up Firebase
initializeFirebase();

export { app, firestore, auth, initializeFirebase };
