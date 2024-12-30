'use client'
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { db } from '../../../firebase/firebaseinit';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, collection, addDoc, query, where, orderBy, getDocs, serverTimestamp } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import Popup from '@/components/Popup';

const cleanText = (text) => {
  if (!text) return '';
  return text.replace(/["']/g, '');
};

const MissionPage = () => {
  const [mission, setMission] = useState(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [userQuests, setUserQuests] = useState({});
  const [showPopup, setShowPopup] = useState(false);
  const [completedQuest, setCompletedQuest] = useState(null);
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const params = useParams();
  const id = params.id;
  const auth = getAuth();

  useEffect(() => {
    const fetchMissionAndUserStatus = async () => {
      if (!auth.currentUser) {
        console.log("No auth user");
        return;
      }

      try {
        // Fetch mission data
        const missionDoc = await getDoc(doc(db, 'missions', id));
        console.log("Mission data:", missionDoc.data());
        if (missionDoc.exists()) {
          setMission(missionDoc.data());
        }

        // Check if user is enrolled and get their quest progress
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        console.log("User data:", userDoc.data());
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setIsEnrolled(userData.missions?.includes(id) || false);
          
          // Get user's quest progress for this mission
          if (userData.quests && userData.quests[missionDoc.data()?.title]) {
            setUserQuests(userData.quests[missionDoc.data().title]);
          }
        }

        // Fetch comments
        const commentsRef = collection(db, 'comments');
        const q = query(
          commentsRef,
          where('missionId', '==', id),
          orderBy('createdAt', 'desc')
        );
        const querySnapshot = await getDocs(q);
        const commentsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setComments(commentsData);

      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchMissionAndUserStatus();
  }, [id, auth.currentUser]);

  // Add loading state
  if (!mission) {
    return (
      <div className="min-h-screen py-20 px-4 md:px-8">
        <div className="max-w-4xl mx-auto text-center text-white">
          Loading mission...
        </div>
      </div>
    );
  }

  console.log("Current mission state:", mission);
  console.log("Current userQuests state:", userQuests);
  console.log("isEnrolled:", isEnrolled);

  const handleEnrollment = async () => {
    if (!auth.currentUser) return;

    try {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      
      // Add mission to user's missions array
      await updateDoc(userRef, {
        missions: arrayUnion(id)
      });

      // Initialize quest progress in user's document
      const questsObject = {};
      Object.entries(mission.quests).forEach(([key, quest]) => {
        questsObject[key] = {
          id: quest.id,
          questName: quest.questName,
          completed: 0
        };
      });

      await updateDoc(userRef, {
        [`quests.${mission.title}`]: questsObject
      });

      setIsEnrolled(true);
      setUserQuests(questsObject);
    } catch (error) {
      console.error("Error enrolling in mission:", error);
    }
  };

  const handleQuestCompletion = async (questKey) => {
    if (!auth.currentUser || !isEnrolled) return;

    try {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      const newStatus = userQuests[questKey]?.completed === 1 ? 0 : 1;
      
      // Update quest completion status
      await updateDoc(userRef, {
        [`quests.${mission.title}.${questKey}.completed`]: newStatus
      });

      // If quest is being completed (not uncompleted), increase bronze badges
      if (newStatus === 1) {
        // Get current user data to get current badge count
        const userDoc = await getDoc(userRef);
        const currentBadges = userDoc.data()?.badges || { bronze: 0 };
        
        // Update bronze badge count
        await updateDoc(userRef, {
          'badges.bronze': (currentBadges.bronze || 0) + 2
        });
      }

      // Update local state
      setUserQuests(prev => ({
        ...prev,
        [questKey]: {
          ...prev[questKey],
          completed: newStatus
        }
      }));

      // Show popup when quest is completed
      if (newStatus === 1) {
        setCompletedQuest(mission.quests[questKey].questName);
        setShowPopup(true);
      }
    } catch (error) {
      console.error("Error updating quest status:", error);
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim() || !auth.currentUser) return;

    try {
      setIsLoading(true);
      const commentData = {
        missionId: id,
        text: comment,
        createdAt: serverTimestamp(),
        userId: auth.currentUser.uid,
        userName: auth.currentUser.displayName || 'Anonymous',
        userPhoto: auth.currentUser.photoURL || null
      };

      await addDoc(collection(db, 'comments'), commentData);
      
      // Refresh comments
      const commentsRef = collection(db, 'comments');
      const q = query(
        commentsRef,
        where('missionId', '==', id),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const commentsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setComments(commentsData);
      
      setComment('');
    } catch (error) {
      console.error("Error adding comment:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-20 px-4 md:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="bg-purple-900/80 backdrop-blur-sm rounded-2xl p-8 mb-8 
                      border border-purple-700/50 shadow-lg">
          <div className="flex items-center gap-6 mb-6">
            <div className="p-4 rounded-xl shadow-inner">
              <span className="text-5xl">{cleanText(mission?.emoji)}</span>
            </div>
            <h1 className="heading text-5xl md:text-6xl lg:text-7xl text-white 
                          tracking-tight leading-tight animate-fadeIn">
              {cleanText(mission?.title)}
            </h1>
          </div>
          <p className="text-xl text-purple-200 leading-relaxed mb-6">
            {cleanText(mission?.description)}
          </p>
          <div className="text-sm text-purple-300">
            Created by <span className="font-medium text-white">
              {cleanText(mission?.createdBy?.username) || 'Anonymous'}
            </span>
          </div>
        </div>

        {/* Quests Section */}
        <div className="bg-purple-900/60 backdrop-blur-sm rounded-2xl p-8 
                      border border-purple-700/50 shadow-lg">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <span className="text-purple-400">📋</span> Quests
          </h2>
          
          <div className="space-y-4">
            {Object.entries(mission?.quests || {}).map(([key, quest]) => (
              <div key={key} 
                   className="bg-purple-800/40 rounded-xl p-6 border border-purple-600/30
                            hover:border-purple-500/50 transition-all duration-200
                            hover:shadow-lg hover:shadow-purple-500/10">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">{cleanText(quest.questName)}</h3>
                    <p className="text-purple-200">{cleanText(quest.description)}</p>
                  </div>
                  <button 
                    onClick={() => handleQuestCompletion(key)}
                    disabled={!isEnrolled}
                    className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2
                            ${!isEnrolled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                            ${userQuests[key]?.completed === 1 ? 
                              'bg-green-500/20 text-green-300 border border-green-500/30' : 
                              'bg-purple-700/30 text-purple-300 border border-purple-600/30'}`}>
                    {userQuests[key]?.completed === 1 ? (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                                d="M5 13l4 4L19 7" />
                        </svg>
                        Completed
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                                d="M6 6h12v12H6z" />
                        </svg>
                        Mark Complete
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Progress Section */}
        <div className="mt-8 text-center">
          {!isEnrolled ? (
            <button 
              onClick={handleEnrollment}
              className="bg-purple-600 hover:bg-purple-500 text-white 
                       px-8 py-3 rounded-xl font-medium
                       transition-all duration-200 ease-in-out
                       hover:shadow-lg hover:shadow-purple-500/20
                       active:transform active:scale-95
                       flex items-center gap-2 mx-auto">
              Start Mission <span className="text-xl">→</span>
            </button>
          ) : (
            <p className="text-purple-200 text-lg">
              Mission in progress - Complete the quests above!
            </p>
          )}
        </div>

        {/* Add Comments Section */}
        <div className="mt-12">
          <div className="bg-purple-900/80 backdrop-blur-sm rounded-2xl p-8 
                      border border-purple-700/50 shadow-lg">
            <h3 className="text-2xl font-bold text-white mb-6">Mission Discussion</h3>

            {/* Comment Form */}
            <form onSubmit={handleCommentSubmit} className="mb-8">
              <div className="flex gap-4">
                <input
                  type="text"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share your thoughts or ask questions..."
                  className="flex-1 bg-purple-800/30 text-white rounded-lg 
                           border border-purple-600/30 p-4
                           focus:outline-none focus:ring-2 focus:ring-purple-500/50
                           placeholder-purple-400/50"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={isLoading || !comment.trim() || !auth.currentUser}
                  className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-2 
                           rounded-lg transition-colors duration-200 disabled:opacity-50"
                >
                  Post
                </button>
              </div>
              {!auth.currentUser && (
                <p className="text-purple-300 text-sm mt-2">
                  Please sign in to post comments
                </p>
              )}
            </form>

            {/* Comments List */}
            <div className="space-y-4">
              {comments.map((comment) => (
                <div 
                  key={comment.id}
                  className="bg-purple-800/30 rounded-lg p-4 border border-purple-600/30"
                >
                  <div className="flex items-center gap-2 mb-2">
                    {comment.userPhoto ? (
                      <img 
                        src={comment.userPhoto} 
                        alt={comment.userName}
                        className="w-6 h-6 rounded-full"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center">
                        {comment.userName[0]}
                      </div>
                    )}
                    <span className="text-purple-200 font-medium">{comment.userName}</span>
                    <span className="text-purple-400 text-sm">
                      {comment.createdAt?.toDate().toLocaleDateString() || 'Just now'}
                    </span>
                  </div>
                  <p className="text-white">{comment.text}</p>
                </div>
              ))}
              {comments.length === 0 && (
                <p className="text-purple-300 text-center">
                  No comments yet. Be the first to share your thoughts!
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Popup Component */}
      {showPopup && (
        <Popup
          title="Quest Completed! 🎉"
          message={`Congratulations! You've completed "${completedQuest}" and earned a badge!`}
          onClose={() => setShowPopup(false)}
        />
      )}
    </div>
  );
};

export default MissionPage;
