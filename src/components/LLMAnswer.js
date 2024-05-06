import React from 'react';

const LLMAnswer = ({ answer }) => {
  return (
    <ul id="chatbox" className="chatbox">
       <p className="chat outgoing">{answer}</p>
</ul>
  );
};


export default LLMAnswer;
