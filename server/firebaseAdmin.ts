import { initializeApp, getApps, cert, type App, type ServiceAccount as FirebaseServiceAccount } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage'; // getStorage().bucket() returns a Bucket instance

// Make sure to replace with the correct path to your service account key file
import serviceAccountJson from './firebase-admin-sdk-key.json';

// Cast the imported JSON to the ServiceAccount type
const serviceAccount = serviceAccountJson as FirebaseServiceAccount;

let app: App;
const apps = getApps();
if (!apps.length) {
  app = initializeApp({
    credential: cert(serviceAccount),
    storageBucket: "finances-eed07.appspot.com", // Explicitly set the storage bucket
    // You can also specify projectId, databaseURL here if needed,
    // though they are often inferred from the service account key.
    // projectId: serviceAccount.project_id, 
    // databaseURL: 'https://<YOUR_PROJECT_ID>.firebaseio.com',
  });
} else {
  app = apps[0]; // Get the default app if already initialized
}

const adminAuth: Auth = getAuth(app);
const adminDb: Firestore = getFirestore(app);
// Get a reference to the default bucket for the initialized app
const adminStorage = getStorage(app).bucket();

// Note: The 'admin' namespace object is no longer exported.
// Instead, the initialized 'app' instance and specific services are exported.
// If you need types like Timestamp, import them directly, e.g.:
// import { Timestamp } from 'firebase-admin/firestore';
export { app, adminAuth, adminDb, adminStorage }; 