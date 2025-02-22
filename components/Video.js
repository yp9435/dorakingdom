import { fetchVideosByTopic } from "@utils/youtube-utils";
import React, { useEffect, useState } from "react";


const VideoPopup = ({ topic, onClose }) => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadVideos = async () => {
      if (!topic) {
        setError('No topic provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const results = await fetchVideosByTopic(topic);
        setVideos(results);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading videos. Please try again.');
        console.error('Video loading error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadVideos();
  }, [topic]);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white rounded-lg shadow-lg w-11/12 max-w-3xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-4">Videos Related to: {topic}</h2>
          
          {loading && (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          )}
          
          {error && (
            <div className="text-red-500 p-4 rounded-lg bg-red-50">
              {error}
            </div>
          )}
          
          {!loading && !error && videos.length === 0 && (
            <div className="text-gray-500 p-4">
              No videos found for this topic.
            </div>
          )}
          
          <div className="space-y-6">
            {videos.map((video) => (
              <div key={video.id.videoId} className="border rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-2">{video.snippet.title}</h3>
                <div className="aspect-w-16 aspect-h-9">
                  <iframe
                    className="w-full h-[300px] rounded-lg"
                    src={`https://www.youtube.com/embed/${video.id.videoId}`}
                    title={video.snippet.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                </div>
                <p className="mt-2 text-gray-600">{video.snippet.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPopup;