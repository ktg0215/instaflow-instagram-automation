import React, { memo } from 'react';

interface EmojiPickerProps {
  emojis: string[];
  onEmojiSelect: (emoji: string) => void;
}

const EmojiPicker = memo(({ emojis, onEmojiSelect }: EmojiPickerProps) => {
  return (
    <div className="flex flex-wrap gap-2">
      {emojis.map((emoji, index) => (
        <button
          key={`${emoji}-${index}`}
          onClick={() => onEmojiSelect(emoji)}
          className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-md text-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
          type="button"
          aria-label={`絵文字: ${emoji}`}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
});

EmojiPicker.displayName = 'EmojiPicker';

export default EmojiPicker;