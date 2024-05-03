import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperPlane, faMicrophone, faStop } from '@fortawesome/free-solid-svg-icons';
import './footer.css';

function Footer({ handleFormSubmit, handleMicClick, recording }) {
  const [prompt, setPrompt] = useState(''); 

  return (
    <div className="footer">
    <form onSubmit={handleFormSubmit}>
      <div className="textprompt">
        <div className="chat-input">
          <textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Type your message here..." spellCheck="false"
            required
          />
          <button className="icon" type="submit">
            <FontAwesomeIcon icon={faPaperPlane} />
          </button>
          <button className="icon" onClick={handleMicClick}>
            {recording ? (
              <FontAwesomeIcon icon={faStop} />
            ) : (
              <FontAwesomeIcon icon={faMicrophone} />
            )}
          </button>
        </div>
      </div>
    </form>
  </div>
  );
}

export default Footer;
