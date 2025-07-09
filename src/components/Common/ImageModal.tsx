import React from 'react';
import { X } from 'lucide-react';

interface ImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  toolName: string;
}

const ImageModal: React.FC<ImageModalProps> = ({ isOpen, onClose, imageUrl, toolName }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75"
      onClick={onClose}
    >
      <div
        className="max-w-4xl w-full p-4 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={imageUrl}
          alt={toolName}
          className="w-full max-h-[90vh] object-contain rounded-lg shadow-lg bg-white"
        />
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-white bg-black bg-opacity-50 hover:bg-opacity-70 rounded-full p-2 transition-all"
        >
          <X size={24} />
        </button>
        <div className="absolute bottom-6 left-6 right-6 text-center">
          <div className="bg-black bg-opacity-50 text-white px-4 py-2 rounded-lg inline-block">
            <h3 className="font-semibold">{toolName}</h3>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageModal;