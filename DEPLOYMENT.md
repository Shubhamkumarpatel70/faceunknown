# Deployment Guide for FaceUnknown on Render

## Prerequisites
1. GitHub account with the repository: https://github.com/Shubhamkumarpatel70/faceunknown.git
2. Render account (sign up at https://render.com)
3. MongoDB Atlas account (or any MongoDB database)

## Step 1: Set up MongoDB Database

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Create a database user
4. Whitelist your IP (or use 0.0.0.0/0 for Render)
5. Get your connection string (MONGODB_URI)

## Step 2: Deploy Backend on Render

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository: `Shubhamkumarpatel70/faceunknown`
4. Configure the service:
   - **Name**: `faceunknown-backend`
   - **Environment**: `Node`
   - **Region**: Choose closest to you
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Plan**: Free (or choose paid for better performance)

5. Add Environment Variables:
   - `NODE_ENV` = `production`
   - `PORT` = `5000`
   - `MONGODB_URI` = Your MongoDB connection string
   - `JWT_SECRET` = A random secret string (generate one)
   - `CORS_ORIGIN` = Your frontend URL (update after deploying frontend)

6. Click **"Create Web Service"**
7. Wait for deployment to complete
8. Copy the service URL (e.g., `https://faceunknown-backend.onrender.com`)

## Step 3: Deploy Frontend on Render

1. In Render Dashboard, click **"New +"** → **"Static Site"**
2. Connect your GitHub repository: `Shubhamkumarpatel70/faceunknown`
3. Configure the service:
   - **Name**: `faceunknown-frontend`
   - **Branch**: `main`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `build`
   - **Plan**: Free

4. Add Environment Variable:
   - `REACT_APP_API_URL` = Your backend URL (e.g., `https://faceunknown-backend.onrender.com`)

5. Click **"Create Static Site"**
6. Wait for deployment to complete

## Step 4: Update Backend CORS

1. Go back to your backend service on Render
2. Update the `CORS_ORIGIN` environment variable to your frontend URL
3. Save and redeploy

## Step 5: Update Frontend API URLs

The frontend code uses `http://localhost:5000` for API calls. You need to update these to use the environment variable.

### Files to Update:
- `frontend/src/pages/Login.js`
- `frontend/src/pages/Register.js`
- `frontend/src/pages/Dashboard.js`
- `frontend/src/pages/VideoChat.js`
- `frontend/src/pages/ProfileCompletion.js`
- `frontend/src/components/ManageUsers.js`
- `frontend/src/components/Statistics.js`
- `frontend/src/components/RestrictedWords.js`
- `frontend/src/components/ReportedUsers.js`
- `frontend/src/components/ReportsRemovalRequest.js`
- `frontend/src/context/AuthContext.js`

Replace all instances of:
```javascript
'http://localhost:5000'
```

With:
```javascript
process.env.REACT_APP_API_URL || 'http://localhost:5000'
```

## Step 6: Update Socket.IO Connection

In `frontend/src/pages/VideoChat.js`, update the socket connection:

```javascript
const newSocket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000', {
  // ... existing options
});
```

## Step 7: Commit and Push Changes

After updating the API URLs, commit and push:

```bash
git add .
git commit -m "Update API URLs for production deployment"
git push origin main
```

Render will automatically redeploy your services.

## Step 8: Verify Deployment

1. Visit your frontend URL
2. Test registration and login
3. Test video chat functionality
4. Check backend logs in Render dashboard for any errors

## Troubleshooting

### Backend Issues:
- Check MongoDB connection string is correct
- Verify all environment variables are set
- Check Render logs for errors

### Frontend Issues:
- Verify `REACT_APP_API_URL` is set correctly
- Check browser console for CORS errors
- Ensure backend CORS_ORIGIN includes frontend URL

### Socket.IO Issues:
- Ensure WebSocket connections are allowed on Render
- Check that both services are using HTTPS

## Notes:
- Free tier services on Render spin down after 15 minutes of inactivity
- First request after spin-down may take 30-60 seconds
- Consider upgrading to paid plan for better performance
- MongoDB Atlas free tier has limitations (512MB storage)

## Support
For issues, check:
- Render documentation: https://render.com/docs
- MongoDB Atlas documentation: https://docs.atlas.mongodb.com

