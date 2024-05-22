import React, { useState, useRef, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import './css/App.css';
import LLMAnswer from './components/LLMAnswer';
import Dashboard from './components/Dashboard/Dashboard';
import Full from './components/FullPage/full';
import { getGeminiAnswer, getGeminiSuggestions } from './services/GeminiAPI';
import { createFile } from './services/fileSystem';
import { getTranscription } from './services/whisper';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMicrophone, faMicrophoneSlash, faVolumeUp, faStop } from '@fortawesome/free-solid-svg-icons';
import { PulseLoader } from 'react-spinners';

const questionBank = [
  '..Comment est formé le vent?',
  '..Que veut dire le métabolisme?',
  '..De quoi est fait le vin?',
  "..Quelle est la source de l'énergie du vent ?",
  "..Quels facteurs influencent la production d'électricité ?",
  '..Quels sont les ingrédients du vin?',
  '..Comment le métabolisme affecte-t-il la croissance?',
  "..L'alcool affecte-t-il le cerveau?",
  "..C'est quoi le systeme solaire?",
  '..Qui est Galilée?',
  "..Qu'est ce qu'une Comète?",
  '..De quoi sont constitues Les planètes joviennes',
  "..C'est quoi un satellite",
  '..Que font Les combustibles fossiles?',
  "..Quel est l'impact environnemental des combustibles fossiles?",
  '..Que signifie La biodiversité'
];

const getRandomSuggestions = (bank, count) => {
  const shuffled = bank.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count).map((question, index) => question.slice(0));
};

const App = () => {
  const [chatHistory, setChatHistory] = useState([{
    prompt: '',
    answer: "Je m'appelle NeuralEDU (TradeMark), votre chatbot d'assistance pour votre cours de biologie. Vous pouvez demander ......",
    suggestions: getRandomSuggestions(questionBank, 3),
    context: ''
  }]);

  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentUtterance, setCurrentUtterance] = useState(null);
  const [speakingIndex, setSpeakingIndex] = useState(null);
  const lastChatEntryRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const chunkText = (text, maxLength) => {
    const sentences = text.split(/(?<=\.)/g);
    const chunks = [];
    let currentChunk = '';

    sentences.forEach(sentence => {
        if (currentChunk.length + sentence.length > maxLength) {
            chunks.push(currentChunk);
            currentChunk = sentence;
        } else {
            currentChunk += sentence;
        }
    });

    if (currentChunk.length > 0) {
        chunks.push(currentChunk);
    }

    return chunks;
};
const playTextToSpeech = (text, index) => {
  const synth = window.speechSynthesis;
  const chunks = chunkText(text, 120);  // Adjust the max length as needed
  if (synth.speaking) {
      synth.cancel();
  }

  let currentChunkIndex = 0;

  const speakNextChunk = (voices) => {
      if (currentChunkIndex < chunks.length) {
          const chunk = chunks[currentChunkIndex];
          const utterance = new SpeechSynthesisUtterance(chunk);
          setCurrentUtterance(utterance);
          setSpeakingIndex(index);
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
          setCurrentUtterance(null);
          setSpeakingIndex(null);
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

  const stopSpeech = () => {
    if (window.speechSynthesis.speaking || window.speechSynthesis.paused) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setCurrentUtterance(null);
      setSpeakingIndex(null);
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

          mediaRecorderRef.current.addEventListener("dataavailable", event => {
            audioChunksRef.current.push(event.data);
          });

          mediaRecorderRef.current.addEventListener("stop", () => {
            const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/mp3' });
            const audioFile = new File([audioBlob], "tmp.mp3", { type: 'audio/mp3' });

            setIsTranscribing(true);

            createFile(audioFile, audioFile.name).then(() => {
              getTranscription(audioFile).then(transcription => {
                console.log(transcription);
                setPrompt(transcription);
                addUserPrompt(transcription);
              }).catch(error => console.error('Error in transcription:', error))
                .finally(() => {
                  setIsTranscribing(false);
                });
            }).catch(error => console.error('Error in saving file:', error));
          });

          mediaRecorderRef.current.start();
          setIsRecording(true);
        }).catch(error => {
          console.error('Error accessing the microphone:', error);
        });
    }
  };

  const animatePrompt = (promptText) => {
    const textarea = document.querySelector('.prompt-form textarea');

    const tempDiv = document.createElement('div');
    tempDiv.textContent = promptText;
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = `${textarea.offsetLeft}px`;
    tempDiv.style.top = `${textarea.offsetTop}px`;
    tempDiv.style.width = `fit-content`;
    tempDiv.style.height = `auto`;
    tempDiv.style.background = 'lightgray';
    tempDiv.style.color = 'black';
    tempDiv.style.padding = '10px';
    tempDiv.style.borderRadius = '4px';
    tempDiv.style.transition = 'all 0.5s ease-in-out';
    tempDiv.style.zIndex = 1000;

    document.body.appendChild(tempDiv);

    setTimeout(() => {
        if (lastChatEntryRef.current) {
            const lastEntryPosition = lastChatEntryRef.current.getBoundingClientRect();
            tempDiv.style.left = `${lastEntryPosition.left}px`;
            tempDiv.style.top = `${lastEntryPosition.top}px`;
            tempDiv.style.width = `${lastEntryPosition.width}px`;
            tempDiv.style.height = `${lastEntryPosition.height}px`;
        }
    }, 100);

    setTimeout(() => {
        document.body.removeChild(tempDiv);
    }, 600); 
};

  const addUserPrompt = async (newPrompt) => {
    //animatePrompt(newPrompt);

    const tempHistory = [...chatHistory, { prompt: newPrompt, answer: "Loading...", suggestions: [], context: '' }];
    setChatHistory(tempHistory);
    setIsLoading(true);

    setTimeout(async () => { 
      const fullConversation = tempHistory.map(entry => ({ prompt: entry.prompt, answer: entry.answer }));
      const [newAnswer, newContext] = await getGeminiAnswer(newPrompt, fullConversation);
      const newSuggestions = await getGeminiSuggestions(newPrompt, newAnswer);

      tempHistory[tempHistory.length - 1] = { prompt: newPrompt, answer: newAnswer, suggestions: newSuggestions, context: newContext };
      setChatHistory(tempHistory);
      
      setPrompt('');
      setIsLoading(false);
      playTextToSpeech(newAnswer, tempHistory.length - 1);
    }, 500);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    addUserPrompt(prompt);
  };

  return (
    <Router>
      <div className="app-container">
        <header className="app-header">
          <h1>NeuralEDU</h1>
        </header>
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/full" element={<Full />} />
          <Route path="/" element={
            <div>
              <div className="chat-sequence">
                {chatHistory.map((entry, index) => (
                  <div key={index} ref={index === chatHistory.length - 1 ? lastChatEntryRef : null} className="chat-entry">
                    <div className="question-section right">
                      <p>{entry.prompt}</p>
                    </div>
                    <div className="answer-section left">
                      <LLMAnswer answer={entry.answer} />
                      {speakingIndex === index ? (
                        <div className="speech-controls">
                          <button onClick={stopSpeech}>
                            <FontAwesomeIcon icon={faStop} />
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => playTextToSpeech(entry.answer, index)}>
                          <FontAwesomeIcon icon={faVolumeUp} />
                          Écoutez la réponse
                        </button>
                      )}
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
                <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Ecrire votre question ici..." />
                <button type="submit">Envoyer</button>
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
