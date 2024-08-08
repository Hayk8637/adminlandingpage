import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, push, set , remove } from 'firebase/database';
import 'firebase/compat/database';
// import { getAuth } from 'firebase/auth';


const firebaseConfig = {
    apiKey: "AIzaSyBGytCikT0mYJTxQN3CRRiWcr9LeApr3mo",
    authDomain: "menubyqr.firebaseapp.com",
    databaseURL: "https://menubyqr-default-rtdb.firebaseio.com",
    projectId: "menubyqr",
    storageBucket: "menubyqr.appspot.com",
    messagingSenderId: "120912014433",
    appId: "1:120912014433:web:555d46cf64d55e69f98e20",
    measurementId: "G-7G05KEZ74C"
};

// Инициализация Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
export { auth };
const app = initializeApp(firebaseConfig);

const database = getDatabase(app);
export { database, ref, push, set , remove};
