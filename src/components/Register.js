// src/components/Register.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Register() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [interests, setInterests] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('https://make-friends-backend.onrender.com/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          password,
          interests: interests.split(',').map(i => i.trim())
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        login(data.token, data.userId);
        navigate('/');
      } else {
        setError(data.message);
      }
    } catch (error) {
      setError('Error registering user');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <h2 className="text-center text-3xl font-bold">Register</h2>
        {error && <p className="text-red-500 text-center">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-6">
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            className="w-full p-2 border rounded"
            required
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full p-2 border rounded"
            required
          />
          <input
            type="text"
            value={interests}
            onChange={(e) => setInterests(e.target.value)}
            placeholder="Interests (comma-separated)"
            className="w-full p-2 border rounded"
          />
          <button
            type="submit"
            className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
          >
            Register
          </button>
          <p className="text-center text-sm text-gray-500 mt-2">
              Already have an account?{" "}
              <a href="/login" className="text-teal-600 font-medium hover:underline">
                Login
              </a>
          </p>
        </form>
      </div>
    </div>
  );
}

export default Register;