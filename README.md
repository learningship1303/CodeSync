# CodeSync - Real-time Collaborative Code Editor

## Project Overview
CodeSync is a real-time collaborative code editor built with React frontend and Node.js backend, featuring WebSocket support for real-time collaboration.

## Project Structure

```
CodeSync/
├── client/                           # React frontend
│   ├── src/
│   │   ├── components/              # React components
│   │   ├── pages/                   # Page components
│   │   ├── App.js
│   │   └── index.js
│   ├── public/
│   ├── package.json
│   ├── .env                         # Client environment variables
│   └── .gitignore
├── server/                           # Node.js backend
│   ├── src/
│   │   ├── config/                  # Configuration files
│   │   │   ├── constants.js         # App constants
│   │   │   └── database.js          # MongoDB connection
│   │   ├── middleware/              # Express middleware
│   │   │   ├── auth.js              # JWT authentication
│   │   │   └── errorHandler.js      # Error handling
│   │   ├── models/                  # Mongoose schemas
│   │   │   └── User.js              # User model
│   │   ├── routes/                  # API routes
│   │   │   └── health.js            # Health check
│   │   └── services/                # Business logic
│   │       └── userService.js       # User service
│   ├── index.js                     # Server entry point
│   ├── package.json
│   ├── .env                         # Server environment variables
│   ├── .env.example                 # Environment template
│   └── .gitignore
├── .gitignore                       # Root gitignore
└── README.md                        # This file
```

## Environment Setup

### Prerequisites
- Node.js v22.16.0 or higher
- NPM v11.5.2 or higher
- MongoDB (local or Atlas connection)

### Installation

1. **Install Client Dependencies**
   ```bash
   cd client
   npm install
   ```

2. **Install Server Dependencies**
   ```bash
   cd server
   npm install
   ```

### Configuration

1. **Server Environment Variables** (server/.env)
   ```env
   MONGODB_URI=mongodb://localhost:27017/codesync
   JWT_SECRET=your_jwt_secret_key_change_this_in_production
   PORT=5000
   NODE_ENV=development
   CORS_ORIGIN=http://localhost:3000
   ```

2. **Client Environment Variables** (optional, client/.env)
   - Configure API endpoint if different from default

## Running the Application

### Development Mode

**Terminal 1 - Start Backend Server:**
```bash
cd server
npm run dev
```
The server will start on `http://localhost:5000` with auto-reload via nodemon.

**Terminal 2 - Start Frontend Development Server:**
```bash
cd client
npm start
```
The client will start on `http://localhost:3000`.

### Production Build

**Build Frontend:**
```bash
cd client
npm run build
```
Creates optimized production build in `client/build/`

**Run Production Server:**
```bash
cd server
npm start
```

## Installed Dependencies

### Client (React Frontend)
- **react** (19.2.6) - UI library
- **react-router-dom** (7.15.0) - Routing
- **socket.io-client** (4.8.3) - WebSocket client
- **monaco-editor** (0.52.2) - Code editor
- **axios** (1.16.1) - HTTP client
- **simple-peer** (9.11.1) - WebRTC
- **typescript** (5.9.3) - Type safety
- **react-hot-toast** (2.6.0) - Notifications
- **lucide-react** (1.16.0) - Icons

### Server (Node.js Backend)
- **express** (5.2.1) - API framework
- **socket.io** (4.8.3) - WebSocket server
- **mongoose** (8.24.0) - MongoDB ODM
- **jsonwebtoken** (9.0.3) - JWT auth
- **bcryptjs** (2.4.3) - Password hashing
- **dotenv** (17.4.2) - Environment variables
- **cors** (2.8.6) - CORS support
- **helmet** (7.2.0) - Security headers
- **nodemon** (3.1.14) - Dev auto-reload

## API Endpoints

### Health Check
- `GET /api/health` - Server status check

### Authentication (To be implemented in Phase 2)
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh` - Refresh JWT token

## WebSocket Events (To be implemented)
- `connect` - Client connects
- `disconnect` - Client disconnects
- `code-update` - Code content changes
- `cursor-move` - Cursor position updates
- `user-joined` - New user joins session
- `user-left` - User leaves session

## Project Status

### Phase 1: ✅ COMPLETE
- [x] Project structure setup
- [x] React frontend initialized
- [x] Node.js backend initialized
- [x] All dependencies installed
- [x] Environment configuration
- [x] Basic middleware and models created

### Phase 2: TODO (Auth Implementation)
- [ ] User registration endpoint
- [ ] User login endpoint
- [ ] JWT token generation and verification
- [ ] Password hashing with bcryptjs
- [ ] Auth middleware integration
- [ ] Frontend auth forms and pages

### Phase 3: TODO (Real-time Collaboration)
- [ ] WebSocket connection setup
- [ ] Code synchronization logic
- [ ] Cursor position tracking
- [ ] User presence management
- [ ] Conflict resolution

### Phase 4: TODO (Code Editor)
- [ ] Monaco Editor integration
- [ ] Syntax highlighting
- [ ] Language selection
- [ ] Theme management
- [ ] File operations

## Scripts

### Client Scripts
```bash
npm start      # Start development server
npm build      # Create production build
npm test       # Run tests
npm eject      # Eject from Create React App (irreversible)
```

### Server Scripts
```bash
npm start      # Start production server
npm run dev    # Start with auto-reload (nodemon)
npm test       # Run tests
```

## Development Notes

### Code Style
- ESLint configured for client
- Consistent formatting with Prettier (recommended)
- TypeScript support for type safety

### Database
- MongoDB required for production
- Local MongoDB: `mongodb://localhost:27017/codesync`
- MongoDB Atlas: Update MONGODB_URI in .env

### Security
- JWT tokens for authentication
- Bcryptjs for password hashing
- Helmet for HTTP headers security
- CORS configured for localhost:3000

## Troubleshooting

### Port Already in Use
If port 5000 (server) or 3000 (client) is already in use:
- **Server**: Change PORT in server/.env
- **Client**: Set PORT=3001 before running `npm start`

### MongoDB Connection Error
- Ensure MongoDB is running locally or update MONGODB_URI with remote connection
- Check credentials if using MongoDB Atlas

### Dependencies Installation Issues
```bash
# Clear npm cache
npm cache clean --force

# Reinstall dependencies
rm package-lock.json
npm install
```

## Next Steps

1. Start with Phase 2: Authentication implementation
2. Set up MongoDB connection and test User model
3. Implement JWT-based authentication
4. Create frontend auth forms and pages
5. Test login/registration flows

## Resources

- [React Documentation](https://react.dev)
- [Express Documentation](https://expressjs.com)
- [Socket.IO Documentation](https://socket.io/docs)
- [MongoDB Documentation](https://docs.mongodb.com)
- [JWT.io](https://jwt.io)

## License

ISC

---

**Created**: Phase 1 Project Setup
**Status**: Ready for Phase 2 - Authentication Implementation
