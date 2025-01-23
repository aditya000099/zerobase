// pages/users.js
'use client'
import { useEffect, useState } from 'react';

function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchUsers() {
      try {
          const response = await fetch('http://localhost:3001/auth/users');
          if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
          }
        const data = await response.json();
        setUsers(data.users);
      } catch (err) {
        setError(err);
      } finally{
        setLoading(false)
      }
    }
      fetchUsers();
  }, []);

  if (loading) return <p>Loading Users...</p>
  if (error) return <p>Error Fetching users. {error.message}</p>
  return (
    <div>
      <h1>Users</h1>
      <ul>
        {users.map(user => (
          <li key={user.id}>
            <strong>Email:</strong> {user.email}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default UsersPage;