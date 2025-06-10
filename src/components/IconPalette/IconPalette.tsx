import React from 'react';
import styled from 'styled-components';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

const PaletteContainer = styled.div`
  position: fixed;
  bottom: 20px;
  right: 20px;
  background: rgba(255, 255, 255, 0.98);
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  display: flex;
  gap: 12px;
  z-index: 1000;
  backdrop-filter: blur(10px);
`;

const IconButton = styled.div<{ $bgColor: string; $iconColor: string; isDragging?: boolean }>`
  width: 44px;
  height: 44px;
  border-radius: 10px;
  background: ${props => props.$bgColor};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: ${props => props.isDragging ? 'grabbing' : 'grab'};
  transition: all 0.2s ease;
  user-select: none;
  opacity: ${props => props.isDragging ? 0.5 : 1};
  position: relative;
  
  svg {
    width: 24px;
    height: 24px;
    stroke: ${props => props.$iconColor};
    fill: none;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  
  &:hover {
    transform: scale(1.1);
    box-shadow: 0 4px 12px ${props => props.$bgColor}40;
  }
`;

// Lightning bolt icon
const EnergyIcon = () => (
  <svg viewBox="0 0 24 24">
    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
  </svg>
);

// Dumbbell icon for effort
const EffortIcon = () => (
  <svg viewBox="0 0 24 24">
    <path d="M6.5 6.5V17.5M17.5 6.5V17.5M3 12H7M17 12H21M12 3V21" />
  </svg>
);

// Water drop icon
const CalmIcon = () => (
  <svg viewBox="0 0 24 24">
    <path d="M12 2l-5.5 9.5a7.5 7.5 0 1011 0L12 2z" />
  </svg>
);

// Clock icon
const DailyIcon = () => (
  <svg viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v6l4 2" />
  </svg>
);

export const ICON_TYPES = {
  energy: { 
    icon: EnergyIcon, 
    bgColor: '#FFF4CC', 
    iconColor: '#F59E0B',
    label: 'Energy' 
  },
  effort: { 
    icon: EffortIcon, 
    bgColor: '#FFE4E6', 
    iconColor: '#EF4444',
    label: 'High Effort' 
  },
  calm: { 
    icon: CalmIcon, 
    bgColor: '#E0F2FE', 
    iconColor: '#0EA5E9',
    label: 'Calm' 
  },
  daily: { 
    icon: DailyIcon, 
    bgColor: '#F0FDF4', 
    iconColor: '#22C55E',
    label: 'Daily' 
  }
};

interface DraggableIconProps {
  iconKey: string;
  icon: typeof ICON_TYPES[keyof typeof ICON_TYPES];
}

const DraggableIcon: React.FC<DraggableIconProps> = ({ iconKey, icon }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `icon-${iconKey}`,
    data: {
      iconType: iconKey,
    },
  });

  const style = transform ? {
    transform: CSS.Translate.toString(transform),
  } : undefined;

  const IconComponent = icon.icon;

  return (
    <IconButton
      ref={setNodeRef}
      style={style}
      $bgColor={icon.bgColor}
      $iconColor={icon.iconColor}
      isDragging={isDragging}
      title={icon.label}
      {...listeners}
      {...attributes}
    >
      <IconComponent />
    </IconButton>
  );
};

interface IconPaletteProps {
  isVisible: boolean;
}

export const IconPalette: React.FC<IconPaletteProps> = ({ isVisible }) => {
  if (!isVisible) return null;

  return (
    <PaletteContainer>
      {Object.entries(ICON_TYPES).map(([key, icon]) => (
        <DraggableIcon key={key} iconKey={key} icon={icon} />
      ))}
    </PaletteContainer>
  );
};