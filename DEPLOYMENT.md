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

## Step 2: Deploy on Render (Single Service)

Since both frontend and backend are deployed together, you only need to create ONE service:

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository: `Shubhamkumarpatel70/faceunknown`
4. Configure the service:
   - **Name**: `faceunknown`
   - **Environment**: `Node`
   - **Region**: Choose closest to you
   - **Branch**: `main`
   - **Root Directory**: Leave empty (root)
   - **Build Command**: `npm run install-all && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Free (or choose paid for better performance)

5. Add Environment Variables:
   - `NODE_ENV` = `production`
   - `PORT` = `5000` (or leave default)
   - `MONGODB_URI` = Your MongoDB connection string
   - `JWT_SECRET` = A random secret string (generate one)
   - `CORS_ORIGIN` = Your Render service URL (update after deployment)

6. Click **"Create Web Service"**
7. Wait for deployment to complete
8. Copy the service URL (e.g., `https://faceunknown.onrender.com`)

## Step 3: Update Environment Variables

After deployment, update the `CORS_ORIGIN` environment variable to match your Render service URL:
- Go to your service settings
- Update `CORS_ORIGIN` to your service URL
- Save and redeploy

## Step 4: Verify Deployment

1. Visit your Render service URL
2. Test registration and login
3. Test video chat functionality
4. Check Render logs for any errors

## How It Works

- **Build Process**: 
  - Installs dependencies for root, backend, and frontend
  - Builds the React frontend
  - Backend is ready to serve

- **Runtime**:
  - Backend serves API routes at `/api/*`
  - Backend serves React build files for all other routes
  - Socket.IO handles WebRTC signaling

## Troubleshooting

### Build Issues:
- Check that all dependencies are listed in package.json files
- Verify build command completes successfully
- Check Render build logs for errors

### Runtime Issues:
- Check MongoDB connection string is correct
- Verify all environment variables are set
- Check Render logs for errors
- Ensure PORT is set correctly (Render sets this automatically)

### Socket.IO Issues:
- Ensure WebSocket connections are allowed on Render
- Check CORS_ORIGIN includes your service URL
- Verify Socket.IO is properly configured

## Notes:
- Free tier services on Render spin down after 15 minutes of inactivity
- First request after spin-down may take 30-60 seconds
- Consider upgrading to paid plan for better performance
- MongoDB Atlas free tier has limitations (512MB storage)
- All API calls should use the same domain (no CORS issues)

## Support
For issues, check:
- Render documentation: https://render.com/docs
- MongoDB Atlas documentation: https://docs.atlas.mongodb.com
