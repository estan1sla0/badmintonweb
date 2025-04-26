// Configuración Firebase personalizada (versión compat)
const firebaseConfig = {
  apiKey: "AIzaSyC6nR4ZofWhRSgBLT9E4Q5SfS7yG7stP5k",
  authDomain: "badmintonwebtraining.firebaseapp.com",
  projectId: "badmintonwebtraining",
  storageBucket: "badmintonwebtraining.firebasestorage.app",
  messagingSenderId: "787662262814",
  appId: "1:787662262814:web:12dd855ffbe39942e1940f",
  measurementId: "G-2YSZNYYEN8"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
