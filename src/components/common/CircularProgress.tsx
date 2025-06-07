import React, { useState } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';

const ProgressContainer = styled.div`
  position: relative;
  width: 40px;
  height: 40px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  z-index: 1;
  
  &:hover {
    background: rgba(255, 255, 255, 0.95);
    transform: scale(1.05);
  }
`;

const ProgressSvg = styled.svg`
  transform: rotate(-90deg);
  width: 100%;
  height: 100%;
`;

const BackgroundCircle = styled.circle`
  fill: none;
  stroke: rgba(0, 0, 0, 0.1);
  stroke-width: 3;
`;

const ProgressCircle = styled(motion.circle)`
  fill: none;
  stroke: #ff69b4;
  stroke-width: 3;
  stroke-linecap: round;
  transition: stroke-dashoffset 0.3s ease;
`;

const ProgressText = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 0.65rem;
  font-weight: 700;
  color: #333;
  pointer-events: none;
`;

const ProgressInput = styled.input`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 35px;
  height: 20px;
  font-size: 0.65rem;
  text-align: center;
  border: 1px solid #ff69b4;
  border-radius: 4px;
  padding: 0;
  outline: none;
  background: rgba(255, 255, 255, 0.95);
  
  &:focus {
    box-shadow: 0 0 0 2px rgba(255, 105, 180, 0.3);
  }
`;

interface CircularProgressProps {
  progress: number;
  onProgressChange: (progress: number) => void;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({ progress, onProgressChange }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(progress.toString());
  
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;
  
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
    setInputValue(progress.toString());
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || /^\d{1,3}$/.test(value)) {
      setInputValue(value);
    }
  };
  
  const handleInputBlur = () => {
    let newProgress = parseInt(inputValue) || 0;
    newProgress = Math.max(0, Math.min(100, newProgress));
    onProgressChange(newProgress);
    setIsEditing(false);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleInputBlur();
    } else if (e.key === 'Escape') {
      setInputValue(progress.toString());
      setIsEditing(false);
    }
  };
  
  return (
    <ProgressContainer onClick={handleClick}>
      <ProgressSvg viewBox="0 0 40 40">
        <BackgroundCircle
          cx="20"
          cy="20"
          r={radius}
        />
        <ProgressCircle
          cx="20"
          cy="20"
          r={radius}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </ProgressSvg>
      {isEditing ? (
        <ProgressInput
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
          onClick={(e) => e.stopPropagation()}
          autoFocus
          maxLength={3}
        />
      ) : (
        <ProgressText>{progress}%</ProgressText>
      )}
    </ProgressContainer>
  );
};