import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Possible paths for serviceAccountKey.json
const keyPathInServer = path.join(__dirname, '..', 'serviceAccountKey.json');
const userDownloadsPath = path.join(process.env.USERPROFILE || '', 'Downloads');

let serviceAccount = null;
let resolvedKeyPath = null;

if (fs.existsSync(keyPathInServer)) {
  resolvedKeyPath = keyPathInServer;
} else if (fs.existsSync(userDownloadsPath)) {
  // Check if user downloaded serviceAccountKey or firebase adminsdk json in Downloads
  try {
    const files = fs.readdirSync(userDownloadsPath);
    const keyFile = files.find(f => f.toLowerCase().includes('adminsdk') && f.endsWith('.json'));
    if (keyFile) {
      resolvedKeyPath = path.join(userDownloadsPath, keyFile);
      console.log(`🔍 Found Firebase Admin key in Downloads: ${keyFile}`);
    }
  } catch (e) {
    // Ignore read errors
  }
}

if (resolvedKeyPath) {
  try {
    const raw = fs.readFileSync(resolvedKeyPath, 'utf8');
    serviceAccount = JSON.parse(raw);
    
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: `${serviceAccount.project_id}.appspot.com`
      });
    }
    console.log(`🔥 Firebase Admin connected successfully to Project ID: ${serviceAccount.project_id}`);
  } catch (err) {
    console.error('❌ Failed to initialize Firebase Admin with key:', err.message);
  }
}

export const isFirebaseReady = !!admin.apps.length;
export const firestore = isFirebaseReady ? admin.firestore() : null;
export const storageBucket = isFirebaseReady ? admin.storage().bucket() : null;
export { admin };
