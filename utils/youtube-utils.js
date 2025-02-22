import axios from "axios";
const YOUTUBE_SEARCH_URL = "https://www.googleapis.com/youtube/v3/search";

export const fetchVideosByTopic = async (topic) => {
  try {
    const apiKey = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
    if (!apiKey) {
      throw new Error('YouTube API key is not configured');
    }

    console.log('Fetching videos for topic:', topic); // Debug log
    const response = await axios.get(YOUTUBE_SEARCH_URL, {
      params: {
        part: "snippet",
        q: topic,
        type: "video",
        maxResults: 5,
        key: apiKey,
      },
    });

    if (!response.data.items || response.data.items.length === 0) {
      throw new Error('No videos found for this topic');
    }

    return response.data.items;
  } catch (error) {
    console.error('YouTube API error:', error);
    if (axios.isAxiosError(error) && error.response?.status === 403) {
      throw new Error('YouTube API key is invalid or quota exceeded');
    }
    throw new Error('Failed to fetch videos');
  }
};