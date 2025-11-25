import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE_URL from '../config/api';
import './RestrictedWords.css';

const RestrictedWords = () => {
  const [words, setWords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newWord, setNewWord] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchWords();
  }, []);

  const fetchWords = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/restricted-words`);
      setWords(response.data);
    } catch (error) {
      console.error('Error fetching restricted words:', error);
      setError('Failed to load restricted words');
    } finally {
      setLoading(false);
    }
  };

  const handleAddWord = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!newWord.trim()) {
      setError('Please enter a word');
      return;
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/api/restricted-words`, {
        word: newWord.trim()
      });
      setWords([response.data, ...words]);
      setNewWord('');
      setSuccess('Word added successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to add word');
    }
  };

  const handleDeleteWord = async (id) => {
    if (!window.confirm('Are you sure you want to delete this word?')) {
      return;
    }

    try {
      await axios.delete(`${API_BASE_URL}/api/restricted-words/${id}`);
      setWords(words.filter(word => word._id !== id));
      setSuccess('Word deleted successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to delete word');
    }
  };

  if (loading) {
    return <div className="restricted-words-container">Loading...</div>;
  }

  return (
    <div className="restricted-words-container">
      <div className="restricted-words-header">
        <h2>🚫 Restricted Words Management</h2>
        <p className="restricted-words-description">
          Manage words that will automatically disconnect users if used in chat. Users will be restricted from starting a new chat for 10 seconds after using a restricted word.
        </p>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <div className="add-word-section">
        <form onSubmit={handleAddWord} className="add-word-form">
          <input
            type="text"
            value={newWord}
            onChange={(e) => setNewWord(e.target.value)}
            placeholder="Enter a word to restrict..."
            className="word-input"
            maxLength="50"
          />
          <button type="submit" className="btn btn-primary">
            Add Word
          </button>
        </form>
      </div>

      <div className="words-list-section">
        <h3>Restricted Words ({words.length})</h3>
        {words.length === 0 ? (
          <div className="no-words">
            <p>No restricted words added yet.</p>
            <p className="no-words-hint">Add words above to start filtering chat messages.</p>
          </div>
        ) : (
          <div className="words-grid">
            {words.map((word) => (
              <div key={word._id} className="word-card">
                <span className="word-text">{word.word}</span>
                <button
                  onClick={() => handleDeleteWord(word._id)}
                  className="btn-delete"
                  title="Delete word"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RestrictedWords;

