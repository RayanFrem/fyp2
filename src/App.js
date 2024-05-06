import React, { useState, useRef } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import './css/App.css';
import LLMAnswer from './components/LLMAnswer';
import Dashboard from './components/Dashboard/Dashboard';
import Full from './components/FullPage/full';
import { getGeminiAnswer, getGeminiSuggestions } from './services/GeminiAPI';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMicrophone, faMicrophoneSlash, faVolumeUp } from '@fortawesome/free-solid-svg-icons';
import { PulseLoader } from 'react-spinners';

const App = () => {
  const [prompt, setPrompt] = useState('');
  const [chatHistory, setChatHistory] = useState([{
    prompt: '',
    answer: 'My name is NeuralEDU (TradeMark) your chatbot assistance to your Biological course. You can ask ......',
    suggestions: ['1. Comment est formé le vent?', '2. Que veut dire le métabolisme?', '3. De quoi est fait le vin?'],
    context: ''
  }]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const chunkText = (text, chunkSize) => {
    const chunks = [];
    while (text.length > 0) {
      let chunk = text.substring(0, chunkSize);
      let lastSpace = chunk.lastIndexOf(' ');
      if (lastSpace > 0 && text.length > chunkSize) {
        chunk = chunk.substring(0, lastSpace);
      }
      chunks.push(chunk);
      text = text.substring(chunk.length);
    }
    return chunks;
  };

  const playTextToSpeech = (text) => {
    const synth = window.speechSynthesis;
    const chunks = chunkText(text, 120);
    if (synth.speaking) {
      synth.cancel();
    }
  
    let currentChunkIndex = 0;
  
    const speakNextChunk = (voices) => {
      if (currentChunkIndex < chunks.length) {
        const chunk = chunks[currentChunkIndex];
        const utterance = new SpeechSynthesisUtterance(chunk);
        let voice = voices.find(voice => voice.lang === 'fr-FR');
        if (!voice) {
          voice = voices.find(voice => voice.lang.startsWith('en-'));
          console.log('Using English voice as no French voice was found.');
        } else {
          console.log('Using French voice.');
        }
  
        utterance.voice = voice;
        utterance.lang = voice.lang;
        utterance.onend = () => {
          currentChunkIndex++;
          speakNextChunk(voices);
        };
        utterance.onerror = (event) => {
          console.error('Speech synthesis error:', event);
        };
  
        synth.speak(utterance);
      } else {
        setIsSpeaking(false);
      }
    };
  
    const setVoiceAndSpeak = (voices) => {
      setIsSpeaking(true); 
      speakNextChunk(voices);
    };
  
    if (synth.getVoices().length === 0) {
      window.speechSynthesis.onvoiceschanged = () => {
        setVoiceAndSpeak(synth.getVoices());
      };
    } else {
      setVoiceAndSpeak(synth.getVoices());
    }
  };
  

  const handleVoiceRecording = () => {
    if (isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    } else {
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
          mediaRecorderRef.current = new MediaRecorder(stream);
          audioChunksRef.current = [];
          mediaRecorderRef.current.addEventListener('dataavailable', event => {
            audioChunksRef.current.push(event.data);
          });
          mediaRecorderRef.current.addEventListener('stop', () => {
            const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/mp3' });
            const audioFile = new File([audioBlob], 'tmp.mp3', { type: 'audio/mp3' });
            setIsTranscribing(true);
            // You can add code here to upload the file or convert it to text
          });
          mediaRecorderRef.current.start();
          setIsRecording(true);
        }).catch(error => {
          console.error('Error accessing the microphone:', error);
        });
    }
  };

  const addUserPrompt = async (newPrompt) => {
    setIsLoading(true);
    const [newAnswer, newContext] = await getGeminiAnswer(newPrompt);
    const newSuggestions = await getGeminiSuggestions(newPrompt, newAnswer);
    setChatHistory([...chatHistory, { prompt: newPrompt, answer: newAnswer, suggestions: newSuggestions, context: newContext }]);
    setPrompt('');
    setIsLoading(false);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    addUserPrompt(prompt);
  };

  return (
    <Router>
      <div className="app-container">
        <header className="app-header">
          <h1>FYP2 Biology Chatbot</h1>
        </header>
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/full" element={<Full />} />
          <Route path="/" element={
            <div>
              <div className="chat-sequence">
                {chatHistory.map((entry, index) => (
                  <div key={index} className="chat-entry">
                    <div className="question-section right">
                      <p>{entry.prompt}</p>
                    </div>
                    <div className="answer-section left">
                      <LLMAnswer answer={entry.answer} />
                      <button onClick={() => playTextToSpeech(entry.answer)}>
                        <FontAwesomeIcon icon={faVolumeUp} />
                        Hear Response
                        {isSpeaking && <PulseLoader color="#36D7B7" size={8} />}
                      </button>
                      {index === chatHistory.length - 1 && entry.suggestions && (
                        <div className="suggestions-section">
                          {entry.suggestions.map((suggestion, idx) => (
                            <button key={idx} onClick={() => addUserPrompt(suggestion.length > 2 ? suggestion.substring(2) : suggestion)}>
                              {suggestion.length > 2 ? suggestion.substring(2) : suggestion}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {isTranscribing && <PulseLoader color="#36D7B7" />}
                {isLoading && <PulseLoader color="#36D7B7" />}
              </div>
              <form className="prompt-form" onSubmit={handleFormSubmit}>
                <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Enter your question here..."/>
                <button type="submit">Send</button>
                <button type="button" onClick={handleVoiceRecording} className="mic-button">
                  {isRecording ? <FontAwesomeIcon icon={faMicrophoneSlash} /> : <FontAwesomeIcon icon={faMicrophone} />}
                </button>
              </form>
            </div>
          } />
        </Routes>
      </div>
    </Router>
  );  
};

export default App;
