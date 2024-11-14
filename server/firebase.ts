import { initializeApp, applicationDefault, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import serviceAccount from './service_account.json';

const app = initializeApp({
  credential: cert(serviceAccount),
});
const db = getFirestore();

export { db };