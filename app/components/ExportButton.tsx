'use client';

import React from 'react';

interface ExportButtonProps {
  onClick: () => void;
}

const ExportButton: React.FC<ExportButtonProps> = ({ onClick }) => {
  return (
    <div className="mt-8">
      <button className="maimai-button" onClick={onClick}>
        📸 Export Image
      </button>
    </div>
  );
};

export default ExportButton;
