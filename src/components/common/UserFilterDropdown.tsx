import React, { useRef, useEffect, useState } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { useUserStore } from '../../store/userStore';
import { useUIStore } from '../../store/uiStore';

const DropdownContainer = styled.div`
  position: relative;
  z-index: 100;
`;

const FilterButton = styled.button`
  background: rgba(255, 255, 255, 0.3);
  border: 2px solid rgba(255, 255, 255, 0.5);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 2rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.4);
    transform: translateY(-1px);
  }
  
  &:active {
    transform: translateY(0);
  }
`;

const FilterIcon = styled.span`
  font-size: 1.1rem;
`;

const ActiveCount = styled.span`
  background: rgba(255, 255, 255, 0.5);
  color: #333;
  padding: 0.1rem 0.5rem;
  border-radius: 1rem;
  font-size: 0.8rem;
  font-weight: 600;
`;

const DropdownMenu = styled(motion.div)`
  position: absolute;
  top: calc(100% + 0.5rem);
  right: 0;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  min-width: 250px;
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid rgba(0, 0, 0, 0.08);
`;

const DropdownHeader = styled.div`
  padding: 1rem;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const DropdownTitle = styled.h4`
  margin: 0;
  font-size: 1rem;
  color: #333;
`;

const ClearButton = styled.button`
  background: none;
  border: none;
  color: #666;
  font-size: 0.85rem;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  transition: all 0.2s ease;
  
  &:hover {
    background: #f0f0f0;
    color: #333;
  }
`;

const UserList = styled.div`
  padding: 0.5rem;
`;

const UserItem = styled.label`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: #f8f8f8;
  }
`;

const UserCheckbox = styled.input`
  width: 18px;
  height: 18px;
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
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const UserIcon = styled.span`
  font-size: 1rem;
`;

const NoUsersMessage = styled.div`
  padding: 2rem;
  text-align: center;
  color: #666;
  font-size: 0.9rem;
`;

const FilterModeSection = styled.div`
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const FilterModeToggle = styled.div`
  display: flex;
  background: #f0f0f0;
  border-radius: 6px;
  padding: 2px;
  flex: 1;
`;

const FilterModeButton = styled.button<{ $isActive: boolean }>`
  flex: 1;
  padding: 0.25rem 0.5rem;
  border: none;
  background: ${props => props.$isActive ? 'white' : 'transparent'};
  border-radius: 4px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: ${props => props.$isActive ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'};
  
  &:hover {
    background: ${props => props.$isActive ? 'white' : 'rgba(0,0,0,0.05)'};
  }
`;

const ApplyToAllButton = styled.button`
  padding: 0.25rem 0.75rem;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: #5a67d8;
  }
  
  &:disabled {
    background: #e0e0e0;
    color: #999;
    cursor: not-allowed;
  }
`;

export const UserFilterDropdown: React.FC = () => {
  const { users } = useUserStore();
  const { 
    selectedUserFilters, 
    toggleUserFilter, 
    clearUserFilters,
    filterMode,
    setFilterMode,
    applyGlobalFiltersToAllColumns
  } = useUIStore();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const userList = Object.values(users);
  const activeFilterCount = selectedUserFilters.length;

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

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleUserToggle = (userId: string) => {
    toggleUserFilter(userId);
  };

  const handleClearAll = () => {
    clearUserFilters();
  };

  return (
    <DropdownContainer ref={dropdownRef}>
      <FilterButton onClick={handleToggle}>
        <FilterIcon>🔍</FilterIcon>
        <span>Filter by User</span>
        {activeFilterCount > 0 && (
          <ActiveCount>{activeFilterCount}</ActiveCount>
        )}
      </FilterButton>

      <AnimatePresence>
        {isOpen && (
          <DropdownMenu
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <FilterModeSection>
              <FilterModeToggle>
                <FilterModeButton 
                  $isActive={filterMode === 'global'}
                  onClick={() => setFilterMode('global')}
                >
                  Global
                </FilterModeButton>
                <FilterModeButton 
                  $isActive={filterMode === 'column'}
                  onClick={() => setFilterMode('column')}
                >
                  Per Column
                </FilterModeButton>
              </FilterModeToggle>
              {filterMode === 'global' && activeFilterCount > 0 && (
                <ApplyToAllButton 
                  onClick={() => {
                    applyGlobalFiltersToAllColumns();
                    setIsOpen(false);
                  }}
                  title="Apply current filters to all columns"
                >
                  Apply to All
                </ApplyToAllButton>
              )}
            </FilterModeSection>

            <DropdownHeader>
              <DropdownTitle>
                {filterMode === 'global' ? 'Global Filters' : 'Filter Template'}
              </DropdownTitle>
              {activeFilterCount > 0 && (
                <ClearButton onClick={handleClearAll}>
                  Clear All
                </ClearButton>
              )}
            </DropdownHeader>

            <UserList>
              {userList.length === 0 ? (
                <NoUsersMessage>
                  No users available. Add users to start filtering.
                </NoUsersMessage>
              ) : (
                userList.map(user => (
                  <UserItem key={user.id}>
                    <UserCheckbox
                      type="checkbox"
                      checked={selectedUserFilters.includes(user.id)}
                      onChange={() => handleUserToggle(user.id)}
                    />
                    <UserInfo>
                      <UserBadge $color={user.color}>
                        {user.icon && <UserIcon>{user.icon}</UserIcon>}
                        <span>{user.name}</span>
                      </UserBadge>
                    </UserInfo>
                  </UserItem>
                ))
              )}
            </UserList>
          </DropdownMenu>
        )}
      </AnimatePresence>
    </DropdownContainer>
  );
};