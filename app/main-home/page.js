'use client'

import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import initMyFirebase from '@/firebase/firebaseinit'
import { onAuthStateChanged } from 'firebase/auth'
import Mission from '@components/Mission'
import { collection, getDocs, getDoc, doc } from 'firebase/firestore'
import { db } from '@/firebase/firebaseinit' // make sure this is properly initialized
import Checkin from '@components/Checkin'
import { Sparkles, Clock, Trophy, Brain, Rocket, Star } from 'lucide-react';


const MainHome = () => {
  const [user, setUser] = useState(null)
  const [missions, setMissions] = useState([])
  const { auth } = initMyFirebase()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user)
    })
    return () => unsubscribe()
  }, [auth])

  // Fetch missions from Firestore
  useEffect(() => {
    const fetchMissions = async () => {
      try {
        const missionsRef = collection(db, 'missions');
        const missionSnapshot = await getDocs(missionsRef);
        
        const missionList = missionSnapshot.docs.map((docSnap) => {
          const missionData = docSnap.data();
          return {
            id: docSnap.id,
            ...missionData,
            // createdBy is already a map in the document, so we can use it directly
            createdBy: missionData.createdBy || { username: 'Anonymous' }
          };
        });

        console.log("Fetched missions:", missionList); // Debug log
        setMissions(missionList);
      } catch (error) {
        console.error("Error fetching missions:", error);
      }
    };
    
    fetchMissions();
  }, []);

  return (
    <div className="min-h-screen px-4 py-20">
      <Checkin />
      {/* Welcome Section */}
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="heading text-3xl md:text-6xl lg:text-7xl text-white mb-6 mt-24 
                         tracking-tight animate-fadeIn">
            Welcome back, {user?.displayName || 'Explorer'}! 👑
          </h1>
          <p className="text-purple-200 text-lg">
            Ready to continue your learning adventure?
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <Link href="/create" 
            className="bg-purple-600/50 hover:bg-purple-600/70 p-6 rounded-xl
                     shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:shadow-[0_0_30px_rgba(168,85,247,0.6)]
                     border-2 border-purple-400/50 transition-all duration-300 hover:-translate-y-2
                     relative overflow-hidden group transform hover:scale-[1.02]">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 
                          transform group-hover:scale-105 transition-transform duration-300"/>
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl group-hover:bg-purple-500/30 transition-all duration-300"/>
            
            <div className="relative">
              <div className="flex items-center mb-3">
                <h3 className="text-2xl font-bold text-white">
                  Create Mission
                </h3>
                <span className="ml-2 animate-pulse text-2xl">✨</span>
                <span className="ml-2 text-xs font-semibold px-2 py-1 bg-purple-500/30 rounded-full text-purple-200">
                  Featured
                </span>
              </div>
              <p className="text-purple-100 text-lg">
                Design your own learning quest and share it with others.
              </p>
            </div>
          </Link>

          <Link href="/leaderboard" 
            className="bg-purple-800/50 hover:bg-purple-800/70 p-6 rounded-xl shadow-lg 
                     border border-purple-700/50 transition-all duration-300 hover:-translate-y-1">
            <h3 className="text-xl font-semibold text-white mb-2">Check Leaderboard 🏅</h3>
            <p className="text-purple-200">See top performers and compete with others.</p>
          </Link>

          <Link href="/profile" 
            className="bg-purple-800/50 hover:bg-purple-800/70 p-6 rounded-xl shadow-lg 
                     border border-purple-700/50 transition-all duration-300 hover:-translate-y-1">
            <h3 className="text-xl font-semibold text-white mb-2">Your Achievements 🏆</h3>
            <p className="text-purple-200">Track your progress and view earned badges.</p>
          </Link>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-16">
  {/* Weekly Challenge - Takes up 1/3 width */}
  <div className="lg:col-span-1">
    <Link href="/weekly" className="block h-full">
      <div
        className="relative h-full rounded-2xl overflow-hidden
                   border-2 border-purple-500/50 
                   shadow-[0_0_25px_rgba(168,85,247,0.2)]
                   hover:shadow-[0_0_35px_rgba(168,85,247,0.4)]
                   hover:border-purple-400
                   transition-all duration-300
                   bg-gradient-to-br from-purple-900/20 to-purple-800/20
                   group transform hover:scale-[1.01]"
                   style={{
                    backgroundImage: `url('/assets/weekly.jpg')`,
                    backgroundSize: '200px 200px',
                    backgroundRepeat: 'repeat',}}
      >
        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-black opacity-50" />
        <div className="relative p-6">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-6 h-6 text-purple-400" />
            <h2 className="text-2xl font-bold text-white">Weekly Challenge</h2>
          </div>

          <div className="flex items-center gap-2 mb-6 bg-purple-900/60 p-3 rounded-lg backdrop-blur-sm">
            <Clock className="w-5 h-5 text-purple-400" />
            <span className="text-purple-200">5d 12h remaining</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-purple-800/50 p-3 rounded-lg backdrop-blur-sm border border-purple-500/30">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-400" />
                <span className="text-purple-200">50 Points</span>
              </div>
            </div>
            <div className="bg-purple-800/50 p-3 rounded-lg backdrop-blur-sm border border-purple-500/30">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-yellow-400" />
                <span className="text-purple-200">Gold Badge</span>
              </div>
            </div>
          </div>

          {/* Updated Description */}
          <p className="text-white text-lg mt-4 text-shadow">
            Complete these tasks to earn special rewards! Don't miss out on the opportunity to gain points and badges that reflect your achievements!
          </p>
        </div>
      </div>
    </Link>
  </div>

  {/* DoraAI - Takes up 2/3 width */}
  <div className="lg:col-span-2 relative">
    <Link href="/doraai" className="block h-full">
      <div className="relative h-full rounded-2xl overflow-hidden
                      border-2 border-purple-500/50
                      shadow-[0_0_30px_rgba(168,85,247,0.3)]
                      hover:shadow-[0_0_40px_rgba(168,85,247,0.5)]
                      hover:border-purple-400
                      transition-all duration-300
                      group transform hover:scale-[1.02]"
                      style={{
                        backgroundImage: `url('/assets/doraaibg1.gif')`,
                        backgroundSize: 'cover',
                        backgroundRepeat: 'no-repeat',
                      }}>
        <div className="absolute inset-0 bg-gradient-to-b from-purple-500/50 to-transparent" />
        <div className="relative p-8">
          <div className="absolute top-4 right-4">
            <div className="bg-purple-700/70 px-3 py-1 rounded-full backdrop-blur-sm
                        border border-purple-600/30 animate-pulse">
              <span className="text-purple-100 text-sm font-semibold">New Feature</span>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <Brain className="w-8 h-8 text-purple-800" />
                <h2 className="text-4xl font-bold text-purple-950">Meet DoraAI</h2>
              </div>
              <p className="text-purple-950 text-lg font-medium">
                Your intelligent learning companion that adapts to your journey
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="bg-purple-900 p-4 rounded-xl backdrop-blur-sm
                          border border-purple-600 group-hover:border-purple-500
                          transition-all duration-300">
                <div className="flex items-start gap-3">
                  <Rocket className="w-6 h-6 text-purple-300" />
                  <div>
                    <h3 className="text-purple-100 font-semibold mb-1">Personalized Learning</h3>
                    <p className="text-purple-200 text-sm">
                      AI-driven path that evolves with your progress
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-purple-900 p-4 rounded-xl backdrop-blur-sm
                          border border-purple-600 group-hover:border-purple-500
                          transition-all duration-300">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-6 h-6 text-purple-300" />
                  <div>
                    <h3 className="text-purple-100 font-semibold mb-1">Smart Recommendations</h3>
                    <p className="text-purple-200 text-sm">
                      Get tailored missions and challenges
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4">
              <div className="inline-flex items-center gap-2 
                           bg-purple-800/50 hover:bg-purple-600/70
                           px-6 py-3 rounded-xl
                           border border-purple-400/50
                           transition-all duration-300
                           group-hover:shadow-[0_0_25px_rgba(168,85,247,0.4)]">
                <span className="text-purple-100 font-semibold">Try DoraAI Now</span>
                <span className="text-xl">→</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  </div>
</div>





        {/* Explore Section */}
        <div className="mt-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Explore Missions <span className="text-purple-400">✨</span>
            </h2>
            <p className="text-purple-200 text-lg max-w-2xl mx-auto">
              Discover exciting learning missions created by our community. Each mission is a unique journey of knowledge and growth.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {missions.map((mission) => (
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
        </div>
      </div>
    </div>
  )
}

export default MainHome
