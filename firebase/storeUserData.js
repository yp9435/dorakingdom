import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "./firebaseinit";

export async function createUserDocument(user) {
  if (!user) {
    console.log("No user provided to createUserDocument");
    return;
  }

  const userRef = doc(db, "users", user.uid);

  try {
    // Check if user document already exists
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      console.log("User already exists, updating lastLogin");
      // Only update lastLogin for existing users
      await setDoc(userRef, {
        lastLogin: new Date()
      }, { merge: true });
      return false;
    }

    // If user doesn't exist, create new document with all fields
    console.log("Creating new user document for:", user.email);
    const userData = {
        username: user.displayName || "Anonymous",
        email: user.email,
        image: user.photoURL || "",
        badges: {
          silver: 0,
          gold: 0,
          bronze: 0,
        },
        missions: {}
    };
    await setDoc(userRef, userData);
    console.log("New user document created successfully for:", user.email);
    return true;

  } catch (error) {
    console.error("Error handling user document:", error);
    throw error;
  }
}
