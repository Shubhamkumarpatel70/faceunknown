# Setup Guide

## Quick Start

### 1. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the `backend` directory with the following content:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/omegle-clone
JWT_SECRET=your_jwt_secret_key_here_change_in_production
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

**Important**: Replace `your_jwt_secret_key_here_change_in_production` with a strong random string for security.

Start MongoDB (if running locally):
```bash
# On Windows (if MongoDB is installed as a service, it should start automatically)
# On Mac/Linux:
mongod
```

Start the backend server:
```bash
npm run dev
```

The backend will run on `http://localhost:5000`

### 2. Frontend Setup

Open a new terminal:

```bash
cd frontend
npm install
npm start
```

The frontend will run on `http://localhost:3000`

### 3. First Time Setup

1. Open `http://localhost:3000` in your browser
2. Register a new account
3. You'll be automatically logged in and redirected to the dashboard
4. Click "Start Chatting" to begin video chatting

## Creating Admin/Co-Admin Users

By default, all new users are created with the "user" role. To create an admin or co-admin user, you need to update the user in MongoDB:

### Using MongoDB Compass or MongoDB Shell:

```javascript
// Connect to MongoDB
use omegle-clone

// Update user role to admin
db.users.updateOne(
  { email: "admin@example.com" },
  { $set: { role: "admin" } }
)

// Update user role to co-admin
db.users.updateOne(
  { email: "coadmin@example.com" },
  { $set: { role: "co-admin" } }
)
```

## Troubleshooting

### MongoDB Connection Error
- Make sure MongoDB is running
- Check that the MONGODB_URI in `.env` is correct
- For MongoDB Atlas, use the connection string provided

### Video/Audio Not Working
- Make sure you've allowed camera and microphone permissions in your browser
- Check that your devices are not being used by another application
- Try refreshing the page

### Socket Connection Issues
- Make sure both backend and frontend are running
- Check that the FRONTEND_URL in backend `.env` matches your frontend URL
- Check browser console for any errors

### Port Already in Use
- Change the PORT in backend `.env` file
- Update the API URL in frontend if you change the backend port

## Production Deployment

For production deployment:

1. Set `NODE_ENV=production` in backend `.env`
2. Use a strong, unique `JWT_SECRET`
3. Use MongoDB Atlas or a managed MongoDB service
4. Set up proper STUN/TURN servers for WebRTC (Google's STUN servers are used by default, but you may need TURN servers for some network configurations)
5. Build the React app: `cd frontend && npm run build`
6. Serve the built files using a web server like Nginx or serve them from your Express server

