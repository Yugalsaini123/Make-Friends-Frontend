// src/components/Home.js
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import debounce from 'lodash/debounce';

function Home() {
  const { token, logout } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [friends, setFriends] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [notifications, setNotifications] = useState({ message: '', type: '' });

  // Fetch functions wrapped with useCallback for memoization
  const fetchFriends = useCallback(async () => {
    try {
      const response = await fetch('https://make-friends-backend.onrender.com/friends', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setFriends(data);
    } catch (error) {
      console.error('Error fetching friends:', error);
    }
  }, [token]);

  const fetchRecommendations = useCallback(async () => {
    try {
      const response = await fetch('https://make-friends-backend.onrender.com/friends/recommendations', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setRecommendations(data);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    }
  }, [token]);

  const fetchPendingRequests = useCallback(async () => {
    try {
      const response = await fetch('https://make-friends-backend.onrender.com/friends/pending', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setPendingRequests(data);
    } catch (error) {
      console.error('Error fetching pending requests:', error);
    }
  }, [token]);

  // Fetch all data on mount
  useEffect(() => {
    const fetchAllData = async () => {
      await fetchFriends();
      await fetchRecommendations();
      await fetchPendingRequests();
    };
    fetchAllData();
  }, [fetchFriends, fetchRecommendations, fetchPendingRequests]);

  // Debounced search logic
  const debouncedSearch = useMemo(
    () =>
      debounce(async (term) => {
        try {
          const response = await fetch(
            `https://make-friends-backend.onrender.com/friends/search?username=${term}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          const data = await response.json();
          setSearchResults(data);
        } catch (error) {
          console.error('Error searching users:', error);
        }
      }, 300),
    [token]
  );

  const handleSearchChange = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    if (term.length > 0) {
      debouncedSearch(term);
    } else {
      setSearchResults([]);
    }
  };

  // Friend request actions
  const sendFriendRequest = async (userId) => {
    try {
      const response = await fetch(
        `https://make-friends-backend.onrender.com/friends/request/${userId}`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await response.json();
      setNotifications({
        message: data.message,
        type: data.status === 'requested' ? 'success' : 'info',
      });
      // Update UI
      setSearchResults((prevResults) =>
        prevResults.map((user) =>
          user._id === userId
            ? { ...user, requestStatus: data.status === 'requested' ? 'requested' : 'none' }
            : user
        )
      );
      fetchRecommendations(); // Refresh recommendations if needed
    } catch (error) {
      console.error('Error managing friend request:', error);
      setNotifications({ message: 'Error managing friend request', type: 'error' });
    }
  };

  const acceptFriendRequest = async (userId) => {
    try {
      await fetch(`https://make-friends-backend.onrender.com/friends/accept/${userId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchPendingRequests();
      fetchFriends();
    } catch (error) {
      console.error('Error accepting friend request:', error);
    }
  };

  const unfriend = async (userId) => {
    try {
      await fetch(`https://make-friends-backend.onrender.com/friends/unfriend/${userId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchFriends();
    } catch (error) {
      console.error('Error unfriending user:', error);
    }
  };


  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Friend Management</h1>
          <button
            onClick={logout}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Logout
          </button>
        </div>
        {notifications.message && (
          <div className={`mb-4 p-4 rounded ${
            notifications.type === 'success' ? 'bg-green-100 text-green-700' :
            notifications.type === 'error' ? 'bg-red-100 text-red-700' :
            'bg-blue-100 text-blue-700'
          }`}>
            {notifications.message}
          </div>
        )}

        {/* Search Section */}
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <div className="flex gap-4 mb-4">
            <input
              type="text"
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder="Search users..."
              className="flex-1 p-2 border rounded"
            />
          </div>
          
          {searchResults.length > 0 && (
            <div className="mt-4">
              <h2 className="text-xl font-semibold mb-4">Search Results</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {searchResults.map(user => (
                  <div key={user._id} className="border p-4 rounded">
                    <p className="font-medium">{user.username}</p>
                    {user.requestStatus === 'none' && (
                      <button
                        onClick={() => sendFriendRequest(user._id)}
                        className="mt-2 bg-green-500 text-white px-4 py-1 rounded hover:bg-green-600"
                      >
                        Add Friend
                      </button>
                    )}
                    {user.requestStatus === 'requested' && (
                      <button
                        onClick={() => sendFriendRequest(user._id)}
                        className="mt-2 bg-gray-500 text-white px-4 py-1 rounded hover:bg-gray-600"
                      >
                        Cancel Request
                      </button>
                    )}
                    {user.requestStatus === 'friend' && (
                      <span className="mt-2 text-green-600">Already Friends</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Friend Requests Section */}
        {pendingRequests.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow mb-8">
            <h2 className="text-xl font-semibold mb-4">Pending Friend Requests</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pendingRequests.map(request => (
                <div key={request._id} className="border p-4 rounded">
                  <p className="font-medium">{request.username}</p>
                  <button
                    onClick={() => acceptFriendRequest(request._id)}
                    className="mt-2 bg-green-500 text-white px-4 py-1 rounded hover:bg-green-600"
                  >
                    Accept
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Friends List Section */}
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h2 className="text-xl font-semibold mb-4">My Friends</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {friends.map(friend => (
              <div key={friend._id} className="border p-4 rounded">
                <p className="font-medium">{friend.username}</p>
                <button
                  onClick={() => unfriend(friend._id)}
                  className="mt-2 bg-red-500 text-white px-4 py-1 rounded hover:bg-red-600"
                >
                  Unfriend
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Recommendations Section */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Recommended Friends</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommendations.map(rec => (
              <div key={rec.user._id} className="border p-4 rounded">
                <p className="font-medium">{rec.user.username}</p>
                <p className="text-sm text-gray-600">
                  {rec.mutualFriends} mutual friends
                  {rec.mutualInterests > 0 && ` • ${rec.mutualInterests} shared interests`}
                </p>
                <button
                  onClick={() => sendFriendRequest(rec.user._id)}
                  className="mt-2 bg-green-500 text-white px-4 py-1 rounded hover:bg-green-600"
                >
                  Add Friend
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;