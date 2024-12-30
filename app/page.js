'use client'
import { useEffect, useState } from 'react';
import { db } from '@/firebase/firebaseinit';
import { collection, query, where, getDocs } from 'firebase/firestore';
import Mission from '@/components/Mission';

const Home = () => {
  const [missions, setMissions] = useState([]);

  useEffect(() => {
    const fetchMissions = async () => {
      try {
        const missionsRef = collection(db, "missions");
        // Only fetch missions where isPrivate is false
        const q = query(missionsRef, where("isPrivate", "==", false));
        const querySnapshot = await getDocs(q);
        
        const missionData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setMissions(missionData);
      } catch (error) {
        console.error("Error fetching missions:", error);
      }
    };

    fetchMissions();
  }, []);

  return (
    <div className="min-h-screen py-20 px-4 md:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {missions.map(mission => (
            <Mission
              key={mission.id}
              id={mission.id}
              title={mission.title}
              description={mission.description}
              emoji={mission.emoji}
              createdBy={mission.createdBy}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Home;
