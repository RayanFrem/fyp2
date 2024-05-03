import React, { useState, useEffect, useRef } from 'react';
import '../../css/App.css';
import ContextCard from '../ContextCard';
import LLMAnswer from '../LLMAnswer';
import SuggestionItem from '../Suggestions/SuggestionItem';
import Login from '../Login/Login';
import { getGeminiAnswer, getGeminiSuggestions } from '../../services/GeminiAPI';
import { getTranscription } from '../../services/whisper';
import { createFile } from '../../services/fileSystem';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowDown, faMicrophone, faMicrophoneSlash, faVolumeUp } from '@fortawesome/free-solid-svg-icons';
import { PulseLoader } from 'react-spinners';
import Modal from 'react-modal';

Modal.setAppElement('#root');

const Full = () => {
  const [prompt, setPrompt] = useState('');
  const [context, setContext] = useState('');
  const [answer, setAnswer] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const playTextToSpeech = (text) => {
    const synth = window.speechSynthesis;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'fr-FR';
    const voices = synth.getVoices().find(voice => voice.lang === 'fr-FR');
    if (voices) {
      utterance.voice = voices;
    }
    synth.speak(utterance);
  };

  useEffect(() => {
    if (answer) {
      playTextToSpeech(answer); // Auto-play the answer using text-to-speech
    }
  }, [answer]);

  const startRecording = () => {
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then((stream) => {
        mediaRecorderRef.current = new MediaRecorder(stream);
        audioChunksRef.current = [];

        mediaRecorderRef.current.addEventListener('dataavailable', (event) => {
          audioChunksRef.current.push(event.data);
        });

        mediaRecorderRef.current.addEventListener('stop', () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/mp3' });
          const audioFile = new File([audioBlob], 'tmp.mp3', { type: 'audio/mp3' });

          createFile(audioFile, audioFile.name)
            .then(() => {
              setIsTranscribing(true);
              getTranscription(audioFile.name)
                .then((transcription) => {
                  setPrompt(transcription);
                  setIsTranscribing(false);
                  addUserPrompt(transcription);
                })
                .catch((error) => {
                  console.error('Error in transcription:', error);
                  setIsTranscribing(false);
                });
            })
            .catch((error) => {
              console.error('Error saving audio:', error);
            });
        });

        mediaRecorderRef.current.start();
        setIsRecording(true);
      })
      .catch((error) => {
        console.error('Error accessing the microphone:', error);
      });
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleMicClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleLoginClick = () => {
    setShowLoginModal(!showLoginModal);
  };

  const addUserPrompt = async (newPrompt) => {
    setIsLoading(true);
    const [newAnswer, newContext] = await getGeminiAnswer(newPrompt);
    setAnswer(newAnswer);
    setContext(newContext || 'No context found');
    const newSuggestions = await getGeminiSuggestions(newPrompt, newAnswer);
    setSuggestions(newSuggestions);
    setIsLoading(false);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    addUserPrompt(prompt);
  };

  return (
    <div className="full-container">
      <header className="full-header">
        <button className="login-button" onClick={handleLoginClick}>
          Admin Login
        </button>
      </header>

      <div className="chat-sequence">
        {prompt && (
          <div className="prompt-section">
            <h2>Question</h2>
            <p>{prompt}</p>
          </div>
        )}

        {isTranscribing && (
          <div className="loading-section">
            <PulseLoader color="#36D7B7" />
          </div>
        )}

        {isLoading && (
          <div className="loading-section">
            <PulseLoader color="#36D7B7" />
          </div>
        )}

        {!isLoading && context && (
          <div className="context-section">
            <h2>Context</h2>
            <ContextCard context={context} />
          </div>
        )}

        {!isLoading && answer && (
          <div className="answer-section">
            <LLMAnswer answer={answer} />
            <button onClick={() => playTextToSpeech(answer)}>
              <FontAwesomeIcon icon={faVolumeUp} />
              Hear Answer
            </button>
          </div>
        )}

        {!isLoading && suggestions.length > 0 && (
          <div className="suggestions-section">
            <h2>Suggestions</h2>
            <ul>
              {suggestions.map((suggestion, index) => (
                <SuggestionItem
                  key={index}
                  suggestion={suggestion}
                  handleClick={() => addUserPrompt(suggestion)}
                />
              ))}
            </ul>
          </div>
        )}
      </div>

      <form className="prompt-form" onSubmit={handleFormSubmit}>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Type your question here..."
        />
        <button type="submit">Submit</button>
        <button type="button" onClick={handleMicClick} className="mic-button">
          {isRecording ? <FontAwesomeIcon icon={faMicrophoneSlash} /> : <FontAwesomeIcon icon={faMicrophone} />}
        </button>
      </form>

      <Modal
        isOpen={showLoginModal}
        onRequestClose={handleLoginClick}
        contentLabel="Admin Login"
        className="login-modal"
      >
        <Login onClose={handleLoginClick} />
      </Modal>
    </div>
  );
};

export default Full;
