import React from 'react';

// A lightweight React utility to split text into spans for animation
export function splitText(text, splitBy = 'char') {
  if (typeof text !== 'string') return text;

  if (splitBy === 'char') {
    return text.split('').map((char, index) => {
      // Preserve spaces
      if (char === ' ') return <span key={index} className="split-char-space">&nbsp;</span>;
      return (
        <span key={index} style={{ display: 'inline-block', overflow: 'hidden' }}>
          <span className="split-char" style={{ display: 'inline-block' }}>
            {char}
          </span>
        </span>
      );
    });
  }

  if (splitBy === 'word') {
    return text.split(' ').map((word, index) => (
      <span key={index} style={{ display: 'inline-block', overflow: 'hidden', marginRight: '0.25em' }}>
        <span className="split-word" style={{ display: 'inline-block' }}>
          {word}
        </span>
      </span>
    ));
  }

  return text;
}
