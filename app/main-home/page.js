'use client'

import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import initMyFirebase from '@/firebase/firebaseinit'
import { onAuthStateChanged } from 'firebase/auth'
import Mission from '@components/Mission'
import { collection, getDocs, query, where, or } from 'firebase/firestore'
import { db } from '@/firebase/firebaseinit'
import Checkin from '@components/Checkin'

const MainHome = () => {
  const [user, setUser] = useState(null)
  const [missions, setMissions] = useState([])
  const { auth } = initMyFirebase()
  const [loading, setLoading] = useState(true)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user)
      setLoading(false)
    })
    return () => unsubscribe()
  }, [auth])

  useEffect(() => {
    const fetchMissions = async () => {
      try {
        const missionsRef = collection(db, 'missions');
        const missionSnapshot = await getDocs(missionsRef);
        
        const missionList = missionSnapshot.docs
          .map((docSnap) => {
            const missionData = docSnap.data();
            return {
              id: docSnap.id,
              ...missionData,
              createdBy: missionData.createdBy || { username: 'Anonymous' }
            };
          })
          .filter(mission => mission.isPrivate !== true);

        console.log("Fetched missions:", missionList);
        setMissions(missionList);
      } catch (error) {
        console.error("Error fetching missions:", error);
      }
    };
    
    fetchMissions();
  }, []);

  if (!isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        Loading...
      </div>
    )
  }

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
        
        {/* Weekly Challenge Section */}
        <div className="mb-16">
          <Link href="/weekly" className="block">
            <div className="relative rounded-2xl overflow-hidden
                          border-2 border-purple-500/50
                          shadow-[0_0_25px_rgba(168,85,247,0.2)]
                          hover:shadow-[0_0_35px_rgba(168,85,247,0.4)]
                          hover:border-purple-400
                          transition-all duration-300
                          bg-gradient-to-br from-purple-900/20 to-purple-800/20
                          group transform hover:scale-[1.01]">
              {/* Background Image*/}
              <div className="absolute inset-0">
                <div className="relative w-full h-full overflow-hidden">
                  <div 
                    className="absolute inset-0 opacity-75"
                    style={{
                      backgroundImage: `url('/assets/weekly.jpg')`,
                      backgroundSize: '200px 200px',
                      backgroundRepeat: 'repeat',
                      transform: 'scale(1.1)',
                    }}
                  />
                </div>
              </div>
              
              {/* Content Container */}
              <div className="relative p-8">
                
                
                {/* Header Section */}
                <div className="flex items-center justify-between mb-8">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <h2 className="text-2xl md:text-6xl text-white heading 
                                   bg-clip-text text-transparent drop-shadow-lg">
                        Weekly Challenge
                      </h2>
                      <span className="text-2xl animate-bounce filter drop-shadow-lg">🎯</span>
                    </div>
                    <p className="text-purple-100 text-sm md:text-base drop-shadow">
                      Complete these tasks to earn special rewards!
                    </p>
                  </div>
                  
                  {/* Timer Section */}
                  <div className="text-right bg-purple-900/60 px-4 py-2 rounded-xl 
                                border border-purple-500/30 backdrop-blur-sm
                                shadow-lg">
                    <div className="text-purple-200 text-xs uppercase tracking-wider font-medium mb-1">
                      Time Remaining
                    </div>
                    <div className="text-white font-bold flex items-center gap-2">
                      <span className="text-purple-400">⏳</span>
                      <span>5d 12h</span>
                    </div>
                  </div>
                </div>
                
                {/* Rewards Section */}
                <div className="relative">
                  <div className="bg-purple-900/60 rounded-xl p-6 
                                border border-purple-600/20 backdrop-blur-md
                                transform hover:scale-[1.01] transition-all duration-300
                                hover:border-purple-500/40 hover:shadow-xl
                                shadow-lg">
                    <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
                      <span className="text-xl filter drop-shadow-lg">🏆</span>
                      <span className="bg-gradient-to-r from-yellow-200 to-yellow-500 
                                     bg-clip-text text-transparent">
                        Rewards
                      </span>
                    </h4>
                    
                    <div className="flex flex-wrap items-center gap-6">
                      {/* Gold Badge Reward */}
                      <div className="flex items-center gap-3 bg-purple-800/50 px-4 py-2 
                                    rounded-lg border border-purple-500/20
                                    hover:border-purple-400/40 transition-colors duration-300
                                    shadow-lg backdrop-blur-sm">
                        <div className="relative">
                          <span className="text-2xl transform hover:scale-110 transition-transform duration-300
                                         inline-block drop-shadow-lg">🥇</span>
                          <div className="absolute -inset-1 bg-yellow-500/20 rounded-full blur-sm"></div>
                        </div>
                        <div className="text-purple-100">
                          <span className="font-bold text-yellow-400">1×</span> Gold Badge
                        </div>
                      </div>
                      
                      {/* Bonus Points Reward */}
                      <div className="flex items-center gap-3 bg-purple-800/50 px-4 py-2 
                                    rounded-lg border border-purple-500/20
                                    hover:border-purple-400/40 transition-colors duration-300
                                    shadow-lg backdrop-blur-sm">
                        <span className="text-2xl animate-pulse drop-shadow-lg">🌟</span>
                        <div className="text-purple-100">
                          <span className="font-bold text-yellow-400">50</span> Bonus Points
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Link>
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
