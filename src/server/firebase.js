import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC3oOw0BLoqYlsZ3XzPDgxwI27aL7_XmlI",
  authDomain: "danki-221a9.firebaseapp.com",
  projectId: "danki-221a9",
  storageBucket: "danki-221a9.firebasestorage.app",
  messagingSenderId: "602313595658",
  appId: "1:602313595658:web:b9dd4a5edd2b9c3cf1b8f3",
  measurementId: "G-BY1VTLRBVD"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
