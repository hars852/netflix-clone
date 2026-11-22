// firebase.js
import { initializeApp } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  sendPasswordResetEmail
} from "firebase/auth";
import { getFirestore, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { getAnalytics, isSupported } from "firebase/analytics";
import { toast } from "react-toastify";

const firebaseConfig = {
  apiKey: "AIzaSyBnee8UibiWAYJWoDJdEnkqk-Pg3dKRCq8",
  authDomain: "netflix-clone-50901.firebaseapp.com",
  projectId: "netflix-clone-50901",
  storageBucket: "netflix-clone-50901.appspot.com",
  messagingSenderId: "308060036709",
  appId: "1:308060036709:web:bcaf43ff8aa7d7c71b708c",
  measurementId: "G-7Q87VRNCRH"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Safe Analytics initialization
let analytics = null;
if (typeof window !== "undefined") {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  }).catch(() => {});
}

// User-friendly error message formatter
const formatAuthError = (error, context = 'auth') => {
  switch (error.code) {
    case "auth/user-not-found":
      return context === 'reset'
        ? "No account found with this email address. Please check your spelling or sign up."
        : "No account found with this email address.";
    case "auth/invalid-credential":
    case "auth/wrong-password":
      return "Invalid email or password. Please try again.";
    case "auth/email-already-in-use":
      return "An account with this email already exists.";
    case "auth/weak-password":
      return "Password should be at least 8 characters with at least 1 uppercase letter.";
    case "auth/invalid-email":
      return "Please enter a valid email address (e.g., name@gmail.com).";
    case "auth/missing-email":
      return "Please enter your email address.";
    case "auth/network-request-failed":
      return "Network error. Please check your internet connection.";
    case "auth/too-many-requests":
      return "Too many attempts. Please wait a few moments and try again.";
    default:
      if (error.code && error.code.startsWith("auth/")) {
        const readable = error.code.split("/")[1].replace(/-/g, " ");
        return readable.charAt(0).toUpperCase() + readable.slice(1) + ".";
      }
      return error.message?.replace("Firebase: ", "") || "An unexpected error occurred.";
  }
};

// ✅ Signup function with Firestore user creation and toast
const signup = async (name, email, password) => {
  try {
    const res = await createUserWithEmailAndPassword(auth, email, password);
    const user = res.user;

    // Update Auth Profile
    await updateProfile(user, { displayName: name });

    // Store user data in Firestore under doc ID = user.uid
    try {
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        name,
        authProvider: "local",
        email,
        createdAt: serverTimestamp()
      });
    } catch (firestoreError) {
      console.warn("Firestore user record could not be written (check Firestore security rules):", firestoreError);
    }

    toast.success("Signup successful!");
    return user;
  } catch (error) {
    console.error("Signup error:", error);
    const friendlyMessage = formatAuthError(error);
    toast.error(friendlyMessage);
    const err = new Error(friendlyMessage);
    err.code = error.code;
    throw err;
  }
};

// ✅ Login function with toast
const login = async (email, password) => {
  try {
    const res = await signInWithEmailAndPassword(auth, email, password);
    toast.success("Login successful!");
    return res.user;
  } catch (error) {
    console.error("Login error:", error);
    const friendlyMessage = formatAuthError(error);
    toast.error(friendlyMessage);
    const err = new Error(friendlyMessage);
    err.code = error.code;
    throw err;
  }
};

// ✅ Logout function with toast
const logout = async () => {
  try {
    await signOut(auth);
    toast.success("Logged out successfully!");
  } catch (error) {
    console.error("Logout error:", error);
    const friendlyMessage = formatAuthError(error);
    toast.error(friendlyMessage);
    const err = new Error(friendlyMessage);
    err.code = error.code;
    throw err;
  }
};

// ✅ Reset Password function (sends password reset link to user's Gmail/inbox)
const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
    toast.success("Password reset email sent! Check your Gmail/inbox.");
    return true;
  } catch (error) {
    console.error("Password reset error:", error);
    const friendlyMessage = formatAuthError(error, 'reset');
    toast.error(friendlyMessage);
    const err = new Error(friendlyMessage);
    err.code = error.code;
    throw err;
  }
};

export { app, auth, db, analytics, signup, login, logout, resetPassword, formatAuthError };
