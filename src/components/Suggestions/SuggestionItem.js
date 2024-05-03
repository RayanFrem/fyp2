import React from 'react';
import './SuggestionItem.css';

const SuggestionItem = ({ suggestion, handleClick }) => {
  return (
    <p className="suggestion-item">
      <button onClick={handleClick}>{suggestion}</button>
    </p>
  );
};

export default SuggestionItem;
