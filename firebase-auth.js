import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
    getAuth,
    GoogleAuthProvider,
    signInWithPopup,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
    getFirestore,
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    onSnapshot,
    serverTimestamp,
    query,
    where
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyCCwu9pkbhf8CF4Lvd2zoUlZbR0U3oYz4g",
    authDomain: "local-volunteer-directory.firebaseapp.com",
    projectId: "local-volunteer-directory",
    storageBucket: "local-volunteer-directory.firebasestorage.app",
    messagingSenderId: "735553002008",
    appId: "1:735553002008:web:004f99b991e901d66bc16d"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const db = getFirestore(app);

// Ye helpers script.js use karegi (window ke zariye)
window.fb = { db, collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, serverTimestamp, query, where };
window.currentUser = null;

const googleLoginBtn = document.getElementById("googleLoginBtn");
const userBar = document.getElementById("userBar");
const userPhoto = document.getElementById("userPhoto");
const userName = document.getElementById("userName");
const logoutBtn = document.getElementById("logoutBtn");

function notify(message) {
    if (typeof window.showToast === "function") {
        window.showToast(message);
    }
}

googleLoginBtn.addEventListener("click", async () => {
    googleLoginBtn.disabled = true;

    try {
        const result = await signInWithPopup(auth, provider);
        notify(`Welcome, ${result.user.displayName || "volunteer"}!`);
    } catch (error) {
        if (error.code !== "auth/popup-closed-by-user" && error.code !== "auth/cancelled-popup-request") {
            console.error(error);
            notify(`Google login failed (${error.code}).`);
        }
    } finally {
        googleLoginBtn.disabled = false;
    }
});

logoutBtn.addEventListener("click", async () => {
    try {
        await signOut(auth);
    } catch (error) {
        console.error(error);
    }

    window.location.reload();
});

onAuthStateChanged(auth, user => {
    window.currentUser = user;
    window.dispatchEvent(new Event("authchange"));

    if (!user) {
        userBar.hidden = true;
        return;
    }

    userName.textContent = user.displayName || user.email || "User";

    if (user.photoURL) {
        userPhoto.src = user.photoURL;
        userPhoto.hidden = false;
    } else {
        userPhoto.hidden = true;
    }

    userBar.hidden = false;

    if (typeof window.enterApp === "function") {
        window.enterApp();
    }
});