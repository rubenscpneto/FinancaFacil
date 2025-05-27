// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA_LgkxpW2mk20D183a3qK4etv_2d7miwc",
  authDomain: "finances-eed07.firebaseapp.com",
  projectId: "finances-eed07",
  storageBucket: "finances-eed07.firebasestorage.app",
  messagingSenderId: "88015740485",
  appId: "1:88015740485:web:11c88f7ed31b5210a60d2c"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage }; 