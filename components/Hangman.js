import React, { useState, useEffect } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { GoogleGenerativeAI } from '@google/generative-ai';

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

let pdfContent = '';
export const setPDFContent = (content) => {
  pdfContent = content;
};

export const getPDFContent = () => {
  return pdfContent;
};

export async function extractKeywordsFromPDF(text) {
  try {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('Gemini API key is not configured');
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    const prompt = `Identify the main topic of the given content and return a list of relevant words, each greater than 4 characters and less than 15 characters, suitable for a hangman game. Ensure the words are separated by commas and have no whitespaces in between: ${text}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const words = response.text().split(',').map(word => word.trim().toUpperCase());
    return words.filter(word => word.length > 4 && word.length < 15);
  } catch (error) {
    console.error('Gemini extraction error:', error);
    throw new Error('Failed to extract keywords');
  }
}

const HangmanPopup = ({ pdfFile, onClose }) => {
  const [gameKey, setGameKey] = useState(0);
  const [word, setWord] = useState('');
  const [wordList, setWordList] = useState([]);
  const [guessedLetters, setGuessedLetters] = useState([]);
  const [incorrectGuesses, setIncorrectGuesses] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const maxIncorrectGuesses = 6;

  useEffect(() => {
    setGuessedLetters([]);
    setIncorrectGuesses(0);
    if (!pdfFile) {
      setError('No PDF file provided');
      setLoading(false);
      return;
    }

    const extractWordFromPDF = async () => {
      try {
        setLoading(true);
        const arrayBuffer = await pdfFile.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let text = '';

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          text += content.items
            .filter(item => 'str' in item)
            .map(item => item.str)
            .join(' ');
        }

        const keywords = await extractKeywordsFromPDF(text);
        if (keywords.length === 0) {
          throw new Error('No suitable keywords found');
        }

        setWordList(keywords);
        setWord(keywords[Math.floor(Math.random() * keywords.length)]);
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Error processing PDF');
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    extractWordFromPDF();
  }, [pdfFile, gameKey]);

  const handleGuess = (letter) => {
    if (guessedLetters.includes(letter)) return;
    setGuessedLetters([...guessedLetters, letter]);
    if (!word.includes(letter)) {
      setIncorrectGuesses(incorrectGuesses + 1);
    }
  };

  const isGameOver = incorrectGuesses >= maxIncorrectGuesses;
  const isGameWon = word.split('').every(letter => guessedLetters.includes(letter));

  const playAgain = () => {
    setGameKey(prevKey => prevKey + 1);
    setWord(wordList[Math.floor(Math.random() * wordList.length)]);
    setGuessedLetters([]);
    setIncorrectGuesses(0);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white rounded-lg shadow-lg w-11/12 max-w-3xl relative max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <div className="p-6" key={gameKey}>
          <h2 className="text-2xl font-bold mb-4">Hangman Game</h2>
          {loading && (<div className="flex justify-center items-center h-32"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div></div>)}
          {error && (<div className="text-red-500 p-4 rounded-lg bg-red-50">{error}</div>)}
          {!loading && !error && (
            <div className="space-y-6">
              <div className="mb-4 text-center">
                {word.split('').map((letter, index) => (
                  <span key={index} className="text-3xl mx-1 font-mono">
                    {guessedLetters.includes(letter) ? letter : '_'}
                  </span>
                ))}
              </div>
              <div className="text-center mb-4">
                <p className="text-lg">Incorrect Guesses: {incorrectGuesses} / {maxIncorrectGuesses}</p>
                <p className="text-sm text-gray-600">Guessed Letters: {guessedLetters.join(', ')}</p>
              </div>
              <div className="grid grid-cols-7 gap-2 md:gap-3">
                {'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map(letter => (
                  <button key={letter} onClick={() => handleGuess(letter)} disabled={guessedLetters.includes(letter) || isGameOver || isGameWon} className={`p-3 text-lg font-semibold rounded-lg transition duration-200 ${guessedLetters.includes(letter) ? 'bg-gray-200 text-gray-500' : 'bg-blue-500 text-white hover:bg-blue-600'} ${isGameOver || isGameWon ? 'opacity-50 cursor-not-allowed' : ''}`}>{letter}</button>
                ))}
              </div>
              {(isGameOver || isGameWon) && (
                <div className={`text-center p-4 rounded-lg ${isGameWon ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  <p className="text-xl font-bold">{isGameWon ? 'Congratulations! You\'ve won!' : `Game Over! The word was ${word}`}</p>
                  <button onClick={playAgain} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">Play Again</button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HangmanPopup;