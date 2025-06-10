import React from 'react';
import styled from 'styled-components';
import { useUIStore } from '../../store/uiStore';

const ConfigContainer = styled.div`
  background: rgba(255, 255, 255, 0.9);
  border-radius: 12px;
  padding: 1rem;
  margin: 1rem 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

const ConfigTitle = styled.h4`
  margin: 0 0 0.75rem 0;
  color: #333;
  font-size: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const ConfigRow = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const Label = styled.label`
  color: #666;
  font-size: 0.9rem;
`;

const Select = styled.select`
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.9rem;
  background: white;
  cursor: pointer;
  
  &:focus {
    outline: none;
    border-color: #667eea;
  }
`;

const InfoText = styled.p`
  margin: 0.5rem 0 0 0;
  font-size: 0.85rem;
  color: #999;
  font-style: italic;
`;

export const AutoDeleteConfig: React.FC = () => {
  const { autoDeleteHours, setAutoDeleteHours } = useUIStore();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setAutoDeleteHours(parseInt(e.target.value));
  };

  return (
    <ConfigContainer>
      <ConfigTitle>
        ⏰ Auto-Delete Configuration
      </ConfigTitle>
      <ConfigRow>
        <Label htmlFor="auto-delete-select">
          Automatically delete tasks from Done column after:
        </Label>
        <Select 
          id="auto-delete-select"
          value={autoDeleteHours} 
          onChange={handleChange}
        >
          <option value={0}>Disabled</option>
          <option value={1}>1 hour</option>
          <option value={2}>2 hours</option>
          <option value={4}>4 hours</option>
          <option value={8}>8 hours</option>
          <option value={12}>12 hours</option>
          <option value={24}>24 hours (1 day)</option>
          <option value={48}>48 hours (2 days)</option>
          <option value={72}>72 hours (3 days)</option>
          <option value={168}>1 week</option>
        </Select>
      </ConfigRow>
      <InfoText>
        {autoDeleteHours === 0 
          ? "Tasks will remain in the Done column indefinitely."
          : `Tasks will be automatically deleted ${autoDeleteHours} hour${autoDeleteHours > 1 ? 's' : ''} after being moved to Done.`}
      </InfoText>
    </ConfigContainer>
  );
};