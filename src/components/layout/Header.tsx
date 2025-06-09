import React, { useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { motion } from 'framer-motion';
import { isUsingFirebase } from '../../lib/storageAdapter';
import { UserFilterDropdown } from '../common/UserFilterDropdown';
import { useUIStore } from '../../store/uiStore';
import { BatchImportModal } from '../BatchImport/BatchImportModal';

const floatAnimation = keyframes`
  0%, 100% {
    transform: translateY(0) scale(1);
    opacity: 0.2;
  }
  50% {
    transform: translateY(-15px) scale(1.05);
    opacity: 0.4;
  }
`;

const pulseAnimation = keyframes`
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.02);
  }
`;

const HeaderContainer = styled(motion.header)`
  background: linear-gradient(135deg, #ff6ec4 0%, #7873f5 100%);
  color: white;
  padding: 2rem;
  box-shadow: 0 4px 12px rgba(255, 110, 196, 0.3);
  border-radius: 0 0 1.5rem 1.5rem;
  position: relative;
  overflow: hidden;
`;

const HeartBackground = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  
  &::before, &::after {
    content: '❤️';
    position: absolute;
    font-size: 2rem;
    animation: ${floatAnimation} 4s ease-in-out infinite;
  }
  
  &::before {
    top: 10%;
    left: 10%;
    animation-delay: 0s;
  }
  
  &::after {
    top: 20%;
    right: 15%;
    animation-delay: 2s;
  }
`;

const FloatingHeart = styled.span`
  position: absolute;
  font-size: 1.5rem;
  animation: ${floatAnimation} 6s ease-in-out infinite;
  
  &:nth-child(1) {
    top: 50%;
    left: 20%;
    animation-delay: 1s;
  }
  
  &:nth-child(2) {
    top: 30%;
    right: 25%;
    animation-delay: 3s;
  }
  
  &:nth-child(3) {
    bottom: 20%;
    left: 30%;
    animation-delay: 4s;
  }
  
  &:nth-child(4) {
    bottom: 30%;
    right: 20%;
    animation-delay: 5s;
  }
`;

const TitleContainer = styled.div`
  position: relative;
  z-index: 1;
  text-align: center;
`;

const Title = styled.h1`
  font-size: 2.5rem;
  font-weight: 800;
  margin: 0;
  text-shadow: 3px 3px 6px rgba(0, 0, 0, 0.2);
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  animation: ${pulseAnimation} 2s ease-in-out infinite;
`;

const KawaiiText = styled.span`
  color: #ff69b4;
  text-shadow: 
    0 0 10px rgba(255, 105, 180, 0.5),
    0 0 20px rgba(255, 105, 180, 0.3),
    3px 3px 6px rgba(0, 0, 0, 0.3);
  font-family: 'Comic Sans MS', cursive, sans-serif;
`;

const Subtitle = styled.p`
  font-size: 1.1rem;
  margin: 0.75rem 0 0;
  opacity: 0.95;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
  font-style: italic;
`;

const Sparkle = styled.span<{ $delay?: string }>`
  display: inline-block;
  animation: ${pulseAnimation} 1.5s ease-in-out infinite;
  animation-delay: ${props => props.$delay || '0s'};
`;

const StorageIndicator = styled.div`
  position: absolute;
  top: 10px;
  right: 10px;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  backdrop-filter: blur(10px);
  z-index: 10;
`;

const StorageIcon = styled.span`
  font-size: 1rem;
`;

const ControlsContainer = styled.div`
  position: absolute;
  top: 50%;
  right: 20px;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  gap: 1rem;
  z-index: 10;
`;

const BatchImportButton = styled.button`
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  
  &:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: scale(1.1);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }
  
  &:active {
    transform: scale(0.95);
  }
`;

export const Header: React.FC = () => {
  const usingFirebase = isUsingFirebase();
  const { isEditMode } = useUIStore();
  const [showBatchImport, setShowBatchImport] = useState(false);
  
  return (
    <>
    <HeaderContainer
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, type: 'spring', stiffness: 100 }}
    >
      <HeartBackground />
      <FloatingHeart>💕</FloatingHeart>
      <FloatingHeart>💖</FloatingHeart>
      <FloatingHeart>💗</FloatingHeart>
      <FloatingHeart>💝</FloatingHeart>
      
      <StorageIndicator>
        <StorageIcon>{usingFirebase ? '☁️' : '💾'}</StorageIcon>
        <span>{usingFirebase ? 'Cloud Storage' : 'Local Storage'}</span>
      </StorageIndicator>
      
      <ControlsContainer>
        <BatchImportButton 
          onClick={() => setShowBatchImport(true)}
          title="Batch Import Tasks"
        >
          📥
        </BatchImportButton>
        {isEditMode && <UserFilterDropdown />}
      </ControlsContainer>
      
      <TitleContainer>
        <Title>
          <Sparkle $delay="0s">✨</Sparkle>
          <KawaiiText>Kawaii</KawaiiText> To-Do
          <Sparkle $delay="0.5s">✨</Sparkle>
        </Title>
        <Subtitle>Let's make our tasks fun and beautiful! 💕</Subtitle>
      </TitleContainer>
    </HeaderContainer>
    
    <BatchImportModal 
      isOpen={showBatchImport} 
      onClose={() => setShowBatchImport(false)} 
    />
    </>
  );
};