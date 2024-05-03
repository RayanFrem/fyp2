import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css'; // Include CSS file for styling

function Login({ onClose }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (username === 'rayan' && password === 'rayan') {
      onClose();
      navigate('/dashboard');
    } else {
      alert('Invalid credentials');
    }
  };

  return (
    <div className="login-modal"> {/* Modal overlay */}
      <div className="login-content"> {/* Modal content */}
        <h2>Login</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button type="submit">Login</button>
          <button type="button" onClick={onClose}> {/* Close button */}
            Close
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
