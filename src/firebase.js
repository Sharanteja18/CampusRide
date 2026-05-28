import { initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"

const firebaseConfig = {
  apiKey: "AIzaSyD44IvzvU1Bh_eA9jDFYGhpM4MjWWqrqsU",
  authDomain: "campusride-83d21.firebaseapp.com",
  projectId: "campusride-83d21",
  storageBucket: "campusride-83d21.firebasestorage.app",
  messagingSenderId: "300554613347",
  appId: "1:300554613347:web:51d52c67c40dc8cf02fe56"
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)