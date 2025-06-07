import { useEffect } from 'react';
import styled, { createGlobalStyle, keyframes } from 'styled-components';
import { useAppInitializer } from './hooks/useAppInitializer';
import { PageWrapper } from './components/layout/PageWrapper';
import { Header } from './components/layout/Header';
import { KanbanBoard } from './components/board/KanbanBoard';
import { ImagePickerModal } from './components/ImagePicker/ImagePickerModal';
import { useUIStore } from './store/uiStore';

const floatUp = keyframes`
  0% {
    transform: translateY(100vh) rotate(0deg);
    opacity: 0;
  }
  10% {
    opacity: 0.3;
  }
  90% {
    opacity: 0.3;
  }
  100% {
    transform: translateY(-100vh) rotate(360deg);
    opacity: 0;
  }
`;

const floatDiagonal = keyframes`
  0% {
    transform: translate(0, 100vh) rotate(0deg);
    opacity: 0;
  }
  10% {
    opacity: 0.2;
  }
  90% {
    opacity: 0.2;
  }
  100% {
    transform: translate(30vw, -100vh) rotate(180deg);
    opacity: 0;
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
    background: linear-gradient(to bottom, #ffeef8 0%, #e6e6fa 100%);
    color: #333;
    position: relative;
    overflow-x: hidden;
  }

  #root {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    position: relative;
  }
`;

const BackgroundHearts = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
`;

const FloatingHeart = styled.div<{ delay: number; left: string; duration: number; diagonal?: boolean; size: number; heart: string }>`
  position: absolute;
  bottom: -5vh;
  left: ${props => props.left};
  font-size: ${props => props.size}px;
  animation: ${props => props.diagonal ? floatDiagonal : floatUp} ${props => props.duration}s linear infinite;
  animation-delay: ${props => props.delay}s;
  opacity: 0;
  
  &::before {
    content: '${props => props.heart}';
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
  z-index: 1;
`;

function App() {
  const { isImagePickerOpen } = useUIStore();
  const { initializeApp } = useAppInitializer();

  useEffect(() => {
    initializeApp();
  }, [initializeApp]);

  // Generate random hearts for background animation
  const heartsEmojis = ['💕', '💖', '💗', '💝', '💓', '💞', '💘'];
  const hearts = Array.from({ length: 15 }, (_, i) => ({
    id: i,
    delay: Math.random() * 20,
    left: `${Math.random() * 100}%`,
    duration: 15 + Math.random() * 10,
    diagonal: Math.random() > 0.5,
    size: Math.random() * 20 + 20,
    heart: heartsEmojis[Math.floor(Math.random() * heartsEmojis.length)]
  }));

  try {
    return (
      <>
        <GlobalStyle />
        <BackgroundHearts>
          {hearts.map(heart => (
            <FloatingHeart
              key={heart.id}
              delay={heart.delay}
              left={heart.left}
              duration={heart.duration}
              diagonal={heart.diagonal}
              size={heart.size}
              heart={heart.heart}
            />
          ))}
        </BackgroundHearts>
        <AppContainer>
          <PageWrapper>
            <Header />
            <MainContent>
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