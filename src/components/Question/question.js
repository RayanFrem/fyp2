import React from 'react';

const Question = ({ prompt, showPrompt }) => {
  if (!showPrompt) {
    return null; 
  }

  return (
      <p>{prompt}</p>
  );
};

export default Question;
