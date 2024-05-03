import React, { useState } from 'react';

const ContextCard = ({ context, incoming }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const characterLimit = 300;

  // Toggle between truncated and full text
  const toggleText = () => {
    setIsExpanded(!isExpanded);
  };

  // Truncate text with ellipsis if exceeding limit
  const truncatedText =
    context.length > characterLimit
      ? context.substring(0, characterLimit) + '...'
      : context;

  return (
    <ul className="chatbox" style={{ padding: 0, listStyleType: 'none' }}>
      <li className={`chat ${incoming ? 'incoming' : 'outgoing'}`} style={{ padding: '10px 0' }}>
        <p>
          {isExpanded ? context : truncatedText}
          {context.length > characterLimit && (
            <span
              onClick={toggleText}
              style={{
                color: 'blue',
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              {isExpanded ? ' Read less' : ' Read more'}
            </span>
          )}
        </p>
      </li>
    </ul>
  );
};

export default ContextCard;
