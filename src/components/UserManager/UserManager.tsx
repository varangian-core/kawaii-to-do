import React, { useState } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { useUserStore, getRandomColor, getRandomIcon } from '../../store/userStore';
import { Button } from '../common/Button';
import { Input } from '../common/Input';

const UserManagerContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0 2rem;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 1rem;
  margin: 1rem 2rem 0;
  backdrop-filter: blur(10px);
`;

const UserList = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
  flex-wrap: wrap;
  padding: 1rem 0;
`;

const UserBadge = styled(motion.div)<{ $color: string; $isActive?: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: ${props => props.$color};
  color: white;
  border-radius: 2rem;
  font-size: 0.9rem;
  cursor: pointer;
  position: relative;
  border: 2px solid ${props => props.$isActive ? 'white' : 'transparent'};
  box-shadow: ${props => props.$isActive ? '0 0 0 2px rgba(0,0,0,0.2)' : '0 2px 4px rgba(0,0,0,0.1)'};
  transition: all 0.2s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0,0,0,0.2);
  }
`;

const UserIcon = styled.span`
  font-size: 1.2rem;
`;

const DeleteButton = styled.button`
  background: rgba(255, 255, 255, 0.3);
  border: none;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  margin-left: 0.25rem;
  
  &:hover {
    background: rgba(255, 255, 255, 0.5);
  }
`;

const AddUserForm = styled.form`
  display: flex;
  gap: 0.5rem;
  align-items: center;
`;

const ColorPicker = styled.input`
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  overflow: hidden;
  
  &::-webkit-color-swatch-wrapper {
    padding: 0;
  }
  
  &::-webkit-color-swatch {
    border: none;
    border-radius: 50%;
  }
`;

const IconPicker = styled.select`
  padding: 0.5rem;
  border-radius: 8px;
  border: 2px solid #e0e0e0;
  font-size: 1.2rem;
  cursor: pointer;
  
  &:focus {
    outline: none;
    border-color: #667eea;
  }
`;

export const UserManager: React.FC = () => {
  const { users, currentUserId, addUser, deleteUser, setCurrentUser } = useUserStore();
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserColor, setNewUserColor] = useState(getRandomColor());
  const [newUserIcon, setNewUserIcon] = useState(getRandomIcon());

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (newUserName.trim()) {
      addUser(newUserName.trim(), newUserColor, newUserIcon);
      setNewUserName('');
      setNewUserColor(getRandomColor());
      setNewUserIcon(getRandomIcon());
      setIsAddingUser(false);
    }
  };

  const handleDeleteUser = (userId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Delete this user? Their tasks will remain unassigned.')) {
      deleteUser(userId);
    }
  };

  const iconOptions = ['😊', '🌟', '🦄', '🐱', '🦊', '🐰', '🐨', '🦁', '🐸', '🦋', '🌸', '🌺', '🌻', '🌈', '💫', '🎨', '🎯', '🚀', '💡', '❤️'];

  return (
    <UserManagerContainer>
      <UserList>
        <AnimatePresence>
          {Object.values(users).map((user) => (
            <UserBadge
              key={user.id}
              $color={user.color}
              $isActive={user.id === currentUserId}
              onClick={() => setCurrentUser(user.id === currentUserId ? null : user.id)}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {user.icon && <UserIcon>{user.icon}</UserIcon>}
              <span>{user.name}</span>
              <DeleteButton onClick={(e) => handleDeleteUser(user.id, e)}>
                ×
              </DeleteButton>
            </UserBadge>
          ))}
        </AnimatePresence>
        
        {isAddingUser ? (
          <AddUserForm onSubmit={handleAddUser}>
            <IconPicker
              value={newUserIcon}
              onChange={(e) => setNewUserIcon(e.target.value)}
            >
              {iconOptions.map(icon => (
                <option key={icon} value={icon}>{icon}</option>
              ))}
            </IconPicker>
            <Input
              type="text"
              value={newUserName}
              onChange={(e) => setNewUserName(e.target.value)}
              placeholder="User name"
              autoFocus
              style={{ width: '120px' }}
            />
            <ColorPicker
              type="color"
              value={newUserColor}
              onChange={(e) => setNewUserColor(e.target.value)}
            />
            <Button type="submit" disabled={!newUserName.trim()}>
              Add
            </Button>
            <Button type="button" onClick={() => {
              setIsAddingUser(false);
              setNewUserName('');
            }}>
              Cancel
            </Button>
          </AddUserForm>
        ) : (
          <Button onClick={() => setIsAddingUser(true)}>
            + Add User
          </Button>
        )}
      </UserList>
    </UserManagerContainer>
  );
};