import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getFirestore, Firestore, doc, setDoc, getDoc, collection, getDocs, addDoc, updateDoc, deleteDoc, onSnapshot, query, limit } from "firebase/firestore";
import { FirebaseConfigData } from "../types";

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

const DEFAULT_FIREBASE_CONFIG: FirebaseConfigData = {
  apiKey: "AIzaSyBZm2XsGuY-ibxE5L8iU-7jAr7XEqHrEQk",
  authDomain: "crazy-footwear.firebaseapp.com",
  databaseURL: "https://crazy-footwear-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "crazy-footwear",
  storageBucket: "crazy-footwear.firebasestorage.app",
  messagingSenderId: "635157915758",
  appId: "1:635157915758:web:c0b798afef645875d0de7f"
};

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid || null,
      email: auth?.currentUser?.email || null,
      emailVerified: auth?.currentUser?.emailVerified || null,
      isAnonymous: auth?.currentUser?.isAnonymous || null,
      tenantId: auth?.currentUser?.tenantId || null,
      providerInfo: auth?.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Get config from localStorage
export function getStoredFirebaseConfig(): FirebaseConfigData | null {
  return DEFAULT_FIREBASE_CONFIG;
}

export function saveFirebaseConfig(config: FirebaseConfigData) {
  localStorage.setItem("firebase_config", JSON.stringify(config));
}

export function removeFirebaseConfig() {
  localStorage.removeItem("firebase_config");
}

export function isFirebaseConfigured(): boolean {
  return getStoredFirebaseConfig() !== null;
}

export function initializeFirebase(): { app: FirebaseApp | null; auth: Auth | null; db: Firestore | null } {
  const config = getStoredFirebaseConfig();
  
  if (!config) {
    return { app: null, auth: null, db: null };
  }

  try {
    if (getApps().length === 0) {
      app = initializeApp(config);
    } else {
      app = getApp();
    }
    
    auth = getAuth(app);
    db = getFirestore(app);
    return { app, auth, db };
  } catch (error) {
    console.error("Error initializing Firebase:", error);
    return { app: null, auth: null, db: null };
  }
}

// Initial initialization attempt
const services = initializeFirebase();
export { app, auth, db };

export async function loginWithGoogle() {
  const currentAuth = auth || initializeFirebase().auth;
  if (!currentAuth) {
    throw new Error("Firebase Auth is not initialized. Please configure Firebase in the Admin Panel.");
  }
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(currentAuth, provider);
    return result.user;
  } catch (error) {
    console.error("Error signing in with Google", error);
    throw error;
  }
}

export async function logoutUser() {
  const currentAuth = auth || initializeFirebase().auth;
  if (!currentAuth) return;
  await signOut(currentAuth);
}
