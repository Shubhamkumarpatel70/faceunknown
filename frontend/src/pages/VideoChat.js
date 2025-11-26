import React, { useState, useEffect, useRef, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import API_BASE_URL from '../config/api';
import { FaMicrophone, FaMicrophoneSlash, FaVideo, FaVideoSlash, FaForward, FaDoorOpen, FaExclamationTriangle, FaComments, FaUser, FaPaperPlane } from 'react-icons/fa';

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
  const [partnerCountryFlag, setPartnerCountryFlag] = useState('🌍');
  const [partnerCountry, setPartnerCountry] = useState('');
  const [partnerCameraEnabled, setPartnerCameraEnabled] = useState(true);
  const [partnerMicEnabled, setPartnerMicEnabled] = useState(true);

  // Function to convert country name to flag emoji
  const getCountryFlag = (countryName) => {
    if (!countryName || countryName.trim() === '') return '🌍';
    
    // Normalize country name: trim and convert to title case for matching
    const normalized = countryName.trim();
    
    const countryFlags = {
      // A
      'Afghanistan': '🇦🇫', 'Albania': '🇦🇱', 'Algeria': '🇩🇿', 'Argentina': '🇦🇷',
      'Australia': '🇦🇺', 'Austria': '🇦🇹',
      // B
      'Bangladesh': '🇧🇩', 'Belgium': '🇧🇪', 'Brazil': '🇧🇷', 'Bulgaria': '🇧🇬',
      // C
      'Canada': '🇨🇦', 'China': '🇨🇳', 'Colombia': '🇨🇴', 'Croatia': '🇭🇷', 'Czech Republic': '🇨🇿',
      // D
      'Denmark': '🇩🇰',
      // E
      'Egypt': '🇪🇬', 'Estonia': '🇪🇪',
      // F
      'Finland': '🇫🇮', 'France': '🇫🇷',
      // G
      'Germany': '🇩🇪', 'Greece': '🇬🇷',
      // H
      'Hungary': '🇭🇺',
      // I
      'India': '🇮🇳', 'Indonesia': '🇮🇩', 'Iran': '🇮🇷', 'Iraq': '🇮🇶', 'Ireland': '🇮🇪', 'Israel': '🇮🇱',
      'Italy': '🇮🇹',
      // J
      'Japan': '🇯🇵',
      // K
      'Kenya': '🇰🇪', 'Korea': '🇰🇷',
      // M
      'Malaysia': '🇲🇾', 'Mexico': '🇲🇽',
      // N
      'Netherlands': '🇳🇱', 'New Zealand': '🇳🇿', 'Nigeria': '🇳🇬', 'Norway': '🇳🇴',
      // P
      'Pakistan': '🇵🇰', 'Philippines': '🇵🇭', 'Poland': '🇵🇱', 'Portugal': '🇵🇹',
      // R
      'Romania': '🇷🇴', 'Russia': '🇷🇺',
      // S
      'Saudi Arabia': '🇸🇦', 'Singapore': '🇸🇬', 'South Africa': '🇿🇦', 'South Korea': '🇰🇷',
      'Spain': '🇪🇸', 'Sweden': '🇸🇪', 'Switzerland': '🇨🇭',
      // T
      'Thailand': '🇹🇭', 'Turkey': '🇹🇷',
      // U
      'Ukraine': '🇺🇦', 'United Arab Emirates': '🇦🇪', 'United Kingdom': '🇬🇧',
      'United States': '🇺🇸', 'United States of America': '🇺🇸',
      // V
      'Vietnam': '🇻🇳',
      // Common variations
      'USA': '🇺🇸', 'US': '🇺🇸', 'UK': '🇬🇧', 'UAE': '🇦🇪',
      'America': '🇺🇸', 'American': '🇺🇸'
    };
    
    // Try exact match first
    if (countryFlags[normalized]) {
      return countryFlags[normalized];
    }
    
    // Try case-insensitive match
    const normalizedLower = normalized.toLowerCase();
    for (const [key, flag] of Object.entries(countryFlags)) {
      if (key.toLowerCase() === normalizedLower) {
        return flag;
      }
    }
    
    // Try partial match (e.g., "United States of America" matches "United States")
    for (const [key, flag] of Object.entries(countryFlags)) {
      if (normalizedLower.includes(key.toLowerCase()) || key.toLowerCase().includes(normalizedLower)) {
        return flag;
      }
    }
    
    // If no match found, return globe
    console.log('Country flag not found for:', normalized);
    return '🌍';
  };
  const [isRestricted, setIsRestricted] = useState(false);
  const [restrictionTime, setRestrictionTime] = useState(0);
  const [partnerId, setPartnerId] = useState(null);
  const [partnerName, setPartnerName] = useState(null);
  const [reportSuccess, setReportSuccess] = useState('');
  const [reportError, setReportError] = useState('');
  const [showTimeoutModal, setShowTimeoutModal] = useState(false);
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

  // Set country flag based on user's country from database
  useEffect(() => {
    if (user?.country) {
      setCountryFlag(getCountryFlag(user.country));
    } else {
      setCountryFlag('🌍');
    }
  }, [user?.country]);
        
  // Monitor partner's camera and mic status
  useEffect(() => {
    if (!matched || partnerLeft) {
      setPartnerCameraEnabled(true);
      setPartnerMicEnabled(true);
      return;
    }

    const checkPartnerStatus = () => {
      if (!remoteVideoRef.current?.srcObject) {
        // If no stream yet, assume enabled (will update when stream arrives)
        return;
      }
      
      const remoteStream = remoteVideoRef.current.srcObject;
      const videoTracks = remoteStream.getVideoTracks();
      const audioTracks = remoteStream.getAudioTracks();
      
      // Check if tracks exist and are enabled
      const cameraStatus = videoTracks.length > 0 ? videoTracks[0].enabled : false;
      const micStatus = audioTracks.length > 0 ? audioTracks[0].enabled : false;
      
      setPartnerCameraEnabled(cameraStatus);
      setPartnerMicEnabled(micStatus);
    };
        
    // Check immediately
    checkPartnerStatus();

    // Check periodically to catch any changes
    const interval = setInterval(checkPartnerStatus, 500);
        
    return () => {
      clearInterval(interval);
    };
  }, [matched, partnerLeft]);

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
    
    // Set connection timeout - show modal if no match in 10 seconds
    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current);
    }
    connectionTimeoutRef.current = setTimeout(() => {
      // Check if still connecting and not matched
      if (socketRef.current && !socketRef.current.partnerId && !matched) {
        console.log('No match found within 10 seconds, showing modal...');
        setShowTimeoutModal(true);
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
        newSocket.on('partner-camera-status', ({ enabled }) => {
          setPartnerCameraEnabled(enabled);
        });
        newSocket.on('partner-mic-status', ({ enabled }) => {
          setPartnerMicEnabled(enabled);
        });

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

    // Add local stream tracks with current enabled state
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        // Ensure track state matches current mic/camera state
        if (track.kind === 'audio') {
          track.enabled = micEnabled;
        } else if (track.kind === 'video') {
          track.enabled = cameraEnabled;
        }
        pc.addTrack(track, localStreamRef.current);
      });
    }

    // Handle remote stream
    pc.ontrack = (event) => {
      console.log('Received remote track:', event.track.kind, event.streams);
      
      // Get or create remote stream
      let remoteStream = null;
      if (event.streams && event.streams.length > 0) {
        remoteStream = event.streams[0];
      } else if (event.track) {
        // Fallback: create a new stream from the track
        remoteStream = new MediaStream([event.track]);
      }
      
      if (remoteStream && remoteVideoRef.current) {
        // If we already have a stream, add the new track to it
        if (remoteVideoRef.current.srcObject) {
          const existingStream = remoteVideoRef.current.srcObject;
          // Check if track already exists
          const trackExists = existingStream.getTracks().some(t => 
            t.id === event.track.id && t.kind === event.track.kind
          );
          if (!trackExists) {
            existingStream.addTrack(event.track);
            console.log('Added track to existing stream:', event.track.kind);
          }
        } else {
          // Set new stream
          remoteVideoRef.current.srcObject = remoteStream;
          console.log('Setting new remote stream:', remoteStream);
        }
        
        // Ensure audio is enabled and not muted
        remoteVideoRef.current.muted = false;
        remoteVideoRef.current.volume = 1.0;
        
        // Force video element to play
        remoteVideoRef.current.play().catch(err => {
          console.error('Error playing remote video:', err);
        });
        
        // Log audio tracks
        const audioTracks = remoteStream.getAudioTracks();
        console.log('Remote audio tracks:', audioTracks.length);
        audioTracks.forEach(track => {
          console.log('Audio track:', track.id, 'enabled:', track.enabled, 'muted:', track.muted);
        });
        
        // Check partner's camera and mic status immediately
        const videoTracks = remoteStream.getVideoTracks();
        const partnerCameraStatus = videoTracks.length > 0 ? videoTracks[0].enabled : false;
        const partnerMicStatus = audioTracks.length > 0 ? audioTracks[0].enabled : false;
        
        console.log('Partner status - Camera:', partnerCameraStatus, 'Mic:', partnerMicStatus);
        setPartnerCameraEnabled(partnerCameraStatus);
        setPartnerMicEnabled(partnerMicStatus);
        
        // Also check after a short delay to ensure tracks are fully initialized
        setTimeout(() => {
          const videoTracks = remoteStream.getVideoTracks();
          const audioTracks = remoteStream.getAudioTracks();
          const cameraStatus = videoTracks.length > 0 ? videoTracks[0].enabled : false;
          const micStatus = audioTracks.length > 0 ? audioTracks[0].enabled : false;
          setPartnerCameraEnabled(cameraStatus);
          setPartnerMicEnabled(micStatus);
        }, 500);
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
      
      // Close modal if open
      setShowTimeoutModal(false);
      
      setMatched(true);
      setPartnerLeft(false);
      setConnecting(false);
      setMessages([]); // Reset chat when matched with new user
      setMessageInput('');
      setPartnerId(partnerId);
      // Reset partner status - will be updated when stream is received
      setPartnerCameraEnabled(true);
      setPartnerMicEnabled(true);
      
      // Set partner name if provided
      if (partnerName) {
        setPartnerName(partnerName);
      }
      
      // Always fetch partner data (including country) if we have partnerId
      if (partnerId) {
        try {
          const response = await axios.get(`${API_BASE_URL}/api/users/${partnerId}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          });
          // Update name if not already set
          if (!partnerName) {
          setPartnerName(response.data.name || response.data.username || 'Partner');
          }
          // Set partner country and flag
          if (response.data.country) {
            setPartnerCountry(response.data.country);
            setPartnerCountryFlag(getCountryFlag(response.data.country));
          } else {
            setPartnerCountry('');
            setPartnerCountryFlag('🌍');
          }
        } catch (error) {
          console.error('Error fetching partner data:', error);
          if (!partnerName) {
          setPartnerName('Partner');
          }
          setPartnerCountry('');
          setPartnerCountryFlag('🌍');
        }
      }

      // Store partner socket ID and partner ID
      socketRef.current.partnerSocketId = partnerSocketId;
      socketRef.current.partnerId = partnerId;

      const pc = createPeerConnection();
      // Note: createPeerConnection() already adds local tracks, so no need to add them again

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
      let currentPartnerId = null;
      if (offerPartnerId) {
        currentPartnerId = offerPartnerId;
        setPartnerId(offerPartnerId);
        socketRef.current.partnerId = offerPartnerId;
      } else {
        // Try to get partnerId from active connection
        const connection = activeConnections?.get?.(from);
        if (connection && connection.userId) {
          currentPartnerId = connection.userId;
          setPartnerId(connection.userId);
          socketRef.current.partnerId = connection.userId;
        }
      }
      
      // Fetch partner country if we have partnerId
      if (currentPartnerId) {
        try {
          const response = await axios.get(`${API_BASE_URL}/api/users/${currentPartnerId}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          });
          if (response.data.country) {
            setPartnerCountry(response.data.country);
            setPartnerCountryFlag(getCountryFlag(response.data.country));
          }
          if (response.data.name || response.data.username) {
            setPartnerName(response.data.name || response.data.username || 'Partner');
          }
        } catch (error) {
          console.error('Error fetching partner data in handleOffer:', error);
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
    setPartnerName(null);
    setPartnerCountry('');
    setPartnerCountryFlag('🌍');
    setPartnerCameraEnabled(true);
    setPartnerMicEnabled(true);
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
    setPartnerCountry('');
    setPartnerCountryFlag('🌍');
    setPartnerCameraEnabled(true);
    setPartnerMicEnabled(true);
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
    setPartnerCountry('');
    setPartnerCountryFlag('🌍');
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
    
    setShowTimeoutModal(false);
    
    if (socketRef.current) {
      socketRef.current.emit('leave');
      socketRef.current.disconnect();
    }
    
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    
    navigate('/dashboard');
  };

  const handleStay = () => {
    setShowTimeoutModal(false);
    // Reset timeout to search again
    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current);
    }
    connectionTimeoutRef.current = setTimeout(() => {
      if (socketRef.current && !socketRef.current.partnerId && !matched) {
        setShowTimeoutModal(true);
      }
    }, 10000);
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
        const newStatus = !micEnabled;
        // Disable/enable the audio track - this will stop/start audio transmission
        audioTrack.enabled = newStatus;
        
        // Also update the peer connection tracks if it exists
        if (peerConnectionRef.current) {
          const senders = peerConnectionRef.current.getSenders();
          senders.forEach(sender => {
            if (sender.track && sender.track.kind === 'audio') {
              sender.track.enabled = newStatus;
            }
          });
        }
        
        setMicEnabled(newStatus);
        
        // Notify partner about mic status change
        if (socketRef.current && socketRef.current.partnerSocketId) {
          socketRef.current.emit('mic-status-change', {
            to: socketRef.current.partnerSocketId,
            enabled: newStatus
          });
        }
      }
    }
  };

  const toggleCamera = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        const newStatus = !cameraEnabled;
        videoTrack.enabled = newStatus;
        setCameraEnabled(newStatus);
        
        // Notify partner about camera status change
        if (socketRef.current && socketRef.current.partnerSocketId) {
          socketRef.current.emit('camera-status-change', {
            to: socketRef.current.partnerSocketId,
            enabled: newStatus
          });
        }
      }
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-primary flex flex-col relative overflow-hidden">
      <div className="bg-secondary/90 backdrop-blur-xl py-3 px-3 sm:py-4 md:py-5 lg:py-6 sm:px-4 md:px-8 lg:px-12 xl:px-16 flex flex-col sm:flex-row justify-between items-center border-b-2 border-text/30 shadow-xl relative z-10 gap-3 sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-2.5 md:gap-3 w-full sm:w-auto">
          <div className="flex flex-col gap-0.5 sm:gap-1 md:gap-1.5 w-full sm:w-auto text-center sm:text-left">
            <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl font-extrabold text-accent1 m-0 tracking-tight">FaceUnknown</h2>
            <span className="text-[8px] sm:text-[9px] md:text-[10px] lg:text-xs text-text/60 font-semibold tracking-widest uppercase">Video Chat</span>
        </div>
        </div>
        <div className="flex gap-1.5 sm:gap-2 md:gap-2.5 lg:gap-3 items-center flex-wrap justify-center sm:justify-end w-full sm:w-auto">
          {matched && !partnerLeft && partnerId && (
            <button
              onClick={handleReportUser}
              className="px-2.5 py-1.5 sm:px-3 sm:py-2 md:px-4 md:py-2.5 lg:px-5 lg:py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-primary border-none rounded-lg sm:rounded-xl text-[9px] sm:text-[10px] md:text-xs lg:text-sm font-semibold cursor-pointer transition-all duration-300 uppercase tracking-wide shadow-md hover:shadow-lg hover:-translate-y-0.5 active:scale-95 flex items-center gap-1 sm:gap-1.5"
              title="Report User"
            >
              <FaExclamationTriangle className="text-[10px] sm:text-xs md:text-sm lg:text-base" /> 
              <span className="hidden sm:inline">Report</span>
            </button>
          )}
          <button
            onClick={() => setShowChat(!showChat)}
            className={`px-2.5 py-1.5 sm:px-3 sm:py-2 md:px-4 md:py-2.5 lg:px-5 lg:py-3 rounded-lg sm:rounded-xl text-[9px] sm:text-[10px] md:text-xs lg:text-sm font-semibold cursor-pointer transition-all duration-300 uppercase tracking-wide border-none flex items-center gap-1 sm:gap-1.5 shadow-md hover:shadow-lg hover:-translate-y-0.5 active:scale-95 ${
              showChat 
                ? 'bg-gradient-to-r from-accent2 to-accent2/90 hover:from-accent2/90 hover:to-accent2 text-primary' 
                : 'bg-gradient-to-r from-accent1 to-accent1/90 hover:from-accent1/90 hover:to-accent1 text-primary'
            }`}
            title={showChat ? 'Hide Chat' : 'Show Chat'}
          >
            <FaComments className="text-[10px] sm:text-xs md:text-sm lg:text-base" /> 
            <span className="hidden sm:inline">{showChat ? 'Hide Chat' : 'Show Chat'}</span>
            <span className="sm:hidden">Chat</span>
          </button>
          <button 
            onClick={handleLeave} 
            className="px-2.5 py-1.5 sm:px-3 sm:py-2 md:px-4 md:py-2.5 lg:px-5 lg:py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-primary border-none rounded-lg sm:rounded-xl text-[9px] sm:text-[10px] md:text-xs lg:text-sm font-semibold cursor-pointer transition-all duration-300 uppercase tracking-wide shadow-md hover:shadow-lg hover:-translate-y-0.5 active:scale-95"
          >
            Leave
          </button>
        </div>
      </div>

      <div className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8 xl:p-12 flex flex-col items-center justify-center relative z-[1] overflow-hidden">
        {connecting && !matched && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center z-10 bg-secondary/95 backdrop-blur-xl p-4 sm:p-5 md:p-6 lg:p-8 xl:p-10 rounded-2xl sm:rounded-3xl border-2 border-accent1 shadow-2xl max-w-[90%] sm:max-w-none">
            <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 xl:w-20 xl:h-20 border-[3px] border-accent1/20 border-t-accent1 border-r-accent2 rounded-full animate-spin mx-auto shadow-lg"></div>
            <p className="text-text text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl mt-3 sm:mt-4 lg:mt-5 font-medium px-2">Looking for someone to chat with...</p>
          </div>
        )}

        {partnerLeft && (
          <div className="absolute top-3 sm:top-5 md:top-6 left-1/2 transform -translate-x-1/2 bg-accent1 text-primary px-3 py-2 sm:px-6 sm:py-3 md:px-8 md:py-4 rounded-lg sm:rounded-xl z-10 text-center border border-accent1/50 shadow-lg animate-[slideDown_0.3s_ease] max-w-[95%] sm:max-w-md md:max-w-lg lg:max-w-xl mx-2">
            <p className="text-[10px] sm:text-xs md:text-sm lg:text-base leading-relaxed">Your partner has left. You will be connected with another user shortly.</p>
          </div>
        )}

        {reportSuccess && (
          <div className="absolute top-3 sm:top-5 md:top-6 left-1/2 transform -translate-x-1/2 bg-accent2 text-primary px-3 py-2 sm:px-6 sm:py-3 md:px-8 md:py-4 rounded-lg sm:rounded-xl z-10 text-center border border-accent2/50 shadow-lg animate-[slideDown_0.3s_ease] max-w-[95%] sm:max-w-md md:max-w-lg lg:max-w-xl mx-2">
            <p className="text-[10px] sm:text-xs md:text-sm lg:text-base leading-relaxed">{reportSuccess}</p>
          </div>
        )}

        {reportError && (
          <div className="absolute top-3 sm:top-5 md:top-6 left-1/2 transform -translate-x-1/2 bg-red-500 text-primary px-3 py-2 sm:px-6 sm:py-3 md:px-8 md:py-4 rounded-lg sm:rounded-xl z-10 text-center border border-red-500/50 shadow-lg animate-[slideDown_0.3s_ease] max-w-[95%] sm:max-w-md md:max-w-lg lg:max-w-xl mx-2">
            <p className="text-[10px] sm:text-xs md:text-sm lg:text-base leading-relaxed">{reportError}</p>
          </div>
        )}

        {/* Timeout Modal */}
        {showTimeoutModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4 md:p-6">
            <div className="bg-primary rounded-xl sm:rounded-2xl md:rounded-3xl shadow-2xl p-3 sm:p-4 md:p-5 lg:p-6 max-w-md md:max-w-lg w-full border-2 border-text/20 animate-[slideDown_0.3s_ease] mx-2">
              <div className="text-center mb-3 sm:mb-4 md:mb-5">
                <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 bg-accent1/20 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3">
                  <FaExclamationTriangle className="text-xl sm:text-2xl md:text-3xl lg:text-4xl text-accent1" />
                </div>
                <h3 className="text-sm sm:text-base md:text-lg lg:text-xl font-semibold text-text mb-1 sm:mb-1.5 md:mb-2">No Match Found</h3>
                <p className="text-[10px] sm:text-xs md:text-sm lg:text-base text-text/70 px-2 leading-relaxed">We couldn't find someone to chat with. Would you like to stay and keep searching, or leave?</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-2.5 md:gap-3">
                <button
                  onClick={handleStay}
                  className="flex-1 px-3 py-2 sm:px-4 sm:py-2.5 md:px-5 md:py-3 bg-accent1 hover:bg-accent1/90 text-primary rounded-lg sm:rounded-xl text-[10px] sm:text-xs md:text-sm font-semibold transition-all duration-300 uppercase tracking-wide shadow-md hover:shadow-lg hover:-translate-y-0.5 active:scale-95"
                >
                  Stay
                </button>
                <button
                  onClick={handleLeave}
                  className="flex-1 px-3 py-2 sm:px-4 sm:py-2.5 md:px-5 md:py-3 bg-red-500 hover:bg-red-600 text-primary rounded-lg sm:rounded-xl text-[10px] sm:text-xs md:text-sm font-semibold transition-all duration-300 uppercase tracking-wide shadow-md hover:shadow-lg hover:-translate-y-0.5 active:scale-95"
                >
                  Leave
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-4 sm:gap-5 md:gap-6 lg:gap-8 xl:gap-10 w-full max-w-[1400px] 2xl:max-w-[1600px] items-start mx-auto">
          <div className="flex-1 w-full relative">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-3 md:gap-4 lg:gap-5 xl:gap-6 w-full max-w-[1200px] 2xl:max-w-[1400px] mx-auto">
              {/* Local Video */}
              <div className="relative bg-gradient-to-br from-secondary/70 to-secondary/50 backdrop-blur-lg rounded-2xl sm:rounded-3xl md:rounded-[1.5rem] lg:rounded-[2rem] overflow-hidden border-2 md:border-[3px] border-text/40 shadow-2xl aspect-video min-h-[160px] sm:min-h-[180px] md:min-h-[200px] lg:min-h-[240px] xl:min-h-[280px] 2xl:min-h-[320px] transition-all duration-300 hover:border-accent1/50 hover:shadow-[0_20px_60px_rgba(0,0,0,0.3)] md:hover:scale-[1.01]">
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
                  style={{ 
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    display: cameraEnabled ? 'block' : 'none',
                    zIndex: 0
                  }}
                />
                {/* User Country Flag with Name - Top Left */}
                <div className="absolute top-2 left-2 sm:top-3 sm:left-3 md:top-4 md:left-4 lg:top-5 lg:left-5 xl:top-6 xl:left-6 flex items-center gap-1 sm:gap-1.5 md:gap-2 bg-secondary/80 backdrop-blur-md rounded-md sm:rounded-lg md:rounded-xl px-1.5 py-1 sm:px-2 sm:py-1.5 md:px-2.5 md:py-2 border-2 border-text/30 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-110 cursor-default z-[3]" title={user?.country || 'Country'}>
                  <span className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl">{countryFlag}</span>
                  {user?.country && (
                    <span className="text-[8px] sm:text-[9px] md:text-[10px] lg:text-xs xl:text-sm font-semibold text-text/90 truncate max-w-[60px] sm:max-w-[80px] md:max-w-[100px] lg:max-w-[120px]">{user.country}</span>
                  )}
                </div>
                <div className="absolute bottom-2 left-2 sm:bottom-3 sm:left-3 md:bottom-4 md:left-4 lg:bottom-5 lg:left-5 xl:bottom-6 xl:left-6 bg-gradient-to-r from-accent1 to-accent1/90 text-primary px-2 py-1 sm:px-2.5 sm:py-1.5 md:px-3 md:py-2 lg:px-4 lg:py-2.5 xl:px-5 xl:py-3 rounded-md sm:rounded-lg md:rounded-xl lg:rounded-2xl text-[9px] sm:text-[10px] md:text-xs lg:text-sm xl:text-base font-bold z-[2] shadow-lg uppercase tracking-wide border border-primary/20">
                {user?.name || user?.username || 'You'}
              </div>
                <div className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3 md:bottom-4 md:right-4 lg:bottom-5 lg:right-5 xl:bottom-6 xl:right-6 bg-secondary/95 backdrop-blur-lg px-2 py-0.5 sm:px-2.5 sm:py-1 md:px-3 md:py-1.5 lg:px-3.5 lg:py-2 xl:px-4 xl:py-2.5 rounded-md sm:rounded-lg md:rounded-xl lg:rounded-2xl border-2 border-text/40 z-[2] shadow-md">
                  <span className="text-[8px] sm:text-[9px] md:text-[10px] lg:text-xs xl:text-sm font-bold bg-gradient-to-r from-accent1 via-accent2 to-accent1 bg-clip-text text-transparent">FaceUnknown</span>
              </div>
              {!cameraEnabled && (
                  <div className="absolute inset-0 bg-text/95 backdrop-blur-md flex flex-col items-center justify-center z-[1] rounded-xl sm:rounded-2xl md:rounded-3xl lg:rounded-[2rem] gap-1.5 sm:gap-2 md:gap-3 lg:gap-4">
                    <FaVideoSlash className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl opacity-80 text-primary" />
                    <span className="text-primary text-[10px] sm:text-xs md:text-sm lg:text-base xl:text-lg font-semibold bg-red-500 px-2.5 py-1 sm:px-3 sm:py-1.5 md:px-4 md:py-2 lg:px-5 lg:py-2.5 rounded-md sm:rounded-lg md:rounded-xl lg:rounded-2xl shadow-md">Camera Off</span>
                </div>
              )}
                <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 md:top-2.5 md:right-2.5 lg:top-3 lg:right-3 xl:top-3.5 xl:right-3.5 flex gap-1.5 sm:gap-2 md:gap-2.5 lg:gap-3 z-[3]">
                <button
                  onClick={toggleMic}
                    className={`w-6 h-6 sm:w-7 sm:h-7 md:w-9 md:h-9 lg:w-11 lg:h-11 xl:w-12 xl:h-12 rounded-full border-2 bg-secondary/90 backdrop-blur-lg text-primary text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl cursor-pointer flex items-center justify-center transition-all duration-300 shadow-md hover:scale-110 lg:hover:scale-125 ${
                    micEnabled 
                        ? 'border-accent2 bg-accent2/20 text-accent2 shadow-[0_0_15px_rgba(16,185,129,0.4)] lg:shadow-[0_0_25px_rgba(16,185,129,0.6)]' 
                        : 'border-red-500 bg-red-500/20 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)] lg:shadow-[0_0_25px_rgba(239,68,68,0.6)]'
                  }`}
                  title={micEnabled ? 'Mute' : 'Unmute'}
                >
                    {micEnabled ? <FaMicrophone /> : <FaMicrophoneSlash />}
                </button>
                <button
                  onClick={toggleCamera}
                    className={`w-6 h-6 sm:w-7 sm:h-7 md:w-9 md:h-9 lg:w-11 lg:h-11 xl:w-12 xl:h-12 rounded-full border-2 bg-secondary/90 backdrop-blur-lg text-primary text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl cursor-pointer flex items-center justify-center transition-all duration-300 shadow-md hover:scale-110 lg:hover:scale-125 ${
                    cameraEnabled 
                        ? 'border-accent1 bg-accent1/20 text-accent1 shadow-[0_0_15px_rgba(245,158,11,0.4)] lg:shadow-[0_0_25px_rgba(245,158,11,0.6)]' 
                        : 'border-red-500 bg-red-500/20 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)] lg:shadow-[0_0_25px_rgba(239,68,68,0.6)]'
                  }`}
                  title={cameraEnabled ? 'Turn Off Camera' : 'Turn On Camera'}
                >
                    {cameraEnabled ? <FaVideo /> : <FaVideoSlash />}
                </button>
              </div>
            </div>

              {/* Remote Video */}
              <div className="relative bg-gradient-to-br from-secondary/70 to-secondary/50 backdrop-blur-lg rounded-2xl sm:rounded-3xl md:rounded-[1.5rem] lg:rounded-[2rem] overflow-hidden border-2 md:border-[3px] border-text/40 shadow-2xl aspect-video min-h-[160px] sm:min-h-[180px] md:min-h-[200px] lg:min-h-[240px] xl:min-h-[280px] 2xl:min-h-[320px] transition-all duration-300 hover:border-accent1/50 hover:shadow-[0_20px_60px_rgba(0,0,0,0.3)] md:hover:scale-[1.01]">
              {matched && !partnerLeft ? (
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  muted={false}
                  volume={1.0}
                  className="w-full h-full object-cover"
                    style={{ 
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      display: partnerCameraEnabled ? 'block' : 'none',
                      zIndex: 0
                    }}
                />
              ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-secondary/80 to-secondary/60 text-text/70 absolute inset-0 z-0">
                    <FaUser className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl mb-2 sm:mb-3 md:mb-4 lg:mb-5 opacity-60" />
                    <p className="text-[10px] sm:text-xs md:text-sm lg:text-base xl:text-lg">Waiting for partner...</p>
                </div>
              )}
                {/* Partner Country Flag with Name - Top Left */}
                {matched && !partnerLeft && (
                  <div className="absolute top-2 left-2 sm:top-3 sm:left-3 md:top-4 md:left-4 lg:top-5 lg:left-5 xl:top-6 xl:left-6 flex items-center gap-1 sm:gap-1.5 md:gap-2 bg-secondary/80 backdrop-blur-md rounded-md sm:rounded-lg md:rounded-xl px-1.5 py-1 sm:px-2 sm:py-1.5 md:px-2.5 md:py-2 border-2 border-text/30 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-110 cursor-default z-[3]" title={partnerCountry || 'Partner Country'}>
                    <span className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl">{partnerCountryFlag}</span>
                    {partnerCountry && (
                      <span className="text-[8px] sm:text-[9px] md:text-[10px] lg:text-xs xl:text-sm font-semibold text-text/90 truncate max-w-[60px] sm:max-w-[80px] md:max-w-[100px] lg:max-w-[120px]">{partnerCountry}</span>
                    )}
                  </div>
                )}
                {/* Partner Camera Off Message */}
                {matched && !partnerLeft && !partnerCameraEnabled && (
                  <div className="absolute inset-0 bg-text/95 backdrop-blur-md flex flex-col items-center justify-center z-[1] rounded-xl sm:rounded-2xl md:rounded-3xl lg:rounded-[2rem] gap-1.5 sm:gap-2 md:gap-3 lg:gap-4">
                    <FaVideoSlash className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl opacity-80 text-primary" />
                    <span className="text-primary text-[10px] sm:text-xs md:text-sm lg:text-base xl:text-lg font-semibold bg-red-500 px-2.5 py-1 sm:px-3 sm:py-1.5 md:px-4 md:py-2 lg:px-5 lg:py-2.5 rounded-md sm:rounded-lg md:rounded-xl lg:rounded-2xl shadow-md">Your partner camera off</span>
                  </div>
                )}
                {/* Partner Mic Muted Message */}
                {matched && !partnerLeft && !partnerMicEnabled && (
                  <div className="absolute top-12 left-2 sm:top-14 sm:left-3 md:top-16 md:left-4 lg:top-20 lg:left-5 xl:top-24 xl:left-6 bg-red-500/90 backdrop-blur-md text-primary px-2 py-1 sm:px-2.5 sm:py-1.5 md:px-3 md:py-2 lg:px-4 lg:py-2.5 rounded-md sm:rounded-lg md:rounded-xl lg:rounded-2xl z-[3] shadow-lg border-2 border-red-600/50">
                    <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2">
                      <FaMicrophoneSlash className="text-[10px] sm:text-xs md:text-sm lg:text-base xl:text-lg" />
                      <span className="text-[9px] sm:text-[10px] md:text-xs lg:text-sm xl:text-base font-semibold">Mic muted</span>
                    </div>
                  </div>
                )}
                <div className="absolute bottom-2 left-2 sm:bottom-3 sm:left-3 md:bottom-4 md:left-4 lg:bottom-5 lg:left-5 xl:bottom-6 xl:left-6 bg-gradient-to-r from-accent1 to-accent1/90 text-primary px-2 py-1 sm:px-2.5 sm:py-1.5 md:px-3 md:py-2 lg:px-4 lg:py-2.5 xl:px-5 xl:py-3 rounded-md sm:rounded-lg md:rounded-xl lg:rounded-2xl text-[9px] sm:text-[10px] md:text-xs lg:text-sm xl:text-base font-bold z-[2] shadow-lg uppercase tracking-wide border border-primary/20">
                {partnerName || 'Partner'}
              </div>
                <div className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3 md:bottom-4 md:right-4 lg:bottom-5 lg:right-5 xl:bottom-6 xl:right-6 bg-secondary/95 backdrop-blur-lg px-2 py-0.5 sm:px-2.5 sm:py-1 md:px-3 md:py-1.5 lg:px-3.5 lg:py-2 xl:px-4 xl:py-2.5 rounded-md sm:rounded-lg md:rounded-xl lg:rounded-2xl border-2 border-text/40 z-[2] shadow-md">
                  <span className="text-[8px] sm:text-[9px] md:text-[10px] lg:text-xs xl:text-sm font-bold bg-gradient-to-r from-accent1 via-accent2 to-accent1 bg-clip-text text-transparent">FaceUnknown</span>
              </div>
            </div>

            </div>
            {/* Skip Button - Centered between cameras for ALL screen sizes */}
            {matched && !partnerLeft && (
              <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[4] pointer-events-none">
                <div className="pointer-events-auto">
                  <button
                    onClick={handleSkip}
                    className={`
                      relative flex items-center justify-center gap-1 sm:gap-1.5 md:gap-2 lg:gap-2.5 xl:gap-3
                      px-2.5 py-1.5 sm:px-3 sm:py-2 md:px-3.5 md:py-2.5 lg:px-4 lg:py-3 xl:px-5 xl:py-3.5 2xl:px-6 2xl:py-4
                      bg-gradient-to-r from-accent1 via-accent1 to-accent1/95 
                      hover:from-accent1/95 hover:via-accent1 hover:to-accent1/90
                      text-primary border-2 border-primary/20 
                      rounded-full
                      text-[8px] sm:text-[9px] md:text-[10px] lg:text-xs xl:text-sm 2xl:text-base font-semibold 
                      cursor-pointer transition-all duration-300 
                      uppercase tracking-wider
                      shadow-2xl lg:shadow-[0_20px_50px_rgba(245,158,11,0.4)]
                      hover:shadow-[0_0_30px_rgba(245,158,11,0.8)] lg:hover:shadow-[0_0_50px_rgba(245,158,11,1)]
                      hover:scale-110 lg:hover:scale-125 hover:border-primary/40
                      active:scale-105 lg:active:scale-115
                      animate-[skipPulse_2s_ease-in-out_infinite,skipFloat_3s_ease-in-out_infinite]
                      backdrop-blur-sm
                    `}
                    title="Skip to next partner"
                  >
                    {/* Glow effect background */}
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-accent1/50 to-accent1/30 blur-xl lg:blur-2xl -z-10 opacity-75 lg:opacity-90"></div>
                    
                    {/* Content */}
                    <div className="relative flex items-center justify-center gap-1 sm:gap-1.5 lg:gap-2">
                      <FaForward className="text-[10px] sm:text-xs md:text-sm lg:text-base xl:text-lg 2xl:text-xl drop-shadow-lg" />
                      <span className="text-[8px] sm:text-[9px] md:text-[10px] lg:text-xs xl:text-sm 2xl:text-base font-bold drop-shadow-md">SKIP</span>
                    </div>
                    
                    {/* Shine effect on hover */}
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-500 transform -skew-x-12"></div>
                  </button>
                </div>
              </div>
            )}
          </div>

          {showChat && (
            <div className="w-full md:w-[380px] lg:w-[420px] xl:w-[480px] h-[300px] sm:h-[350px] md:h-[420px] lg:h-[600px] xl:h-[700px] bg-secondary/90 backdrop-blur-xl rounded-xl sm:rounded-2xl md:rounded-3xl lg:rounded-[2rem] border-2 md:border-[3px] border-text/30 flex flex-col shadow-2xl mt-3 sm:mt-0" ref={chatContainerRef}>
              <div className="p-2.5 sm:p-3 md:p-4 lg:p-5 border-b border-text/20 bg-secondary/50">
                <div className="flex justify-between items-center">
                  <h3 className="text-text text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl m-0 font-semibold bg-gradient-to-r from-accent1 to-accent2 bg-clip-text text-transparent flex items-center gap-1 sm:gap-1.5 lg:gap-2">
                    <FaComments className="text-xs sm:text-sm md:text-base lg:text-lg" /> <span>Chat</span>
                  </h3>
                  <span className="text-[8px] sm:text-[9px] md:text-[10px] lg:text-xs xl:text-sm px-1.5 py-0.5 sm:px-2 sm:py-1 lg:px-3 lg:py-1.5 rounded-md sm:rounded-lg md:rounded-xl bg-accent2/20 text-accent2 font-semibold uppercase tracking-wide border border-accent2/30">
                    {matched && !partnerLeft ? 'Connected' : 'Waiting...'}
                  </span>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-5 lg:p-6 xl:p-8 flex flex-col gap-2.5 sm:gap-3 md:gap-3.5 lg:gap-4 bg-transparent" ref={chatContainerRef}>
                {messages.length === 0 ? (
                  <div className="text-center text-text/70 py-10 sm:py-12 md:py-16 lg:py-20 xl:py-24 px-3 sm:px-4 md:px-5 lg:px-6 flex flex-col items-center gap-3 sm:gap-4 lg:gap-5">
                    <FaComments className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl opacity-50 mb-2 sm:mb-3 lg:mb-4" />
                    <p className="m-0 text-xs sm:text-sm md:text-[15px] lg:text-lg xl:text-xl text-text">No messages yet.</p>
                    <p className="text-[10px] sm:text-xs md:text-[13px] lg:text-sm xl:text-base opacity-70 italic text-text/70">Start the conversation!</p>
                  </div>
                ) : (
                  messages.map((msg, index) => (
                    <div
                      key={index}
                      className={`flex gap-2 sm:gap-2.5 md:gap-3 lg:gap-4 max-w-[85%] break-words animate-[messageSlideIn_0.4s_ease] ${
                        msg.isOwn ? 'self-end flex-row-reverse' : 'self-start'
                      }`}
                    >
                      {!msg.isOwn && (
                        <div className="w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 lg:w-11 lg:h-11 xl:w-12 xl:h-12 rounded-full bg-gradient-to-r from-accent1 to-accent2 text-primary flex items-center justify-center font-bold text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl flex-shrink-0 shadow-md">
                          {msg.senderName.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1">
                        {msg.isOwn ? (
                          <div className="bg-gradient-to-r from-accent1 to-accent2 text-primary px-3 py-2.5 sm:px-3.5 sm:py-3 md:px-4 md:py-3.5 lg:px-5 lg:py-4 xl:px-6 xl:py-5 rounded-2xl sm:rounded-3xl md:rounded-[1.5rem] rounded-br-md shadow-md">
                            <div className="flex justify-between items-center mb-1 sm:mb-1.5 lg:mb-2 text-[9px] sm:text-[10px] md:text-[11px] lg:text-xs xl:text-sm opacity-90">
                              <span className="font-bold uppercase tracking-wide">{msg.isOwn ? 'You' : msg.senderName}</span>
                              <span className="text-[8px] sm:text-[9px] md:text-[10px] lg:text-xs opacity-70 ml-1.5 sm:ml-2 lg:ml-3">{formatTime(msg.timestamp)}</span>
                            </div>
                            <div className="text-xs sm:text-sm md:text-base lg:text-lg leading-relaxed break-words">{msg.message}</div>
                          </div>
                        ) : (
                          <div className="bg-secondary/80 backdrop-blur-md text-text border border-text/20 px-3 py-2.5 sm:px-3.5 sm:py-3 md:px-4 md:py-3.5 lg:px-5 lg:py-4 xl:px-6 xl:py-5 rounded-2xl sm:rounded-3xl md:rounded-[1.5rem] rounded-bl-md shadow-md">
                            <div className="flex justify-between items-center mb-1 sm:mb-1.5 lg:mb-2 text-[9px] sm:text-[10px] md:text-[11px] lg:text-xs xl:text-sm opacity-90">
                              <span className="font-bold uppercase tracking-wide">{msg.isOwn ? 'You' : msg.senderName}</span>
                              <span className="text-[8px] sm:text-[9px] md:text-[10px] lg:text-xs opacity-70 ml-1.5 sm:ml-2 lg:ml-3">{formatTime(msg.timestamp)}</span>
                            </div>
                            <div className="text-xs sm:text-sm md:text-base lg:text-lg leading-relaxed break-words">{msg.message}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
              <form onSubmit={sendMessage} className="p-3 sm:p-4 md:p-5 lg:p-6 xl:p-8 border-t border-text/20 bg-secondary/50">
                <div className="flex gap-2 sm:gap-2.5 lg:gap-3 xl:gap-4 items-center">
                  <input
                    type="text"
                    autoComplete="off"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder={matched && !partnerLeft ? "Type a message..." : "Connect to start chatting..."}
                    className="flex-1 px-2.5 py-2 sm:px-3 sm:py-2.5 md:px-3.5 md:py-3 lg:px-4 lg:py-3.5 xl:px-5 xl:py-4 border-2 border-text/30 rounded-full bg-secondary/80 backdrop-blur-md text-text text-[10px] sm:text-xs md:text-sm lg:text-base transition-all duration-300 focus:outline-none focus:border-accent1 focus:shadow-lg focus:bg-secondary/95 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-secondary/50 placeholder:text-text/50"
                    disabled={!matched || partnerLeft}
                    maxLength={500}
                  />
                  <button
                    type="submit"
                    className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 lg:w-11 lg:h-11 xl:w-12 xl:h-12 rounded-full border-none bg-gradient-to-r from-accent1 to-accent2 text-primary cursor-pointer flex items-center justify-center transition-all duration-300 flex-shrink-0 shadow-md hover:scale-110 lg:hover:scale-125 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    disabled={!matched || partnerLeft || !messageInput.trim()}
                    title="Send message (Enter)"
                  >
                    <FaPaperPlane className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl" />
                  </button>
                </div>
                {messageInput.length > 0 && (
                  <div className="text-[9px] sm:text-[10px] md:text-[11px] lg:text-xs xl:text-sm text-text/70 text-right mt-1.5 sm:mt-2 lg:mt-3 pr-1">{messageInput.length}/500</div>
                )}
              </form>
            </div>
          )}
        </div>

        {/* Control Buttons - Responsive and Fixed Position */}
        <div className="w-full mt-4 sm:mt-5 md:mt-6 lg:mt-8 xl:mt-10 px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-3 md:gap-4 lg:gap-5 xl:gap-6 justify-center items-center w-full max-w-4xl lg:max-w-5xl xl:max-w-6xl mx-auto">
            {/* Mic Button */}
            <button
              onClick={toggleMic}
              className={`flex items-center gap-1.5 sm:gap-2 md:gap-2.5 lg:gap-3 xl:gap-3.5 px-3 py-2 sm:px-3.5 sm:py-2.5 md:px-5 md:py-3 lg:px-6 lg:py-3.5 xl:px-7 xl:py-4 border-2 rounded-lg sm:rounded-xl md:rounded-2xl font-bold text-[10px] sm:text-xs md:text-sm lg:text-base xl:text-lg cursor-pointer transition-all duration-300 uppercase tracking-wide w-full sm:w-auto sm:flex-1 sm:max-w-[150px] md:max-w-[170px] lg:max-w-[190px] xl:max-w-[210px] justify-center shadow-md lg:shadow-lg hover:-translate-y-0.5 md:hover:-translate-y-1 lg:hover:-translate-y-1.5 hover:shadow-lg lg:hover:shadow-xl active:scale-95 ${
                micEnabled
                  ? 'bg-gradient-to-r from-accent2 via-accent2 to-accent2/95 border-accent2/80 text-primary shadow-lg lg:shadow-xl'
                  : 'bg-gradient-to-r from-red-500 via-red-600 to-red-600 border-red-500/80 text-primary shadow-lg lg:shadow-xl'
              }`}
              title={micEnabled ? 'Mute Microphone' : 'Unmute Microphone'}
            >
              {micEnabled ? <FaMicrophone className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl" /> : <FaMicrophoneSlash className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl" />}
              <span className="text-[9px] sm:text-[10px] md:text-xs lg:text-sm xl:text-base">{micEnabled ? 'MIC ON' : 'MIC OFF'}</span>
            </button>
          
            {/* Camera Button */}
            <button
              onClick={toggleCamera}
              className={`flex items-center gap-1.5 sm:gap-2 md:gap-2.5 lg:gap-3 xl:gap-3.5 px-3 py-2 sm:px-3.5 sm:py-2.5 md:px-5 md:py-3 lg:px-6 lg:py-3.5 xl:px-7 xl:py-4 border-2 rounded-lg sm:rounded-xl md:rounded-2xl font-bold text-[10px] sm:text-xs md:text-sm lg:text-base xl:text-lg cursor-pointer transition-all duration-300 uppercase tracking-wide w-full sm:w-auto sm:flex-1 sm:max-w-[150px] md:max-w-[170px] lg:max-w-[190px] xl:max-w-[210px] justify-center shadow-md lg:shadow-lg hover:-translate-y-0.5 md:hover:-translate-y-1 lg:hover:-translate-y-1.5 hover:shadow-lg lg:hover:shadow-xl active:scale-95 ${
                cameraEnabled
                  ? 'bg-gradient-to-r from-accent1 via-accent1 to-accent1/95 border-accent1/80 text-primary shadow-lg lg:shadow-xl'
                  : 'bg-gradient-to-r from-red-500 via-red-600 to-red-600 border-red-500/80 text-primary shadow-lg lg:shadow-xl'
              }`}
              title={cameraEnabled ? 'Turn Off Camera' : 'Turn On Camera'}
            >
              {cameraEnabled ? <FaVideo className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl" /> : <FaVideoSlash className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl" />}
              <span className="text-[9px] sm:text-[10px] md:text-xs lg:text-sm xl:text-base">{cameraEnabled ? 'CAMERA ON' : 'CAMERA OFF'}</span>
            </button>

            {/* Leave Button */}
            <button
              onClick={handleLeave}
              className="flex items-center gap-1.5 sm:gap-2 md:gap-2.5 lg:gap-3 xl:gap-3.5 px-3 py-2 sm:px-3.5 sm:py-2.5 md:px-5 md:py-3 lg:px-6 lg:py-3.5 xl:px-7 xl:py-4 w-full sm:w-auto sm:flex-1 sm:max-w-[130px] md:max-w-[140px] lg:max-w-[160px] xl:max-w-[180px] justify-center shadow-md lg:shadow-lg bg-gradient-to-r from-red-500 via-red-600 to-red-600 hover:from-red-600 hover:via-red-600 hover:to-red-700 text-primary border-none rounded-lg sm:rounded-xl md:rounded-2xl text-[10px] sm:text-xs md:text-sm lg:text-base xl:text-lg font-bold cursor-pointer transition-all duration-300 uppercase tracking-wide hover:-translate-y-0.5 md:hover:-translate-y-1 hover:shadow-lg lg:hover:shadow-xl active:scale-95"
            >
              <FaDoorOpen className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl" />
              <span className="text-[9px] sm:text-[10px] md:text-xs lg:text-sm xl:text-base font-semibold uppercase tracking-wide">LEAVE</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoChat;
