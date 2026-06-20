import React from 'react';
import Avatar from 'react-avatar';

interface ClientProps {
  username: string;
}

/**
 * 👤 Presentation Component: Renders online cluster participants cleanly
 */
export const Client: React.FC<ClientProps> = ({ username }) => {
  return (
    <div className="flex flex-col items-center gap-1.5 p-2 bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/50 rounded-xl transition-all hover:scale-105">
      {/* 🚀 FIXED: Passed numeric scale as a direct string token to satisfy strict library types */}
      <Avatar 
        name={username} 
        size="45" 
        round="10px" 
        className="shadow-sm font-bold"
      />
      <span className="text-xs font-medium max-w-[65px] truncate text-slate-600 dark:text-slate-400">
        {username}
      </span>
    </div>
  );
};

export default Client;