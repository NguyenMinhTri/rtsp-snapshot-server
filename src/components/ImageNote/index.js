import React from 'react';

const ImageNote = ({ imageUrl }) => {
  const handleImageClick = () => {
    // Open a new tab/window with the image URL
    if (imageUrl) {
      window.open(imageUrl, '_blank');
    }
  };

  return (
    <div>
      {/* Use the imageUrl prop for the src attribute */}
      <img
        src={imageUrl}
        alt="Clickable Image"
        width={250}
        onClick={handleImageClick}
        style={{ cursor: 'pointer' }}
      />
    </div>
  );
};

export default ImageNote;