import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBHwMPMVIJ_jIXAkhGpZ9YcKiS33ODCtl4",
  authDomain: "dusty-web.web.app",
  projectId: "dusty-web",
  storageBucket: "dusty-web.appspot.com",
  messagingSenderId: "980027965271",
  appId: "1:980027965271:web:fd96c431376a3e52610812"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

export default app; 