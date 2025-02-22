'use client'
import React, { useEffect, useState } from 'react';
import { db } from '@/firebase/firebaseinit';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import Link from 'next/link';
import Image from 'next/image';
import Mission from '@/components/Mission';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import initMyFirebase from '@/firebase/firebaseinit';

const ProfilePage = () => {
  const [userData, setUserData] = useState(null);
  const [createdMissions, setCreatedMissions] = useState([]);
  const [followedMissions, setFollowedMissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const { auth } = initMyFirebase();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    console.log("Auth initialized"); // Debug log
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log("Auth state changed:", user); // Debug log
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, [auth]);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!currentUser?.uid) {
        console.log("No current user");
        return;
      }

      try {
        console.log("Fetching data for user:", currentUser.uid);
        
        // Fetch user data
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        
        if (userDocSnap.exists()) {
          const data = userDocSnap.data();
          console.log("User data:", data);
          
          // Calculate total points
          const points = (data.badges?.gold || 0) * 100 + 
                        (data.badges?.silver || 0) * 10 + 
                        (data.badges?.bronze || 0);
          
          setUserData({ 
            ...data, 
            points,
            image: data.image || '/default-avatar.png'
          });

          // Fetch missions if user has any
          if (data.missions && data.missions.length > 0) {
            const missionsData = await Promise.all(
              data.missions.map(async (missionId) => {
                const missionDoc = await getDoc(doc(db, 'missions', missionId));
                if (missionDoc.exists()) {
                  return {
                    id: missionDoc.id,
                    ...missionDoc.data()
                  };
                }
                return null;
              })
            );

            // Filter out any null values and set missions
            const validMissions = missionsData.filter(mission => mission !== null);
            console.log("Fetched missions:", validMissions);
            setCreatedMissions(validMissions);
          }

        } else {
          console.log("No user document found");
        }

        setLoading(false);
      } catch (error) {
        console.error("Error fetching user data:", error);
        setLoading(false);
      }
    };

    if (currentUser) {
      fetchUserData();
    }
  }, [currentUser]);

  if (!isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-purple-900/50 to-black/50">
        <div className="animate-pulse text-purple-200 text-xl">Loading...</div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-purple-900/50 to-black/50">
        <div className="text-purple-200 text-xl">Please log in to view your profile.</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-purple-900/50 to-black/50">
        <div className="animate-pulse text-purple-200 text-xl">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-20 px-4 md:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Profile Header */}
        <div className="bg-purple-900/80 backdrop-blur-sm rounded-2xl p-8 mb-8 
                      border border-purple-700/50 shadow-xl">
          <div className="flex flex-col md:flex-row items-center gap-12">
            {/* User Info - Left Side */}
            <div className="flex flex-col items-center md:items-start gap-6">
              {/* Profile Image */}
              <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-purple-500/50">
                <Image
                  src={userData?.image || userData?.photoURL || '/default-avatar.png'}
                  alt="Profile"
                  fill
                  className="object-cover"
                  unoptimized={true}
                  priority
                />
              </div>

              {/* User Details */}
              <div className="text-center md:text-left">
                <h1 className="text-4xl font-bold text-white mb-2">{userData?.username || 'User'}</h1>
                <p className="text-purple-200 text-lg">{userData?.points || 0} points</p>
              </div>
            </div>

            {/* Badges - Right Side */}
            <div className="flex-grow">
              <div className="flex gap-6 items-center justify-end">
                <div className="flex items-center gap-2 bg-yellow-500/10 px-4 py-3 rounded-lg">
                  <span className="text-5xl">🥇</span>
                  <span className="text-white text-2xl px-2 py-3 font-medium">{userData?.badges?.gold || 0}</span>
                </div>
                <div className="flex items-center gap-2 bg-gray-400/10 px-4 py-3 rounded-lg">
                  <span className="text-5xl">🥈</span>
                  <span className="text-white text-2xl px-2 py-3 font-medium">{userData?.badges?.silver || 0}</span>
                </div>
                <div className="flex items-center gap-2 bg-amber-600/10 px-4 py-3 rounded-lg">
                  <span className="text-5xl">🥉</span>
                  <span className="text-white text-2xl px-2 py-3 font-medium">{userData?.badges?.bronze || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Missions Section */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-white mb-6">Your Missions</h2>
          {userData?.missions?.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {createdMissions.map(mission => (
                <Link key={mission.id} href={`/mission/${mission.id}`}>
                  <Mission
                    title={mission.title}
                    description={mission.description}
                    emoji={mission.emoji}
                    createdBy={mission.createdBy}
                  />
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-purple-200 text-lg">No missions yet.</p>
          )}
        </div>

        {/* Back Button */}
        <div className="mt-12 text-center">
          <Link href="/main-home" 
                className="inline-flex items-center gap-2 px-6 py-3 
                         bg-purple-600 hover:bg-purple-500 
                         text-white font-medium rounded-xl
                         transition-all duration-200 ease-in-out
                         hover:shadow-lg hover:shadow-purple-500/20
                         active:transform active:scale-95">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                    d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
