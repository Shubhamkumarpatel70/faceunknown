import React, { useState, useEffect, useRef, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import API_BASE_URL from '../config/api';
import './VideoChat.css';

const VideoChat = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [socket, setSocket] = useState(null);
  const [matched, setMatched] = useState(false);
  const [connecting, setConnecting] = useState(true);
  const [partnerLeft, setPartnerLeft] = useState(false);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [micEnabled, setMicEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [countryFlag, setCountryFlag] = useState('🌍');
  const [isRestricted, setIsRestricted] = useState(false);
  const [restrictionTime, setRestrictionTime] = useState(0);
  const [partnerId, setPartnerId] = useState(null);
  const [partnerName, setPartnerName] = useState(null);
  const [reportSuccess, setReportSuccess] = useState('');
  const [reportError, setReportError] = useState('');
  const connectionTimeoutRef = useRef(null);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const socketRef = useRef(null);
  const localStreamRef = useRef(null);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  const servers = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  };

  // Scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Detect country flag based on timezone
  useEffect(() => {
    const getCountryFlag = () => {
      try {
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        
        // More specific mappings
        if (timezone.includes('New_York') || timezone.includes('Los_Angeles') || timezone.includes('Chicago') || timezone.includes('Denver')) return '🇺🇸';
        if (timezone.includes('London')) return '🇬🇧';
        if (timezone.includes('Paris') || timezone.includes('Berlin') || timezone.includes('Madrid') || timezone.includes('Rome')) return '🇪🇺';
        if (timezone.includes('Tokyo')) return '🇯🇵';
        if (timezone.includes('Mumbai') || timezone.includes('Delhi') || timezone.includes('Kolkata')) return '🇮🇳';
        if (timezone.includes('Sydney') || timezone.includes('Melbourne')) return '🇦🇺';
        if (timezone.includes('Toronto') || timezone.includes('Vancouver') || timezone.includes('Montreal')) return '🇨🇦';
        if (timezone.includes('Mexico')) return '🇲🇽';
        if (timezone.includes('Sao_Paulo') || timezone.includes('Rio')) return '🇧🇷';
        if (timezone.includes('Moscow')) return '🇷🇺';
        if (timezone.includes('Dubai')) return '🇦🇪';
        if (timezone.includes('Singapore')) return '🇸🇬';
        if (timezone.includes('Seoul')) return '🇰🇷';
        if (timezone.includes('Beijing') || timezone.includes('Shanghai') || timezone.includes('Hong_Kong')) return '🇨🇳';
        if (timezone.includes('Bangkok')) return '🇹🇭';
        if (timezone.includes('Jakarta')) return '🇮🇩';
        if (timezone.includes('Manila')) return '🇵🇭';
        if (timezone.includes('Cairo')) return '🇪🇬';
        if (timezone.includes('Johannesburg')) return '🇿🇦';
        if (timezone.includes('Istanbul')) return '🇹🇷';
        if (timezone.includes('Tel_Aviv')) return '🇮🇱';
        if (timezone.includes('Auckland')) return '🇳🇿';
        
        // General region mappings
        if (timezone.startsWith('America/')) return '🇺🇸';
        if (timezone.startsWith('Europe/')) return '🇪🇺';
        if (timezone.startsWith('Asia/')) return '🇦🇸';
        if (timezone.startsWith('Australia/')) return '🇦🇺';
        if (timezone.startsWith('Pacific/')) return '🇵🇬';
        
        return '🌍';
      } catch (error) {
        return '🌍';
      }
    };
    
    setCountryFlag(getCountryFlag());
  }, []);

  useEffect(() => {
    // Initialize socket connection
    const token = localStorage.getItem('token');
    // Use same domain in production, API_BASE_URL in development
    const socketUrl = process.env.NODE_ENV === 'production' 
      ? window.location.origin 
      : API_BASE_URL;
    const newSocket = io(socketUrl, {
      auth: { token }
    });

    socketRef.current = newSocket;
    
    // Set connection timeout - redirect to dashboard if no match in 10 seconds
    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current);
    }
    connectionTimeoutRef.current = setTimeout(() => {
      // Check if still connecting and not matched
      if (socketRef.current && !socketRef.current.partnerId) {
        console.log('No match found within 10 seconds, redirecting to dashboard...');
        if (socketRef.current) {
          socketRef.current.emit('leave');
          socketRef.current.disconnect();
        }
        if (localStreamRef.current) {
          localStreamRef.current.getTracks().forEach(track => track.stop());
        }
        navigate('/dashboard');
      }
    }, 10000); // 10 seconds
    setSocket(newSocket);

    // Get user media
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(stream => {
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        // Join chat
        newSocket.emit('join', { userId: user.id, token });

        // Socket event handlers
        newSocket.on('matched', handleMatched);
        newSocket.on('partner-skipped', handlePartnerSkipped);
        newSocket.on('partner-left', handlePartnerLeft);
        newSocket.on('offer', handleOffer);
        newSocket.on('answer', handleAnswer);
        newSocket.on('ice-candidate', handleIceCandidate);
        newSocket.on('chat-message', handleChatMessage);
        newSocket.on('restricted-word-detected', handleRestrictedWord);
        newSocket.on('partner-disconnected-restricted', handlePartnerDisconnectedRestricted);
        newSocket.on('user-restricted', handleUserRestricted);

        setConnecting(false);
      })
      .catch(error => {
        console.error('Error accessing media devices:', error);
        alert('Please allow camera and microphone access');
      });

    return () => {
      // Cleanup
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (remoteVideoRef.current?.srcObject) {
        remoteVideoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
      newSocket.close();
    };
  }, [user.id]);

  const createPeerConnection = () => {
    // Close existing connection if any
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    const pc = new RTCPeerConnection(servers);

    // Add local stream tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current);
      });
    }

    // Handle remote stream
    pc.ontrack = (event) => {
      console.log('Received remote track:', event.track.kind, event.streams);
      if (event.streams && event.streams.length > 0) {
        const remoteStream = event.streams[0];
        console.log('Setting remote stream:', remoteStream);
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStream;
          // Force video element to play
          remoteVideoRef.current.play().catch(err => {
            console.error('Error playing remote video:', err);
          });
        }
      } else if (event.track) {
        // Fallback: create a new stream from the track
        const remoteStream = new MediaStream([event.track]);
        console.log('Creating stream from track:', remoteStream);
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStream;
          remoteVideoRef.current.play().catch(err => {
            console.error('Error playing remote video:', err);
          });
        }
      }
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current && socketRef.current.partnerSocketId) {
        socketRef.current.emit('ice-candidate', {
          to: socketRef.current.partnerSocketId,
          candidate: event.candidate
        });
      }
    };

    // Handle connection state changes
    pc.onconnectionstatechange = () => {
      console.log('Connection state:', pc.connectionState);
      if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
        if (pc.connectionState === 'failed') {
          pc.restartIce();
        }
      }
    };

    peerConnectionRef.current = pc;
    return pc;
  };

  const handleMatched = async ({ partnerId, partnerSocketId, partnerName, isOfferer = true }) => {
    try {
      // Clear connection timeout since we found a match
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
        connectionTimeoutRef.current = null;
      }
      
      setMatched(true);
      setPartnerLeft(false);
      setConnecting(false);
      setMessages([]); // Reset chat when matched with new user
      setMessageInput('');
      setPartnerId(partnerId);
      
      // Fetch partner's name if not provided
      if (partnerName) {
        setPartnerName(partnerName);
      } else if (partnerId) {
        try {
          const response = await axios.get(`${API_BASE_URL}/api/users/${partnerId}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          });
          setPartnerName(response.data.name || response.data.username || 'Partner');
        } catch (error) {
          console.error('Error fetching partner name:', error);
          setPartnerName('Partner');
        }
      }

      // Store partner socket ID and partner ID
      socketRef.current.partnerSocketId = partnerSocketId;
      socketRef.current.partnerId = partnerId;

      const pc = createPeerConnection();

      // Add local tracks to peer connection
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => {
          console.log('Adding local track to peer connection:', track.kind);
          pc.addTrack(track, localStreamRef.current);
        });
      }

      // Only the offerer creates and sends the offer
      if (isOfferer && pc.signalingState === 'stable') {
        const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
        await pc.setLocalDescription(offer);

        socketRef.current.emit('offer', {
          to: partnerSocketId,
          offer: offer
        });
      }
    } catch (error) {
      console.error('Error in handleMatched:', error);
    }
  };

  const handleOffer = async ({ offer, from, partnerId: offerPartnerId }) => {
    try {
      if (peerConnectionRef.current && peerConnectionRef.current.signalingState !== 'stable') {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }

      const pc = peerConnectionRef.current || createPeerConnection();
      socketRef.current.partnerSocketId = from;
      // Try to get partnerId from offer data or from active connection
      if (offerPartnerId) {
        setPartnerId(offerPartnerId);
        socketRef.current.partnerId = offerPartnerId;
      } else {
        // Try to get partnerId from active connection
        const connection = activeConnections?.get?.(from);
        if (connection && connection.userId) {
          setPartnerId(connection.userId);
          socketRef.current.partnerId = connection.userId;
        }
      }

      if (pc.signalingState === 'stable') {
        await pc.setRemoteDescription(new RTCSessionDescription(offer));

        if (pc.pendingIceCandidates) {
          for (const candidate of pc.pendingIceCandidates) {
            try {
              await pc.addIceCandidate(candidate);
            } catch (err) {
              console.error('Error adding pending ICE candidate:', err);
            }
          }
          pc.pendingIceCandidates = [];
        }

        const answer = await pc.createAnswer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
        await pc.setLocalDescription(answer);

        socketRef.current.emit('answer', {
          to: from,
          answer: answer
        });
      }
    } catch (error) {
      console.error('Error in handleOffer:', error);
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
    }
  };

  const handleAnswer = async ({ answer, from }) => {
    try {
      if (peerConnectionRef.current) {
        const pc = peerConnectionRef.current;
        if (pc.signalingState === 'have-local-offer') {
          await pc.setRemoteDescription(new RTCSessionDescription(answer));
        }
      }
    } catch (error) {
      console.error('Error in handleAnswer:', error);
    }
  };

  const handleIceCandidate = async ({ candidate, from }) => {
    try {
      if (peerConnectionRef.current) {
        const pc = peerConnectionRef.current;
        if (pc.remoteDescription) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } else {
          if (!pc.pendingIceCandidates) {
            pc.pendingIceCandidates = [];
          }
          pc.pendingIceCandidates.push(new RTCIceCandidate(candidate));
        }
      }
    } catch (error) {
      console.error('Error in handleIceCandidate:', error);
    }
  };

  const handleChatMessage = ({ message, senderId, senderName, timestamp }) => {
    setMessages(prev => [...prev, { message, senderId, senderName, timestamp, isOwn: senderId === user.id }]);
  };

  const handlePartnerSkipped = () => {
    setMatched(false);
    setConnecting(true);
    setMessages([]); // Reset chat
    setMessageInput('');
    setPartnerId(null);
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (remoteVideoRef.current?.srcObject) {
      remoteVideoRef.current.srcObject.getTracks().forEach(track => track.stop());
      remoteVideoRef.current.srcObject = null;
    }
  };

  const handlePartnerLeft = () => {
    setPartnerLeft(true);
    setMatched(false);
    setMessages([]); // Reset chat
    setMessageInput('');
    setPartnerId(null);
    setPartnerName(null);
    if (socketRef.current) {
      socketRef.current.partnerId = null;
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (remoteVideoRef.current?.srcObject) {
      remoteVideoRef.current.srcObject.getTracks().forEach(track => track.stop());
      remoteVideoRef.current.srcObject = null;
    }
  };

  const handleReportUser = async () => {
    // Get partnerId from state or from socket ref
    const currentPartnerId = partnerId || socketRef.current?.partnerId;
    
    if (!currentPartnerId) {
      setReportError('No user to report. Please wait for a connection.');
      setTimeout(() => setReportError(''), 3000);
      return;
    }

    if (!window.confirm('Are you sure you want to report this user?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setReportError('Authentication required. Please login again.');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
        return;
      }

      const response = await axios.post(
        `${API_BASE_URL}/api/reports`,
        {
          reportedUserId: currentPartnerId.toString(),
          reason: 'Inappropriate behavior'
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      setReportSuccess(`User reported successfully. Total reports: ${response.data.reportCount || 1}`);
      setReportError('');
      setTimeout(() => {
        setReportSuccess('');
        handleSkip();
      }, 2000);
    } catch (error) {
      console.error('Report error:', error);
      let errorMessage = 'Failed to report user';
      
      if (error.response) {
        errorMessage = error.response.data?.message || error.response.statusText || errorMessage;
      } else if (error.request) {
        errorMessage = 'Network error. Please check your connection.';
      } else {
        errorMessage = error.message || errorMessage;
      }
      
      setReportError(errorMessage);
      setReportSuccess('');
      setTimeout(() => setReportError(''), 5000);
    }
  };

  const handleSkip = () => {
    if (socketRef.current) {
      socketRef.current.emit('skip');
    }
    setPartnerId(null);
    setPartnerName(null);
    if (socketRef.current) {
      socketRef.current.partnerId = null;
    }
    handlePartnerSkipped();
  };

  const handleLeave = async () => {
    // Clear connection timeout
    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current);
      connectionTimeoutRef.current = null;
    }
    
    if (socketRef.current) {
      socketRef.current.emit('leave');
    }
    navigate('/dashboard');
  };

  const handleRestrictedWord = ({ message }) => {
    alert(message);
    handleLeave();
  };

  const handlePartnerDisconnectedRestricted = ({ message }) => {
    setPartnerLeft(true);
    setMatched(false);
    setMessages([]);
    alert(message);
  };

  const handleUserRestricted = ({ message, remainingTime }) => {
    setIsRestricted(true);
    setRestrictionTime(remainingTime);
    // Store restriction in localStorage
    localStorage.setItem('userRestriction', JSON.stringify({
      restrictedUntil: Date.now() + (remainingTime * 1000)
    }));
    alert(message);
    navigate('/dashboard');
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (messageInput.trim() && socketRef.current && socketRef.current.partnerSocketId) {
      const messageData = {
        message: messageInput.trim(),
        to: socketRef.current.partnerSocketId,
        senderId: user.id,
        senderName: user.username,
        timestamp: new Date().toISOString()
      };

      socketRef.current.emit('chat-message', messageData);
      setMessageInput('');
    }
  };

  const toggleMic = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !micEnabled;
        setMicEnabled(!micEnabled);
      }
    }
  };

  const toggleCamera = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !cameraEnabled;
        setCameraEnabled(!cameraEnabled);
      }
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="video-chat-container">
      <div className="video-chat-header">
        <div className="header-brand">
          <h2 className="logo">FaceUnknown</h2>
          <span className="header-subtitle">Video Chat</span>
        </div>
        <div className="header-controls">
          {matched && !partnerLeft && partnerId && (
            <button
              onClick={handleReportUser}
              className="btn btn-danger btn-report"
              title="Report User"
            >
              ⚠️ Report
            </button>
          )}
          <button
            onClick={() => setShowChat(!showChat)}
            className={`btn ${showChat ? 'btn-secondary' : 'btn-primary'}`}
            title={showChat ? 'Hide Chat' : 'Show Chat'}
          >
            💬 {showChat ? 'Hide Chat' : 'Show Chat'}
          </button>
          <button onClick={handleLeave} className="btn btn-danger">
            Leave
          </button>
        </div>
      </div>

      <div className="video-chat-content">
        {connecting && !matched && (
          <div className="connecting-overlay">
            <div className="connecting-spinner"></div>
            <p>Looking for someone to chat with...</p>
          </div>
        )}

        {partnerLeft && (
          <div className="partner-left-message">
            <p>Your partner has left. You will be connected with another user shortly.</p>
          </div>
        )}

        {reportSuccess && (
          <div className="report-success-message">
            <p>{reportSuccess}</p>
          </div>
        )}

        {reportError && (
          <div className="report-error-message">
            <p>{reportError}</p>
          </div>
        )}

        <div className="video-chat-main">
          <div className="video-grid">
            <div className="video-wrapper local-video">
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="video-element"
              />
              <div className="video-label">{user?.name || user?.username || 'You'}</div>
              <div className="video-logo">
                <span className="logo logo-tiny">FaceUnknown</span>
              </div>
              {!cameraEnabled && (
                <div className="video-disabled-overlay">
                  <div className="disabled-icon">📷</div>
                  <span>Camera Off</span>
                </div>
              )}
              <div className="video-controls-overlay">
                <button
                  onClick={toggleMic}
                  className={`video-control-btn mic-btn ${micEnabled ? 'active' : 'inactive'}`}
                  title={micEnabled ? 'Mute' : 'Unmute'}
                >
                  {micEnabled ? '🎤' : '🔇'}
                </button>
                <button
                  onClick={toggleCamera}
                  className={`video-control-btn camera-btn ${cameraEnabled ? 'active' : 'inactive'}`}
                  title={cameraEnabled ? 'Turn Off Camera' : 'Turn On Camera'}
                >
                  {cameraEnabled ? '📷' : '📷'}
                </button>
              </div>
            </div>

            <div className="video-wrapper remote-video">
              {matched && !partnerLeft ? (
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="video-element"
                />
              ) : (
                <div className="video-placeholder">
                  <div className="placeholder-icon">👤</div>
                  <p>Waiting for partner...</p>
                </div>
              )}
              <div className="video-label">{partnerName || 'Partner'}</div>
              <div className="video-logo">
                <span className="logo logo-tiny">FaceUnknown</span>
              </div>
            </div>
          </div>

          {showChat && (
            <div className="chat-panel" ref={chatContainerRef}>
              <div className="chat-header">
                <div className="chat-header-content">
                  <h3>💬 Chat</h3>
                  <span className="chat-status">{matched && !partnerLeft ? 'Connected' : 'Waiting...'}</span>
                </div>
              </div>
              <div className="chat-messages" ref={chatContainerRef}>
                {messages.length === 0 ? (
                  <div className="no-messages">
                    <div className="no-messages-icon">💬</div>
                    <p>No messages yet.</p>
                    <p className="no-messages-hint">Start the conversation!</p>
                  </div>
                ) : (
                  messages.map((msg, index) => (
                    <div
                      key={index}
                      className={`chat-message ${msg.isOwn ? 'own-message' : 'partner-message'}`}
                    >
                      {!msg.isOwn && (
                        <div className="message-avatar">
                          {msg.senderName.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="message-content">
                        <div className="message-header">
                          <span className="message-sender">{msg.isOwn ? 'You' : msg.senderName}</span>
                          <span className="message-time">{formatTime(msg.timestamp)}</span>
                        </div>
                        <div className="message-text">{msg.message}</div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
              <form onSubmit={sendMessage} className="chat-input-form">
                <div className="chat-input-wrapper">
                  <input
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder={matched && !partnerLeft ? "Type a message..." : "Connect to start chatting..."}
                    className="chat-input"
                    disabled={!matched || partnerLeft}
                    maxLength={500}
                  />
                  <button
                    type="submit"
                    className="chat-send-btn"
                    disabled={!matched || partnerLeft || !messageInput.trim()}
                    title="Send message (Enter)"
                  >
                    <span className="send-icon">➤</span>
                  </button>
                </div>
                {messageInput.length > 0 && (
                  <div className="char-count">{messageInput.length}/500</div>
                )}
              </form>
            </div>
          )}
        </div>

        <div className="video-controls">
          <div className="control-group">
            <button
              onClick={toggleMic}
              className={`toggle-btn mic-toggle ${micEnabled ? 'enabled' : 'disabled'}`}
              title={micEnabled ? 'Mute Microphone' : 'Unmute Microphone'}
            >
              <span className="toggle-icon">{micEnabled ? '🎤' : '🔇'}</span>
              <span className="toggle-text">{micEnabled ? 'MIC ON' : 'MIC OFF'}</span>
            </button>
          </div>
          
          <div className="control-group">
            <button
              onClick={toggleCamera}
              className={`toggle-btn camera-toggle ${cameraEnabled ? 'enabled' : 'disabled'}`}
              title={cameraEnabled ? 'Turn Off Camera' : 'Turn On Camera'}
            >
              <span className="toggle-icon">📷</span>
              <span className="toggle-text">{cameraEnabled ? 'CAMERA ON' : 'CAMERA OFF'}</span>
            </button>
          </div>

          <div className="control-group">
            <button
              onClick={handleSkip}
              disabled={!matched || partnerLeft}
              className="btn btn-secondary action-btn"
            >
              <span className="btn-icon">⏭️</span>
              <span className="btn-text">SKIP</span>
            </button>
          </div>

          <div className="control-group">
            <button
              onClick={handleLeave}
              className="btn btn-danger action-btn"
            >
              <span className="btn-icon">🚪</span>
              <span className="btn-text">LEAVE</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoChat;
