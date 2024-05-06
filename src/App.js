import React, { useState, useRef, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import './css/App.css';
import LLMAnswer from './components/LLMAnswer';
import SuggestionItem from './components/Suggestions/SuggestionItem';
import Dashboard from './components/Dashboard/Dashboard';
import { getGeminiAnswer, getGeminiSuggestions } from './services/GeminiAPI';
import { getTranscription } from './services/whisper';
import { createFile } from './services/fileSystem';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMicrophone, faMicrophoneSlash, faVolumeUp } from '@fortawesome/free-solid-svg-icons';
import { PulseLoader } from 'react-spinners';
import Full from './components/FullPage/full';

const App = () => {
  const [prompt, setPrompt] = useState('');
  const [chatHistory, setChatHistory] = useState([{
    prompt: '',
    answer: 'My name is NeuralEDU (TradeMark) your chatbot assistance to your Biological course.You can ask ......',
    suggestions: ['1.Comment est formé le vent?', '2.Que veut dire le métabolisme?', '3.De quoi est fait le vin?'],
    context: ''
  }]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const playTextToSpeech = (text) => {
    const synth = window.speechSynthesis;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'fr-FR';
    const voices = synth.getVoices().find(voice => voice.lang === 'fr-FR');
    if (voices) utterance.voice = voices;
    synth.speak(utterance);
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
            createFile(audioFile, audioFile.name).then(() => {
              setIsTranscribing(true);
              getTranscription(audioFile.name).then(transcription => {
                setPrompt(transcription);
                addUserPrompt(transcription);
                setIsTranscribing(false);
              }).catch(error => {
                console.error('Error in transcription:', error);
                setIsTranscribing(false);
              });
            }).catch(error => {
              console.error('Error saving audio:', error);
            });
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
    setChatHistory(chatHistory => [...chatHistory, { prompt: newPrompt, answer: newAnswer, suggestions: newSuggestions, context: newContext }]);
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
