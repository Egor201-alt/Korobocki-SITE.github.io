// firebase-config.js
const firebaseConfig = {
  apiKey: "AIzaSyC6borccuUxSvpB7Sm3rcIhGPcfDxS3ZK8",
  authDomain: "korobocki-ef81f.firebaseapp.com",
  projectId: "korobocki-ef81f",
  storageBucket: "korobocki-ef81f.appspot.com",
  messagingSenderId: "753941456313",
  appId: "1:753941456313:web:27dfb703faf041b65f8268",
  measurementId: "G-PESGLMN9X8"
};

// Инициализируем Firebase и создаем глобальные переменные auth и db
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();