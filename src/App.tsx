import { useEffect, useState } from 'react';
import styled, { createGlobalStyle, keyframes } from 'styled-components';
import { useAppInitializer } from './hooks/useAppInitializer';
import { PageWrapper } from './components/layout/PageWrapper';
import { Header } from './components/layout/Header';
import { EditModeToggle } from './components/layout/EditModeToggle';
import { KanbanBoard } from './components/board/KanbanBoard';
import { ImagePickerModal } from './components/ImagePicker/ImagePickerModal';
import { AutoDeleteConfig } from './components/common/AutoDeleteConfig';
import { useUIStore } from './store/uiStore';
import { DndContext, DragOverlay, DragStartEvent, DragEndEvent, PointerSensor, useSensor, useSensors, closestCorners } from '@dnd-kit/core';
import { IconPalette, ICON_TYPES } from './components/IconPalette/IconPalette';
import { useBoardStore } from './store/boardStore';
import { ToDoCard } from './components/ToDo/ToDoCard';


const floatDiagonal = keyframes`
  from {
    transform: translate(-100px, 0) rotate(0deg);
  }
  to {
    transform: translate(calc(100vw + 100px), -100vh) rotate(720deg);
  }
`;

const floatDiagonalReverse = keyframes`
  from {
    transform: translate(calc(100vw + 100px), 0) rotate(0deg);
  }
  to {
    transform: translate(-100px, -100vh) rotate(-720deg);
  }
`;

const GlobalStyle = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
      'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
      sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    background: #ffeef8;
    color: #333;
    position: relative;
    overflow-x: hidden;
  }

  #root {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    position: relative;
    background: linear-gradient(to bottom, rgba(255, 238, 248, 0.8) 0%, rgba(230, 230, 250, 0.8) 100%);
  }
`;

const BackgroundHearts = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
`;

const FloatingHeart = styled.div<{ $delay: number; $left: string; $duration: number; $diagonal?: boolean; $reverse?: boolean; $size: number; $heart: string; $top: string }>`
  position: absolute;
  top: ${props => props.$top};
  left: ${props => props.$reverse ? 'auto' : props.$left};
  right: ${props => props.$reverse ? props.$left : 'auto'};
  font-size: ${props => props.$size}px;
  animation: ${props => props.$reverse ? floatDiagonalReverse : floatDiagonal} ${props => props.$duration}s linear infinite;
  animation-delay: ${props => props.$delay}s;
  filter: blur(${props => props.$size > 25 ? '1px' : '0px'});
  color: #ff69b4;
  opacity: 0.3;
  
  &::before {
    content: '${props => props.$heart}';
  }
`;

const AppContainer = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  position: relative;
  z-index: 1;
`;

const MainContent = styled.main`
  flex: 1;
  padding: 2rem;
  overflow-y: auto;
  position: relative;
  min-height: 600px;
`;

const DragOverlayContainer = styled.div`
  cursor: grabbing;
  transform: rotate(3deg);
`;

function App() {
  const { isImagePickerOpen, isEditMode } = useUIStore();
  const { initializeApp } = useAppInitializer();
  const { updateTask, tasks, columns, columnOrder, moveTask, reorderColumns } = useBoardStore();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeType, setActiveType] = useState<'task' | 'column' | 'user' | 'icon' | null>(null);
  const [activeUser, setActiveUser] = useState<any>(null);
  const [activeIconType, setActiveIconType] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    initializeApp();
  }, [initializeApp]);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const activeIdStr = active.id as string;
    setActiveId(activeIdStr);
    
    // Determine what we're dragging
    if (active.data.current?.iconType) {
      setActiveType('icon');
      setActiveIconType(active.data.current.iconType);
    } else if (active.data.current?.type === 'user') {
      setActiveType('user');
      setActiveUser(active.data.current.user);
    } else if (tasks[activeIdStr]) {
      setActiveType('task');
    } else if (columns[activeIdStr]) {
      setActiveType('column');
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) {
      resetDragState();
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;
    
    // Handle icon drops on tasks
    if (activeType === 'icon' && tasks[overId]) {
      const currentIcons = tasks[overId].icons || [];
      if (!currentIcons.includes(activeIconType!)) {
        updateTask(overId, { 
          icons: [...currentIcons, activeIconType!] 
        });
      }
      resetDragState();
      return;
    }
    
    // Handle user drops on tasks
    if (activeType === 'user' && tasks[overId]) {
      const user = active.data.current?.user;
      if (user) {
        const currentUserIds = tasks[overId].assignedUserIds || [];
        if (!currentUserIds.includes(user.id)) {
          updateTask(overId, { 
            assignedUserIds: [...currentUserIds, user.id] 
          });
        }
      }
      resetDragState();
      return;
    }

    // Handle column reordering
    if (activeType === 'column' && activeId !== overId) {
      const oldIndex = columnOrder.indexOf(activeId);
      const newIndex = columnOrder.indexOf(overId);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrder = [...columnOrder];
        newOrder.splice(oldIndex, 1);
        newOrder.splice(newIndex, 0, activeId);
        reorderColumns(newOrder);
      }
    }
    
    // Handle task movement
    if (activeType === 'task') {
      const activeTask = tasks[activeId];
      if (!activeTask) return;

      // Find source column
      let sourceColumnId: string | null = null;
      for (const [columnId, column] of Object.entries(columns)) {
        if (column.taskIds.includes(activeId)) {
          sourceColumnId = columnId;
          break;
        }
      }

      if (!sourceColumnId) return;

      // Determine destination column and index
      let destColumnId = sourceColumnId;
      let destIndex = 0;

      // If dropping on a column
      if (columns[overId]) {
        destColumnId = overId;
        destIndex = columns[overId].taskIds.length;
      } 
      // If dropping on a task
      else if (tasks[overId]) {
        // Find which column contains the target task
        for (const [columnId, column] of Object.entries(columns)) {
          const taskIndex = column.taskIds.indexOf(overId);
          if (taskIndex !== -1) {
            destColumnId = columnId;
            // Insert after the target task
            destIndex = taskIndex + 1;
            break;
          }
        }
      }

      if (sourceColumnId && destColumnId) {
        moveTask(activeId, sourceColumnId, destColumnId, destIndex);
      }
    }

    resetDragState();
  };

  const resetDragState = () => {
    setActiveId(null);
    setActiveType(null);
    setActiveUser(null);
    setActiveIconType(null);
  };

  // Generate many hearts for diagonal animation
  const heartsEmojis = ['💕', '💖', '💗', '💝', '💓', '💞', '💘'];
  const hearts = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    delay: (i * 0.7) + Math.random() * 3, // Staggered start times
    left: `${-10 + Math.random() * 120}%`, // Start positions across and beyond screen
    top: `${Math.random() * 100}%`, // Random vertical positions
    duration: 20 + Math.random() * 15, // Varied speeds
    diagonal: true, // All diagonal
    reverse: i % 2 === 0, // Half go opposite direction
    size: Math.random() * 25 + 15, // Various sizes
    heart: heartsEmojis[Math.floor(Math.random() * heartsEmojis.length)]
  }));

  try {
    return (
      <>
        <GlobalStyle />
        <DndContext 
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart} 
          onDragEnd={handleDragEnd}
        >
          <AppContainer>
            <PageWrapper>
              <Header />
              <EditModeToggle />
              {isEditMode && <AutoDeleteConfig />}
              <MainContent>
                <BackgroundHearts>
                  {hearts.map(heart => (
                    <FloatingHeart
                      key={heart.id}
                      $delay={heart.delay}
                      $left={heart.left}
                      $top={heart.top}
                      $duration={heart.duration}
                      $diagonal={heart.diagonal}
                      $reverse={heart.reverse}
                      $size={heart.size}
                      $heart={heart.heart}
                    />
                  ))}
                </BackgroundHearts>
                <KanbanBoard />
              </MainContent>
            </PageWrapper>
            {isImagePickerOpen && <ImagePickerModal />}
            <IconPalette isVisible={isEditMode} />
          </AppContainer>
          <DragOverlay dropAnimation={null}>
            {activeType === 'icon' && activeIconType && (() => {
              const icon = ICON_TYPES[activeIconType as keyof typeof ICON_TYPES];
              const IconComponent = icon.icon;
              return (
                <div style={{
                  background: icon.bgColor,
                  width: '44px',
                  height: '44px',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                }}>
                  <IconComponent />
                </div>
              );
            })()}
            {activeId && activeType === 'task' && tasks[activeId] && (
              <DragOverlayContainer>
                <ToDoCard task={tasks[activeId]} isDragging={false} />
              </DragOverlayContainer>
            )}
            {activeType === 'user' && activeUser && (
              <DragOverlayContainer>
                <div style={{
                  background: activeUser.color,
                  color: 'white',
                  padding: '0.5rem 1rem',
                  borderRadius: '2rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.9rem',
                  boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
                }}>
                  {activeUser.icon && <span style={{ fontSize: '1.2rem' }}>{activeUser.icon}</span>}
                  <span>{activeUser.name}</span>
                </div>
              </DragOverlayContainer>
            )}
          </DragOverlay>
        </DndContext>
      </>
    );
  } catch (error) {
    console.error('Error rendering App:', error);
    return <div>Error loading app - check console</div>;
  }
}

export default App;