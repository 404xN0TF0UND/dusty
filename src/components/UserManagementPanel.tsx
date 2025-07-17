import React, { useEffect, useState } from 'react';
import { db } from '../services/firebase';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
// import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { User } from '../types';
import './UserManagementPanel.css';

interface UserManagementPanelProps {
  onClose: () => void;
  currentUser: User;
}

export const UserManagementPanel: React.FC<UserManagementPanelProps> = ({ onClose, currentUser }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      const usersRef = collection(db, 'users');
      const snap = await getDocs(usersRef);
      setUsers(snap.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as User)));
      setLoading(false);
    };
    fetchUsers();
  }, []);

  const isLastAdmin = (userId: string) => {
    const admins = users.filter(u => u.role === 'admin');
    return admins.length === 1 && admins[0].id === userId;
  };

  const handleRoleChange = async (user: User, makeAdmin: boolean) => {
    if (isLastAdmin(user.id) && !makeAdmin) {
      setError('You cannot demote the last admin.');
      return;
    }
    const userRef = doc(db, 'users', user.id);
    await updateDoc(userRef, { role: makeAdmin ? 'admin' : 'member' });
    setUsers(users.map(u => u.id === user.id ? { ...u, role: makeAdmin ? 'admin' : 'member' } : u));
  };

  // const handleAvatarChange = async (user: User, file: File) => {
  //   setUploading(user.id);
  //   setError(null);
  //   try {
  //     const storage = getStorage();
  //     const avatarRef = ref(storage, `avatars/${user.id}`);
  //     await uploadBytes(avatarRef, file);
  //     const url = await getDownloadURL(avatarRef);
  //     const userRef = doc(db, 'users', user.id);
  //     await updateDoc(userRef, { avatarUrl: url });
  //     setUsers(users.map(u => u.id === user.id ? { ...u, avatarUrl: url } : u));
  //   } catch (err) {
  //     setError('Failed to upload avatar.');
  //   } finally {
  //     setUploading(null);
  //   }
  // };

  return (
    <div className="user-mgmt-overlay">
      <div className="user-mgmt-modal">
        <h2>User Management</h2>
        {error && <div className="user-mgmt-error">{error}</div>}
        <table className="user-mgmt-table">
          <thead>
            <tr>
              <th>Avatar</th>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td>
                  <img
                    src={'/logo192.png'}
                    alt={user.displayName}
                    className="user-mgmt-avatar"
                  />
                  {/* <input
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    id={`avatar-upload-${user.id}`}
                    onChange={e => {
                      if (e.target.files && e.target.files[0]) {
                        handleAvatarChange(user, e.target.files[0]);
                      }
                    }}
                  />
                  <label htmlFor={`avatar-upload-${user.id}`} className="user-mgmt-avatar-btn">
                    {uploading === user.id ? 'Uploading...' : 'Change'}
                  </label> */}
                </td>
                <td>{user.displayName}</td>
                <td>{user.email}</td>
                <td>{user.role}</td>
                <td>
                  {user.role !== 'admin' && (
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => handleRoleChange(user, true)}
                      disabled={uploading === user.id}
                    >
                      Promote to Admin
                    </button>
                  )}
                  {user.role === 'admin' && !isLastAdmin(user.id) && (
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleRoleChange(user, false)}
                      disabled={uploading === user.id}
                    >
                      Demote to Member
                    </button>
                  )}
                  {user.role === 'admin' && isLastAdmin(user.id) && (
                    <span className="user-mgmt-badge">Last Admin</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <button className="btn btn-secondary" onClick={onClose} style={{ marginTop: 24 }}>Close</button>
      </div>
    </div>
  );
}; 