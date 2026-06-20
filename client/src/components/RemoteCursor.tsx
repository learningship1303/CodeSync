import React from 'react';

export interface RemoteCursorProps {
  username: string;
  position: {
    x: number;
    y: number;
    line?: number;
    column?: number;
  };
  color: string;
  isVisible: boolean;
}

const RemoteCursor: React.FC<RemoteCursorProps> = ({
  username,
  position,
  color,
  isVisible,
}) => {
  if (!isVisible) return null;

  return (
    <div
      className="absolute pointer-events-none z-50 transition-all duration-75"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
    >
      {/* Cursor line */}
      <div
        className="w-0.5 h-6 animate-pulse"
        style={{
          backgroundColor: color,
          boxShadow: `0 0 4px ${color}`,
        }}
      />

      {/* Username label */}
      <div
        className="px-2 py-1 rounded text-xs font-semibold text-white whitespace-nowrap"
        style={{
          backgroundColor: color,
          marginTop: '2px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
        }}
      >
        {username}

        {position.line && position.column && (
          <span className="ml-1 opacity-75">
            {position.line}:{position.column}
          </span>
        )}
      </div>
    </div>
  );
};

export default RemoteCursor;
