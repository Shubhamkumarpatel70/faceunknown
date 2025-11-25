# Omegle Clone - Video Chat Application

A full-stack MERN (MongoDB, Express, React, Node.js) application that allows users to video chat with random users online, similar to Omegle.

## Features

- 🎥 **Video Chat**: Real-time video communication using WebRTC
- ⏭️ **Skip Functionality**: Skip current partner and connect with another user
- 🚪 **Leave Button**: Leave chat and return to dashboard
- 👥 **User Management**: Login, Register, and Role-based access (Admin, Co-Admin, User)
- 🔄 **Auto-Reconnect**: When a user leaves, their partner automatically connects with another user
- 🎨 **Modern UI**: Beautiful design with the specified color scheme

## Color Scheme

- **Trust & Security**: Soft Blue (#4A90E2)
- **Excitement & Interaction**: Vibrant Purple (#7E57C2)
- **Call to Action**: Bright Orange (#FF6D00)
- **Background**: Dark Gray (#1E1E1E)
- **Text**: Pure White (#FFFFFF)
- **Video Frame Border**: Neon Blue (#00E5FF)

## Tech Stack

### Backend
- Node.js & Express
- MongoDB with Mongoose
- Socket.io for real-time communication
- JWT for authentication
- WebRTC signaling

### Frontend
- React
- React Router
- Socket.io Client
- Axios for API calls
- WebRTC for video streaming

## Installation

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or MongoDB Atlas)
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the backend directory:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/omegle-clone
JWT_SECRET=your_jwt_secret_key_here_change_in_production
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

4. Start the backend server:
```bash
npm run dev
```

The backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the React development server:
```bash
npm start
```

The frontend will run on `http://localhost:3000`

## Usage

1. **Register/Login**: Create an account or login with existing credentials
2. **Dashboard**: View online users and start chatting
3. **Video Chat**: Click "Start Chatting" to connect with a random user
4. **Skip**: Click the "Skip" button to connect with another user
5. **Leave**: Click the "Leave" button to return to the dashboard

## User Roles

- **User** (default): Standard user with chat access
- **Co-Admin**: Additional privileges (can view all users)
- **Admin**: Full access (can view all users)

## Project Structure

```
omegle-clone/
├── backend/
│   ├── models/
│   │   └── User.js
│   ├── routes/
│   │   ├── auth.js
│   │   └── users.js
│   ├── middleware/
│   │   └── auth.js
│   ├── socket/
│   │   └── socketHandler.js
│   ├── server.js
│   └── package.json
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── App.js
│   │   └── index.js
│   └── package.json
└── README.md
```

## Notes

- Make sure MongoDB is running before starting the backend
- For production, use a proper STUN/TURN server for WebRTC
- Update the JWT_SECRET in production
- The default role for new users is "user"
- Admin and Co-Admin roles must be set manually in the database

## License

MIT

