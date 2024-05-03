import React from 'react';

const LLMAnswer = ({ answer }) => {
  return (
    <ul id="chatbox" className="chatbox">
  <p className="chat outgoing">
       <p>{answer}</p>
  </p>
</ul>
  );
};


export default LLMAnswer;
