export const SOCKET_EVENTS = {
  JOIN_REQUEST: 'join-request',     // User entering room credentials
  JOIN_APPROVED: 'join-approved',   // Admin clicked accept button
  JOINED: 'joined',                 // User officially entered the room canvas
  CODE_CHANGE: 'code-change',       // Live typing code stream
  CURSOR_MOVE: 'cursor-move',       // Live cursor position track
  USER_DISCONNECTED: 'user-disconnected', // User left the room channel
  LEAVE_ROOM: 'leave-room'          // Explicit manual exit event
};