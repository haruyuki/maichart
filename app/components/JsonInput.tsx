'use client';

import React from 'react';

interface JsonInputProps {
  handleFileUpload: (file: File | undefined) => void;
  dragActive: boolean;
  setDragActive: (active: boolean) => void;
  error: string | null;
}

const JsonInput: React.FC<JsonInputProps> = ({
  handleFileUpload,
  dragActive,
  setDragActive,
  error,
}) => {
  return (
    <div className="maimai-panel mb-12">
      <h2 className="maimai-text-outline mb-4 text-2xl">📁 Upload Your Achievement Data</h2>
      <p className="mb-4 text-sm font-bold text-white">
        Get JSON Data from{' '}
        <a
          href="https://myjian.github.io/mai-tools/rating-calculator/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-yellow-300 underline hover:text-yellow-200"
        >
          mai-tools rating calculator
        </a>
        .<br />
        Select{' '}
        <span className="font-black text-yellow-300">
          Export as DXRating.net format (only b15 & b35)
        </span>{' '}
        and upload the file here.
      </p>

      {/* Maimai-style drag and drop area */}
      <div
        className={`maimai-dropzone ${dragActive ? 'active' : ''} relative mb-4 flex h-32 w-full cursor-pointer flex-col items-center justify-center`}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragActive(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragActive(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragActive(false);
          const file = e.dataTransfer.files[0];
          handleFileUpload(file);
        }}
      >
        <div className="text-center">
          <div className="mb-2 text-4xl">📁</div>
          <span className="maimai-text-outline text-xl">Drag & drop your JSON file here</span>
        </div>
        {dragActive && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="maimai-text-outline animate-bounce text-3xl">
              🎯 Release to upload!
            </span>
          </div>
        )}
      </div>

      {/* Separate file selection button */}
      <div className="text-center">
        <div className="mb-4 text-sm font-bold text-white">or</div>
        <input
          type="file"
          accept="application/json"
          className="hidden"
          id="file-upload"
          onChange={(e) => {
            const file = e.target.files?.[0];
            handleFileUpload(file);
          }}
        />
        <label htmlFor="file-upload" className="maimai-button inline-block">
          Browse File...
        </label>
      </div>

      {error && (
        <div className="mt-4 rounded-lg border-4 border-white bg-red-500 p-3">
          <p className="font-bold text-white">❌ Error: {error}</p>
        </div>
      )}
    </div>
  );
};

export default JsonInput;
