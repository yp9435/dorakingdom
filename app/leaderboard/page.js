'use client'
import React, { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/firebaseinit';
import Link from 'next/link';

const LeaderboardPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersRef = collection(db, 'users');
        const userSnapshot = await getDocs(usersRef);
        
        const userList = userSnapshot.docs.map(doc => {
          const userData = doc.data();
          // Calculate total points
          const points = (userData.badges?.gold || 0) * 100 + 
                        (userData.badges?.silver || 0) * 10 + 
                        (userData.badges?.bronze || 0);
          
          return {
            id: doc.id,
            username: userData.username || 'Anonymous',
            image: userData.image || '',
            badges: userData.badges || { gold: 0, silver: 0, bronze: 0 },
            points: points
          };
        });

        // Sort users by points in descending order
        const sortedUsers = userList.sort((a, b) => b.points - a.points);
        setUsers(sortedUsers);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching users:", error);
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-purple-200 text-xl">Loading leaderboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-20 px-4 md:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="heading text-4xl md:text-5xl lg:text-6xl text-white mb-12 text-center mt-20">
          Leaderboard 🏆
        </h1>

        <div className="bg-purple-900/80 backdrop-blur-sm rounded-2xl p-8 space-y-4
                      border border-purple-700/50 shadow-xl mb-8">
          {users.map((user, index) => (
            <div key={user.id} 
                 className={`flex items-center gap-6 p-6 rounded-xl transition-all duration-300
                           mb-4 last:mb-0
                           ${index % 2 === 0 ? 'bg-purple-800/20' : 'bg-purple-800/10'}
                           hover:bg-purple-800/30 hover:transform hover:scale-[1.02]
                           ${index === 0 ? 'bg-gradient-to-r from-yellow-500/10 to-transparent border border-yellow-500/20' : ''}
                           ${index === 1 ? 'bg-gradient-to-r from-gray-400/10 to-transparent border border-gray-400/20' : ''}
                           ${index === 2 ? 'bg-gradient-to-r from-amber-600/10 to-transparent border border-amber-600/20' : ''}`}>
              {/* Rank */}
              <div className="flex-shrink-0 w-12 text-center">
                <span className={`text-2xl font-bold
                              ${index === 0 ? 'text-yellow-400' : 
                                index === 1 ? 'text-gray-300' :
                                index === 2 ? 'text-amber-600' :
                                'text-purple-300'}`}>
                  #{index + 1}
                </span>
              </div>

              {/* User Info */}
              <div className="flex-grow">
                <h3 className="text-white text-lg font-semibold">{user.username}</h3>
                <p className="text-purple-300 text-sm">
                  {user.points} points
                </p>
              </div>

              {/* Badges */}
              <div className="flex gap-4 items-center">
                <div className="flex items-center gap-1">
                  <span className="text-yellow-400">🥇</span>
                  <span className="text-white">{user.badges.gold}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-gray-300">🥈</span>
                  <span className="text-white">{user.badges.silver}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-amber-600">🥉</span>
                  <span className="text-white">{user.badges.bronze}</span>
                </div>
              </div>
            </div>
          ))}
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

export default LeaderboardPage;