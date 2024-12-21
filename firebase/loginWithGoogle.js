'use client';

import { getAuth, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import initMyFirebase from './firebaseinit';
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createUserDocument } from "@/firebase/storeUserData";

const LoginWithGoogle = ({ buttonText = "Login" }) => {
    const router = useRouter(); // Always call useRouter
    const { auth } = initMyFirebase(); // Always call initMyFirebase

    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    const handleLogin = async () => {
        try {
            // 1. Sign in with Google
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, provider);
            const user = result.user;
            
            // 2. Log the user object to verify we have the data
            console.log("Logged in user:", user);
            
            // 3. Create/update user document in Firestore
            try {
                await createUserDocument(user);
                console.log("User document created successfully");
            } catch (firestoreError) {
                console.error("Firestore error:", firestoreError);
            }
            
            // 4. Navigate to main-home
            console.log("Navigating to main-home");
            router.push('/main-home');
            
        } catch (error) {
            console.error("Login error:", error);
            // You might want to show an error message to the user here
        }
    };

    if (!isClient) {
        return <div>Loading...</div>; // Always return a valid render output
    }

    return (
        <button 
            onClick={handleLogin}
            className="bg-purple-800 hover:bg-purple-700 text-white px-4 py-2 rounded-md text-sm font-medium 
                        transition-colors duration-200 ease-in-out shadow-md hover:shadow-lg 
                        focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50
                        active:bg-purple-900 transform hover:-translate-y-0.5"
        >
            {buttonText}
        </button>
    )
}

export default LoginWithGoogle;
