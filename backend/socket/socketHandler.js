const User = require('../models/User');
const RestrictedWord = require('../models/RestrictedWord');

// Store waiting users and active connections
const waitingQueue = [];
const activeConnections = new Map(); // socketId -> { userId, partnerId, partnerSocketId }
const restrictedUsers = new Map(); // userId -> { restrictedUntil: timestamp }

const handleSocketConnection = (io) => {
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Handle user joining
    socket.on('join', async ({ userId, token }) => {
      try {
        // Check if user is restricted
        const userIdStr = userId.toString();
        const restriction = restrictedUsers.get(userIdStr);
        if (restriction && restriction.restrictedUntil > Date.now()) {
          const remainingTime = Math.ceil((restriction.restrictedUntil - Date.now()) / 1000);
          socket.emit('user-restricted', {
            message: `You are restricted from chatting for ${remainingTime} more seconds due to using restricted words.`,
            remainingTime
          });
          // Don't update online status or join queue if restricted
          return;
        }
        
        // Update user online status
        await User.findByIdAndUpdate(userId, {
          isOnline: true,
          socketId: socket.id
        });

        socket.userId = userId;
        socket.join('users');

        // Try to match with waiting user
        matchUsers(socket, io);
      } catch (error) {
        console.error('Join error:', error);
      }
    });

    // Handle WebRTC signaling
    socket.on('offer', (data) => {
      const connection = activeConnections.get(socket.id);
      const partnerId = connection ? connection.partnerId : null;
      socket.to(data.to).emit('offer', {
        offer: data.offer,
        from: socket.id,
        partnerId: partnerId
      });
    });

    socket.on('answer', (data) => {
      socket.to(data.to).emit('answer', {
        answer: data.answer,
        from: socket.id
      });
    });

    socket.on('ice-candidate', (data) => {
      socket.to(data.to).emit('ice-candidate', {
        candidate: data.candidate,
        from: socket.id
      });
    });

    // Handle skip
    socket.on('skip', () => {
      handleSkip(socket, io);
    });

    // Handle leave
    socket.on('leave', async () => {
      await handleLeave(socket, io);
    });

    // Handle chat messages
    socket.on('chat-message', async (data) => {
      const { to, message, senderId, senderName, timestamp } = data;
      
      // Check for restricted words
      const containsRestrictedWord = await checkRestrictedWords(message);
      
      if (containsRestrictedWord) {
        // Disconnect user immediately
        socket.emit('restricted-word-detected', {
          message: 'You used a restricted word. You have been disconnected and restricted for 10 seconds.'
        });
        
        // Disconnect partner
        const partnerSocket = io.sockets.sockets.get(to);
        if (partnerSocket) {
          partnerSocket.emit('partner-disconnected-restricted', {
            message: 'Your partner was disconnected for using restricted words.'
          });
          handleSkip(partnerSocket, io);
        }
        
        // Disconnect current user
        handleSkip(socket, io);
        
        // Restrict user for 10 seconds
        const userIdStr = senderId.toString();
        restrictedUsers.set(userIdStr, {
          restrictedUntil: Date.now() + 10000 // 10 seconds
        });
        
        // Remove restriction after 10 seconds
        setTimeout(() => {
          restrictedUsers.delete(userIdStr);
        }, 10000);
        
        return;
      }
      
      // Send to partner
      socket.to(to).emit('chat-message', {
        message,
        senderId,
        senderName,
        timestamp
      });
      // Also send back to sender for confirmation
      socket.emit('chat-message', {
        message,
        senderId,
        senderName,
        timestamp
      });
    });

    // Handle disconnect
    socket.on('disconnect', async () => {
      await handleDisconnect(socket, io);
    });
  });
};

const matchUsers = async (socket, io) => {
  // If there's a waiting user, match them
  if (waitingQueue.length > 0 && waitingQueue[0] !== socket.id) {
    const partnerSocketId = waitingQueue.shift();
    const partnerSocket = io.sockets.sockets.get(partnerSocketId);

    if (partnerSocket && partnerSocket.userId) {
      // Fetch user details for both users
      const User = require('../models/User');
      let partnerName = 'Partner';
      let userName = 'User';
      
      try {
        const partnerUser = await User.findById(partnerSocket.userId).select('name username');
        if (partnerUser) {
          partnerName = partnerUser.name || partnerUser.username || 'Partner';
        }
        const currentUser = await User.findById(socket.userId).select('name username');
        if (currentUser) {
          userName = currentUser.name || currentUser.username || 'User';
        }
      } catch (error) {
        console.error('Error fetching user names:', error);
      }

      // Create connection
      activeConnections.set(socket.id, {
        userId: socket.userId,
        partnerId: partnerSocket.userId,
        partnerSocketId: partnerSocketId
      });
      activeConnections.set(partnerSocketId, {
        userId: partnerSocket.userId,
        partnerId: socket.userId,
        partnerSocketId: socket.id
      });

      // Store partner socket ID on socket object
      socket.partnerSocketId = partnerSocketId;
      partnerSocket.partnerSocketId = socket.id;

      // Determine who should be the offerer (user with lower socket ID)
      // This prevents both users from creating offers simultaneously
      const isOfferer = socket.id < partnerSocketId;

      // Notify both users, with offerer flag and partner name
      socket.emit('matched', { 
        partnerId: partnerSocket.userId, 
        partnerSocketId: partnerSocketId,
        partnerName: partnerName,
        isOfferer: isOfferer
      });
      partnerSocket.emit('matched', { 
        partnerId: socket.userId, 
        partnerSocketId: socket.id,
        partnerName: userName,
        isOfferer: !isOfferer
      });
    } else {
      // Partner disconnected, add to queue
      waitingQueue.push(socket.id);
    }
  } else {
    // No waiting user, add to queue
    if (!waitingQueue.includes(socket.id)) {
      waitingQueue.push(socket.id);
    }
  }
};

const handleSkip = (socket, io) => {
  const connection = activeConnections.get(socket.id);
  
  if (connection) {
    const partnerSocket = io.sockets.sockets.get(connection.partnerSocketId);
    
    // Remove connection
    activeConnections.delete(socket.id);
    if (partnerSocket) {
      activeConnections.delete(connection.partnerSocketId);
      partnerSocket.emit('partner-skipped');
      // Try to match partner with someone else
      setTimeout(() => matchUsers(partnerSocket, io), 100);
    }

    // Try to match current user with someone else
    setTimeout(() => matchUsers(socket, io), 100);
  }
};

const handleLeave = async (socket, io) => {
  const connection = activeConnections.get(socket.id);
  
  if (connection) {
    const partnerSocket = io.sockets.sockets.get(connection.partnerSocketId);
    
    // Remove connection
    activeConnections.delete(socket.id);
    if (partnerSocket) {
      activeConnections.delete(connection.partnerSocketId);
      partnerSocket.emit('partner-left');
      // Try to match partner with someone else
      setTimeout(() => matchUsers(partnerSocket, io), 100);
    }
  }

  // Remove from waiting queue
  const index = waitingQueue.indexOf(socket.id);
  if (index > -1) {
    waitingQueue.splice(index, 1);
  }

  // Update user online status
  if (socket.userId) {
    await User.findByIdAndUpdate(socket.userId, {
      isOnline: false,
      socketId: null
    });
  }
};

const handleDisconnect = async (socket, io) => {
  await handleLeave(socket, io);
  console.log('User disconnected:', socket.id);
};

// Check if message contains restricted words
const checkRestrictedWords = async (message) => {
  try {
    const restrictedWords = await RestrictedWord.find();
    const messageLower = message.toLowerCase();
    
    for (const restrictedWord of restrictedWords) {
      // Check if the word appears in the message (as whole word or part of word)
      if (messageLower.includes(restrictedWord.word)) {
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error('Error checking restricted words:', error);
    return false;
  }
};

module.exports = { handleSocketConnection };

