import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { useUserStore } from '../../store/userStore';
import { useUIStore } from '../../store/uiStore';

const FilterButtonContainer = styled.div`
  position: relative;
`;

const FilterIconButton = styled.button<{ $hasActiveFilters: boolean }>`
  background: ${props => props.$hasActiveFilters ? '#667eea' : 'transparent'};
  border: 1px solid ${props => props.$hasActiveFilters ? '#667eea' : '#ddd'};
  color: ${props => props.$hasActiveFilters ? 'white' : '#666'};
  width: 24px;
  height: 24px;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  transition: all 0.2s ease;
  position: relative;
  
  &:hover {
    background: ${props => props.$hasActiveFilters ? '#5a67d8' : '#f0f0f0'};
    border-color: ${props => props.$hasActiveFilters ? '#5a67d8' : '#999'};
    transform: translateY(-1px);
  }
`;

const ActiveCount = styled.span`
  position: absolute;
  top: -5px;
  right: -5px;
  background: #ff6b6b;
  color: white;
  font-size: 0.65rem;
  padding: 0.05rem 0.25rem;
  border-radius: 8px;
  min-width: 14px;
  text-align: center;
  font-weight: 600;
  line-height: 1.2;
`;

const DropdownMenu = styled(motion.div)`
  position: absolute;
  top: calc(100% + 0.5rem);
  right: -10px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  min-width: 200px;
  max-width: 220px;
  max-height: 320px;
  overflow-y: auto;
  border: 1px solid rgba(0, 0, 0, 0.08);
  z-index: 100;
`;

const MenuSection = styled.div`
  padding: 0.6rem;
  border-bottom: 1px solid #f0f0f0;
  
  &:last-child {
    border-bottom: none;
  }
`;


const FilterModeToggle = styled.div`
  display: flex;
  background: #f0f0f0;
  border-radius: 4px;
  padding: 2px;
  margin-bottom: 0.5rem;
`;

const FilterModeButton = styled.button<{ $isActive: boolean }>`
  flex: 1;
  padding: 0.25rem 0.5rem;
  border: none;
  background: ${props => props.$isActive ? 'white' : 'transparent'};
  border-radius: 3px;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: ${props => props.$isActive ? '0 1px 2px rgba(0,0,0,0.1)' : 'none'};
  white-space: nowrap;
  
  &:hover {
    background: ${props => props.$isActive ? 'white' : 'rgba(0,0,0,0.05)'};
  }
`;

const UserList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const UserItem = styled.label`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.3rem 0.4rem;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s ease;
  
  &:hover {
    background: #f8f8f8;
  }
`;

const UserCheckbox = styled.input`
  width: 14px;
  height: 14px;
  cursor: pointer;
  accent-color: #667eea;
`;

const UserBadge = styled.div<{ $color: string }>`
  background: ${props => props.$color};
  color: white;
  padding: 0.2rem 0.5rem;
  border-radius: 0.75rem;
  font-size: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  flex: 1;
`;

const UserIcon = styled.span`
  font-size: 0.85rem;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 0.4rem;
  margin-top: 0.5rem;
`;

const ActionButton = styled.button`
  flex: 1;
  padding: 0.3rem 0.5rem;
  border: 1px solid #ddd;
  background: white;
  border-radius: 4px;
  font-size: 0.7rem;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: #f8f8f8;
    border-color: #999;
  }
`;

const ApplyButton = styled(ActionButton)`
  background: #667eea;
  color: white;
  border-color: #667eea;
  
  &:hover {
    background: #5a67d8;
    border-color: #5a67d8;
  }
`;

interface ColumnFilterButtonProps {
  columnId: string;
}

export const ColumnFilterButton: React.FC<ColumnFilterButtonProps> = ({ columnId }) => {
  const { users } = useUserStore();
  const { 
    columnUserFilters, 
    selectedUserFilters,
    filterMode,
    toggleColumnUserFilter,
    clearColumnFilters,
    setColumnFilters,
    toggleUserFilter,
    clearUserFilters,
    setFilterMode
  } = useUIStore();
  
  const [isOpen, setIsOpen] = useState(false);
  const [localMode, setLocalMode] = useState<'local' | 'global'>(filterMode === 'column' ? 'local' : 'global');
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const userList = Object.values(users);
  const columnFilters = columnUserFilters[columnId] || [];
  const activeFilters = localMode === 'local' ? columnFilters : selectedUserFilters;
  const hasActiveFilters = filterMode === 'column' 
    ? columnFilters.length > 0 
    : selectedUserFilters.length > 0;
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleUserToggle = (userId: string) => {
    if (localMode === 'local') {
      toggleColumnUserFilter(columnId, userId);
      setFilterMode('column');
    } else {
      toggleUserFilter(userId);
      setFilterMode('global');
    }
  };

  const handleClear = () => {
    if (localMode === 'local') {
      clearColumnFilters(columnId);
    } else {
      clearUserFilters();
    }
  };

  const handleApplyGlobalToLocal = () => {
    setColumnFilters(columnId, selectedUserFilters);
    setLocalMode('local');
  };

  return (
    <FilterButtonContainer ref={dropdownRef}>
      <FilterIconButton
        onClick={() => setIsOpen(!isOpen)}
        $hasActiveFilters={hasActiveFilters}
        title="Filter tasks"
      >
        🔍
        {hasActiveFilters && (
          <ActiveCount>
            {filterMode === 'column' ? columnFilters.length : selectedUserFilters.length}
          </ActiveCount>
        )}
      </FilterIconButton>

      <AnimatePresence>
        {isOpen && (
          <DropdownMenu
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
          >
            <MenuSection>
              <FilterModeToggle>
                <FilterModeButton
                  $isActive={localMode === 'local'}
                  onClick={() => {
                    setLocalMode('local');
                    setFilterMode('column');
                  }}
                >
                  This Column
                </FilterModeButton>
                <FilterModeButton
                  $isActive={localMode === 'global'}
                  onClick={() => {
                    setLocalMode('global');
                    setFilterMode('global');
                  }}
                >
                  All Columns
                </FilterModeButton>
              </FilterModeToggle>
            </MenuSection>

            <MenuSection>
              <UserList>
                {userList.map(user => (
                  <UserItem key={user.id}>
                    <UserCheckbox
                      type="checkbox"
                      checked={activeFilters.includes(user.id)}
                      onChange={() => handleUserToggle(user.id)}
                    />
                    <UserBadge $color={user.color}>
                      {user.icon && <UserIcon>{user.icon}</UserIcon>}
                      <span>{user.name}</span>
                    </UserBadge>
                  </UserItem>
                ))}
              </UserList>
              
              <ActionButtons>
                <ActionButton onClick={handleClear}>
                  Clear
                </ActionButton>
                {localMode === 'local' && selectedUserFilters.length > 0 && (
                  <ApplyButton onClick={handleApplyGlobalToLocal}>
                    Use Global
                  </ApplyButton>
                )}
              </ActionButtons>
            </MenuSection>
          </DropdownMenu>
        )}
      </AnimatePresence>
    </FilterButtonContainer>
  );
};