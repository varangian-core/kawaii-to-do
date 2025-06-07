import React from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { useUIStore } from '../../store/uiStore';

const ToggleContainer = styled.div`
  position: relative;
  display: flex;
  justify-content: center;
  padding: 0.5rem 2rem;
  background: linear-gradient(to bottom, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.5) 100%);
`;

const ToggleButton = styled(motion.button)<{ $isActive: boolean }>`
  background: ${props => props.$isActive 
    ? 'linear-gradient(135deg, #ff69b4 0%, #ff1493 100%)' 
    : 'rgba(255, 255, 255, 0.7)'};
  color: ${props => props.$isActive ? 'white' : '#666'};
  border: none;
  border-radius: 2rem;
  padding: 0.5rem 1.5rem;
  font-size: 0.85rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    background: ${props => props.$isActive 
      ? 'linear-gradient(135deg, #ff69b4 0%, #ff1493 100%)' 
      : 'rgba(255, 255, 255, 0.9)'};
  }
  
  &:active {
    transform: translateY(0);
  }
`;

const Icon = styled.span`
  font-size: 1rem;
  display: inline-block;
  transition: transform 0.3s ease;
`;

const HintText = styled(motion.div)`
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-top: 0.5rem;
  font-size: 0.75rem;
  color: #999;
  white-space: nowrap;
  pointer-events: none;
`;

export const EditModeToggle: React.FC = () => {
  const { isEditMode, toggleEditMode } = useUIStore();
  
  return (
    <ToggleContainer>
      <ToggleButton
        $isActive={isEditMode}
        onClick={toggleEditMode}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Icon style={{ transform: isEditMode ? 'rotate(45deg)' : 'rotate(0deg)' }}>
          {isEditMode ? '✏️' : '👁️'}
        </Icon>
        <span>{isEditMode ? 'Exit Edit Mode' : 'Edit Layout'}</span>
      </ToggleButton>
      
      <AnimatePresence>
        {!isEditMode && (
          <HintText
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.2 }}
          >
            Click to add columns and manage users
          </HintText>
        )}
      </AnimatePresence>
    </ToggleContainer>
  );
};