import React from 'react'
import Image from 'next/image'
import LoginWithGoogle from '@firebase/loginWithGoogle';

const Home = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 text-center">
      <div className="w-40 h-40 relative mt-10 mb-3 animate-fadeIn">
        <Image 
          src="/assets/Doralogo.png"
          alt="Dora Kingdom Logo"
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-contain"
        />
      </div>

      <h1 className="heading text-5xl md:text-6xl text-white mb-8 animate-fadeIn">
        Welcome to DoraKingdom
      </h1>
      
      <div className="max-w-3xl space-y-6 animate-slideUp">
        <p className="font-bold text-xl md:text-2xl text-purple-200 font-light">
          Turn studying into an epic adventure—together!
        </p>
        
        <p className="text-base md:text-lg text-gray-300 leading-relaxed">
          Set your learning goals, conquer personalized quests tailored to your needs, 
          track your progress with detailed stats, earn badges to celebrate milestones, 
          and share your journey with a vibrant community through shared roadmaps and 
          collaborative discussions!
        </p>

        <LoginWithGoogle buttonText="Start Your Journey!" />
        
      </div>
    </div>
  )
}

export default Home;