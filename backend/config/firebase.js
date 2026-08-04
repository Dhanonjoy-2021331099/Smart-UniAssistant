import "dotenv/config";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY
    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
    : undefined,
};

const hasFirebaseCredentials =
  Boolean(serviceAccount.projectId) &&
  Boolean(serviceAccount.clientEmail) &&
  Boolean(serviceAccount.privateKey);

if (!getApps().length && hasFirebaseCredentials) {
  initializeApp({
    credential: cert(serviceAccount),
  });

  console.log("✅ Firebase Admin Initialized");
} else if (!hasFirebaseCredentials) {
  console.warn(
    "Firebase env vars missing (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY). Google login will be unavailable.",
  );
}

const admin = getApps()[0];

export default admin;

export const initFirebase = () => {
  if (!getApps().length) {
    throw new Error(
      "Firebase is not configured. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY.",
    );
  }

  return getAuth();
};

export const verifyFirebaseToken = async (token) => {
  const auth = initFirebase();
  return await auth.verifyIdToken(token);
};
