import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

import serviceAccount from "./firebase-service-account.json" with { type: "json" };

export const initFirebase = () => {
  if (!getApps().length) {
    initializeApp({
      credential: cert(serviceAccount),
    });

    console.log("✅ Firebase Admin Initialized");
  }

  return getAuth();
};

export const verifyFirebaseToken = async (token) => {
  const auth = initFirebase();
  return await auth.verifyIdToken(token);
};