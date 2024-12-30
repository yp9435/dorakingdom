"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import initMyFirebase from "@/firebase/firebaseinit";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import LoginWithGoogle from "@firebase/loginWithGoogle";

const Nav = () => {
  console.log("Nav component rendering");

  const [user, setUser] = useState(null);
  const [toggleDropdown, setToggleDropdown] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();
  const [time, setTime] = useState(25 * 60); // 25 minutes in seconds
  const [isActive, setIsActive] = useState(false);
  
  const { auth } = initMyFirebase();

  useEffect(() => {
    console.log("Nav useEffect running");
    setIsClient(true);
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log("Auth state changed:", user);
      if (user) {
        setUser(user);
      } else {
        setUser(null);
      }
    });

    return () => unsubscribe();
  }, [auth]);

  useEffect(() => {
    let interval;
    if (isActive && time > 0) {
      interval = setInterval(() => {
        setTime((prevTime) => prevTime - 1);
      }, 1000);
    } else if (time === 0) {
      setIsActive(false);
      // Optional: Play sound notification
      new Audio('/notification.mp3').play().catch(e => console.log(e));
    }
    return () => clearInterval(interval);
  }, [isActive, time]);

  const startTimer = () => setIsActive(true);
  const pauseTimer = () => setIsActive(false);
  const resetTimer = () => {
    setIsActive(false);
    setTime(25 * 60);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      router.push("/");
    } catch (error) {
      console.error("Error during logout: ", error);
    }
  };

  if (!isClient) {
    return <div className="w-full bg-purple-900/50 p-4">Loading Nav...</div>;
  }

  return (
    <nav className="fixed top-0 left-0 right-0 bg-purple-900 shadow-lg shadow-purple-900/50 border-b border-purple-800 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand Name */}
          <Link href="/" className="flex items-center">
            <Image
              src="/assets/Doralogo.png"
              alt="logo"
              width={65}
              height={65}
              className="object-contain"
            />
            <span className="heading text-white text-4xl mt-4">DoraKingdom</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden sm:flex items-center gap-4">
            <div className="flex items-center gap-2 mr-4">
              <span className="text-white text-xl font-mono">{formatTime(time)}</span>
              <button
                onClick={isActive ? pauseTimer : startTimer}
                className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded"
              >
                {isActive ? '⏸️' : '▶️'}
              </button>
              <button
                onClick={resetTimer}
                className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded"
              >
                🔄
              </button>
            </div>

            {user ? (
              <>
                <Link 
                  href="/create" 
                  className="relative inline-flex items-center px-6 py-2.5 
                    bg-purple-600 hover:bg-purple-500
                    text-white font-semibold text-sm rounded-lg
                    transform hover:-translate-y-0.5 transition-all duration-200
                    shadow-[0_0_15px_rgba(168,85,247,0.5)] hover:shadow-[0_0_25px_rgba(168,85,247,0.7)]
                    before:absolute before:inset-0 before:border-2 before:border-transparent before:rounded-lg
                    before:hover:border-purple-300/50 before:transition-all"
                >
                  <span className="mr-2">✨</span>
                  Create Mission
                </Link>
                
                <button 
                  onClick={handleLogout}
                  className="bg-purple-800 hover:bg-purple-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Logout
                </button>

                <Link href="/profile" className="flex items-center">
                  <Image
                    src={user.photoURL || "/assets/default-profile.png"}
                    width={32}
                    height={32}
                    className="rounded-full border-2 border-purple-700"
                    alt="profile"
                  />
                </Link>
              </>
            ) : (
              <LoginWithGoogle buttonText="Login" />
            )}
          </div>

          {/* Mobile Navigation */}
          <div className="sm:hidden">
            {user ? (
              <div className="relative">
                <Image
                  src={user.photoURL || "/assets/default-profile.png"}
                  width={32}
                  height={32}
                  className="rounded-full border-2 border-purple-700 cursor-pointer"
                  alt="profile"
                  onClick={() => setToggleDropdown(!toggleDropdown)}
                />

                {toggleDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-purple-900 rounded-md shadow-lg py-1 border border-purple-800">
                    <div className="px-4 py-2 text-sm text-purple-300 border-b border-purple-800">
                      <div className="flex items-center justify-between">
                        <span className="font-mono">{formatTime(time)}</span>
                        <div>
                          <button
                            onClick={isActive ? pauseTimer : startTimer}
                            className="mr-2"
                          >
                            {isActive ? '⏸️' : '▶️'}
                          </button>
                          <button onClick={resetTimer}>🔄</button>
                        </div>
                      </div>
                    </div>
                    <Link
                      href="/profile"
                      className="block px-4 py-2 text-sm text-purple-300 hover:bg-purple-800 transition-colors"
                      onClick={() => setToggleDropdown(false)}
                    >
                      My Profile
                    </Link>
                    <Link
                      href="/create"
                      className="block px-4 py-2 text-sm text-purple-300 hover:bg-purple-800 transition-colors"
                      onClick={() => setToggleDropdown(false)}
                    >
                      Create Mission
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        setToggleDropdown(false);
                        handleLogout();
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-purple-300 hover:bg-purple-800 transition-colors"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <LoginWithGoogle buttonText="Login" />
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Nav;

