'use client';

import React, { useState } from 'react';
import { Copy, Download, Check } from 'lucide-react';

const RecoveryCodeDisplay = ({ codes }) => {
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);
  
  // Handle copy to clipboard
  const handleCopy = () => {
    const codesText = codes.join('\n');
    navigator.clipboard.writeText(codesText)
      .then(() => {
        setCopiedToClipboard(true);
        setTimeout(() => setCopiedToClipboard(false), 2000);
      })
      .catch((err) => {
        console.error('Failed to copy codes to clipboard:', err);
      });
  };
  
  // Handle download as txt file
  const handleDownload = () => {
    const codesText = codes.join('\n');
    const blob = new Blob([codesText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'esportsbets-recovery-codes.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  return (
    <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
      <div className="flex justify-between items-center mb-4">
        <h4 className="font-medium text-gray-900">Recovery Codes</h4>
        <div className="flex space-x-2">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center px-2 py-1 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            {copiedToClipboard ? (
              <>
                <Check className="h-3 w-3 mr-1 text-green-500" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-3 w-3 mr-1" />
                Copy
              </>
            )}
          </button>
          <button
            type="button"
            onClick={handleDownload}
            className="inline-flex items-center px-2 py-1 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <Download className="h-3 w-3 mr-1" />
            Download
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {codes.map((code, index) => (
          <div 
            key={index}
            className="font-mono text-sm bg-white p-2 rounded border border-gray-200 text-center select-all"
          >
            {code}
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecoveryCodeDisplay;