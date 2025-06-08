import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { useUserStore } from '../../store/userStore';
import { useUIStore } from '../../store/uiStore';

const FilterContainer = styled.div`
  margin-bottom: 1rem;
  position: relative;
`;

const FilterBar = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  background: rgba(248, 248, 248, 0.8);
  border-radius: 8px;
  min-height: 36px;
`;

const UserChip = styled.button<{ $color: string; $isActive: boolean }>`
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  border: 2px solid ${props => props.$isActive ? props.$color : 'transparent'};
  background: ${props => props.$isActive ? props.$color : 'rgba(0, 0, 0, 0.05)'};
  color: ${props => props.$isActive ? 'white' : '#666'};
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
`;

const UserIcon = styled.span`
  font-size: 0.9rem;
`;

const MoreButton = styled.button`
  padding: 0.25rem 0.5rem;
  border-radius: 1rem;
  border: 2px dashed #ccc;
  background: transparent;
  color: #666;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: #999;
    background: rgba(0, 0, 0, 0.05);
  }
`;

const ApplyGlobalButton = styled.button`
  margin-left: auto;
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  border: 1px solid #667eea;
  background: transparent;
  color: #667eea;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  
  &:hover {
    background: #667eea;
    color: white;
  }
`;

const ClearButton = styled.button`
  padding: 0.25rem 0.5rem;
  border-radius: 1rem;
  border: none;
  background: transparent;
  color: #999;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    color: #666;
    background: rgba(0, 0, 0, 0.05);
  }
`;

const DropdownMenu = styled(motion.div)`
  position: absolute;
  top: calc(100% + 0.25rem);
  left: 0;
  right: 0;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  max-height: 200px;
  overflow-y: auto;
  z-index: 10;
  border: 1px solid rgba(0, 0, 0, 0.08);
`;

const UserListItem = styled.label`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  cursor: pointer;
  transition: background 0.2s ease;
  
  &:hover {
    background: #f8f8f8;
  }
`;

const UserCheckbox = styled.input`
  cursor: pointer;
  accent-color: #667eea;
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
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
`;

interface ColumnUserFilterProps {
  columnId: string;
}

export const ColumnUserFilter: React.FC<ColumnUserFilterProps> = ({ columnId }) => {
  const { users } = useUserStore();
  const { 
    columnUserFilters, 
    selectedUserFilters,
    filterMode,
    toggleColumnUserFilter, 
    clearColumnFilters,
    setColumnFilters
  } = useUIStore();
  
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const userList = Object.values(users);
  const activeFilters = columnUserFilters[columnId] || [];
  const maxVisibleUsers = 3;
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  const handleUserToggle = (userId: string) => {
    toggleColumnUserFilter(columnId, userId);
  };

  const handleApplyGlobal = () => {
    if (filterMode === 'global' && selectedUserFilters.length > 0) {
      setColumnFilters(columnId, selectedUserFilters);
    }
  };

  const handleClear = () => {
    clearColumnFilters(columnId);
  };

  const visibleUsers = userList.slice(0, maxVisibleUsers);
  const hiddenUsers = userList.slice(maxVisibleUsers);
  const activeHiddenCount = hiddenUsers.filter(u => activeFilters.includes(u.id)).length;

  return (
    <FilterContainer ref={dropdownRef}>
      <FilterBar>
        {visibleUsers.map(user => (
          <UserChip
            key={user.id}
            $color={user.color}
            $isActive={activeFilters.includes(user.id)}
            onClick={() => handleUserToggle(user.id)}
            title={user.name}
          >
            {user.icon && <UserIcon>{user.icon}</UserIcon>}
            <span>{user.name}</span>
          </UserChip>
        ))}
        
        {hiddenUsers.length > 0 && (
          <MoreButton onClick={() => setShowDropdown(!showDropdown)}>
            +{hiddenUsers.length} {activeHiddenCount > 0 && `(${activeHiddenCount})`}
          </MoreButton>
        )}
        
        {activeFilters.length > 0 && (
          <ClearButton onClick={handleClear}>
            Clear
          </ClearButton>
        )}
        
        {filterMode === 'global' && selectedUserFilters.length > 0 && (
          <ApplyGlobalButton onClick={handleApplyGlobal}>
            Apply Global Filter
          </ApplyGlobalButton>
        )}
      </FilterBar>

      <AnimatePresence>
        {showDropdown && hiddenUsers.length > 0 && (
          <DropdownMenu
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {hiddenUsers.map(user => (
              <UserListItem key={user.id}>
                <UserCheckbox
                  type="checkbox"
                  checked={activeFilters.includes(user.id)}
                  onChange={() => handleUserToggle(user.id)}
                />
                <UserInfo>
                  <UserBadge $color={user.color}>
                    {user.icon && <UserIcon>{user.icon}</UserIcon>}
                    <span>{user.name}</span>
                  </UserBadge>
                </UserInfo>
              </UserListItem>
            ))}
          </DropdownMenu>
        )}
      </AnimatePresence>
    </FilterContainer>
  );
};