'use client';

import React, { useState } from 'react';
import { LetterText, PersonStandingIcon, Video as LucideVideo, CreditCard, Brain, Menu, X } from 'lucide-react';
import { extractTextFromPDF } from "@/utils/pdf-utils";
import { analyzeContent, getGeminiResponse, setPDFContent, extractMainIdeasForVideo } from "@/utils/gemini-utils";
import VideoPopup from '@components/Video';
import HangmanPopup from '@components/Hangman';
import FileUpload from '@components/FileUpload';

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

export default function Page() {
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfText, setPdfText] = useState("");
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isVideoPopupOpen, setIsVideoPopupOpen] = useState(false);
  const [videoTopic, setVideoTopic] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "agent",
      content: "Hello! I can help you analyze PDFs, find relevant videos, or just chat about any topic. How may I assist you today?",
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);

  const [isHangmanPopupOpen, setIsHangmanPopupOpen] = useState(false);
  const [topic, setTopic] = useState('');

  // Handle file upload for chat
  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file || file.type !== 'application/pdf') {
      setMessages(prev => [...prev, {
        role: "agent",
        content: "Please upload a valid PDF file.",
        timestamp: new Date().toLocaleTimeString(),
      }]);
      return;
    }

    setIsProcessing(true);
    setPdfFile(file);

    try {
      const text = await extractTextFromPDF(file);
      setPdfText(text);
      setPDFContent(text);
      const detectedTopic = await analyzeContent(text);
      setTopic(detectedTopic);

      setMessages(prev => [...prev, {
        role: "user",
        content: `Uploaded: ${file.name}`,
        timestamp: new Date().toLocaleTimeString(),
      }, {
        role: "agent",
        content: `I've analyzed your PDF. The main topic appears to be: "${detectedTopic}". You can ask me questions about its content or click the video button to find relevant educational videos. What would you like to know?`,
        timestamp: new Date().toLocaleTimeString(),
      }]);

      const reader = new FileReader();
      reader.onload = () => {
        localStorage.setItem("uploadedPdf", reader.result);
      };
      reader.readAsDataURL(file);

    } finally {
      setIsProcessing(false);
    }
  };

  // Handle message sending
  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = {
      role: "user",
      content: input,
      timestamp: new Date().toLocaleTimeString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsProcessing(true);

    try {
      const response = await getGeminiResponse(input, !!pdfFile);
      
      setMessages(prev => [...prev, {
        role: "agent",
        content: response,
        timestamp: new Date().toLocaleTimeString(),
      }]);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle video button click
  const handleVideoClick = async (e) => {
    e?.preventDefault();
    
    if (!pdfText) {
      setMessages(prev => [...prev, {
        role: "agent",
        content: "Please upload a PDF first to find relevant videos.",
        timestamp: new Date().toLocaleTimeString(),
      }]);
      return;
    }

    setIsProcessing(true);
    try {
      const videoSearchTopic = await extractMainIdeasForVideo(pdfText);
      setVideoTopic(videoSearchTopic);
      setIsVideoPopupOpen(true);
      
      setMessages(prev => [...prev, {
        role: "agent",
        content: `I've found some relevant videos about: ${videoSearchTopic}`,
        timestamp: new Date().toLocaleTimeString(),
      }]);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Hangman click
  const handleHangmanClick = (e) => {
    e.preventDefault();
    if (pdfFile) {
      setIsHangmanPopupOpen(true);
    } else {
      alert('Please upload a PDF file first');
    }
  };

  const menuItems = [
    { icon: PersonStandingIcon, label: 'Hangman', onClick: handleHangmanClick },
    { icon: LucideVideo, label: 'Video', onClick: handleVideoClick },
    { icon: LetterText, label: 'Crossword', onClick: () => {} },
    { icon: CreditCard, label: 'Flashcards', onClick: () => {} },
    { icon: Brain, label: 'Mindmaps', onClick: () => {} },
  ];

  return (
    <div className="mt-10 flex flex-col h-screen bg-gradient-to-br from-purple-900/20 to-purple-800/20">
      {/* Mobile Menu Button */}
      <button 
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="md:hidden fixed top-4 right-4 z-50 p-2 rounded-full bg-purple-600/50 backdrop-blur-sm border-2 border-purple-400/50 text-white"
      >
        {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      <main className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className={cn(
          "fixed md:relative w-64 h-full bg-purple-800/50 backdrop-blur-md border-r-2 border-purple-500/50 transition-all duration-300 z-40",
          isSidebarOpen ? "left-0" : "-left-64",
          "md:left-0"
        )}>
          <div className="p-6 h-full overflow-y-auto">
            <h2 className="text-2xl font-bold text-white mb-6 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Menu</h2>
            
            <div className="mb-6 space-y-4">
              <h3 className="text-lg font-semibold text-purple-200 mb-2">Upload PDF</h3>
              <FileUpload 
                onTopicDetected={setTopic}
                onFileUploaded={setPdfFile}
              />
            </div>

            <ul className="space-y-4">
              {menuItems.map((item, index) => (
                <li key={index}>
                  <a 
                    href="#" 
                    onClick={item.onClick}
                    className="flex items-center p-3 text-purple-200 rounded-xl hover:bg-purple-600/50 hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(168,85,247,0.6)] transition-all duration-300 backdrop-blur-sm border-2 border-purple-400/50 hover:border-purple-400"
                  >
                    <item.icon className="w-5 h-5 mr-3" />
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* Chat Interface */}
        <div className="flex-1 p-4 overflow-y-auto">
          <div className="flex flex-col h-full w-full max-w-5xl mx-auto bg-purple-800/30 backdrop-blur-md shadow-xl rounded-2xl overflow-hidden border-2 border-purple-500/50">
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={cn(
                    "flex gap-3 transition-all duration-300",
                    message.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  {message.role === "agent" && (
                    <div className="h-10 w-10 rounded-full bg-gradient-to-r from-purple-500 to-purple-500 flex-shrink-0 shadow-[0_0_20px_rgba(168,85,247,0.4)]" />
                  )}
                  <div
                    className={cn(
                      "p-4 rounded-2xl shadow-lg max-w-[75%] break-words backdrop-blur-sm",
                      message.role === "user"
                        ? "bg-gradient-to-r from-purple-600/50 to-purple-500/50 text-right"
                        : "bg-purple-900/50 text-left"
                    )}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold text-purple-200">
                        {message.role === "agent" ? "DoraAI" : "You"}
                      </span>
                      <span className="text-xs text-purple-300">{message.timestamp}</span>
                    </div>
                    <p className="text-sm text-white">{message.content}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-purple-500/50 bg-purple-900/30 backdrop-blur-md">
              <textarea
                placeholder="Type a message..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                disabled={isProcessing}
                className="w-full min-h-[44px] max-h-32 p-3 rounded-xl bg-purple-800/50 backdrop-blur-sm border-2 border-purple-400/50 text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none mb-3"
              />
              
              {/* Responsive button grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <button
                  onClick={sendMessage}
                  disabled={isProcessing}
                  className="bg-gradient-to-r from-purple-600 to-purple-500 text-white px-4 py-2 rounded-full font-semibold text-base sm:text-lg hover:opacity-80 transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 backdrop-blur-sm w-full flex items-center justify-center"
                >
                  Send
                </button>

                <button
                  onClick={handleVideoClick}
                  disabled={isProcessing || !pdfFile}
                  className="bg-gradient-to-r from-purple-600 to-purple-500 text-white px-4 py-2 rounded-full font-semibold text-base sm:text-lg hover:opacity-80 transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 backdrop-blur-sm w-full flex items-center justify-center"
                >
                  Find Videos
                </button>

                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="pdf-upload"
                  disabled={isProcessing}
                />
                <label
                  htmlFor="pdf-upload"
                  className={cn(
                    "bg-gradient-to-r from-purple-600 to-purple-500 text-white px-4 py-2 rounded-full font-semibold text-base sm:text-lg hover:opacity-80 transition-all duration-300 hover:scale-[1.02] cursor-pointer backdrop-blur-sm w-full flex items-center justify-center col-span-2 sm:col-span-1",
                    isProcessing ? "opacity-50 cursor-not-allowed" : ""
                  )}
                >
                  {isProcessing ? "Processing..." : "Upload PDF"}
                </label>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Popups */}
      {isVideoPopupOpen && (
        <VideoPopup 
          topic={videoTopic || topic} 
          onClose={() => setIsVideoPopupOpen(false)} 
        />
      )}
      {isHangmanPopupOpen && (
        <HangmanPopup 
          pdfFile={pdfFile} 
          onClose={() => setIsHangmanPopupOpen(false)} 
        />
      )}
    </div>
  );
}
