import { useEffect } from 'react';
import styled, { createGlobalStyle, keyframes } from 'styled-components';
import { useAppInitializer } from './hooks/useAppInitializer';
import { PageWrapper } from './components/layout/PageWrapper';
import { Header } from './components/layout/Header';
import { EditModeToggle } from './components/layout/EditModeToggle';
import { KanbanBoard } from './components/board/KanbanBoard';
import { ImagePickerModal } from './components/ImagePicker/ImagePickerModal';
import { useUIStore } from './store/uiStore';


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

function App() {
  const { isImagePickerOpen } = useUIStore();
  const { initializeApp } = useAppInitializer();

  useEffect(() => {
    initializeApp();
  }, [initializeApp]);

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
        <AppContainer>
          <PageWrapper>
            <Header />
            <EditModeToggle />
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
        </AppContainer>
      </>
    );
  } catch (error) {
    console.error('Error rendering App:', error);
    return <div>Error loading app - check console</div>;
  }
}

export default App;