import { useEffect } from 'react';
import styled, { createGlobalStyle } from 'styled-components';
import { useAppInitializer } from './hooks/useAppInitializer';
import { PageWrapper } from './components/layout/PageWrapper';
import { Header } from './components/layout/Header';
import { KanbanBoard } from './components/board/KanbanBoard';
import { ImagePickerModal } from './components/ImagePicker/ImagePickerModal';
import { useUIStore } from './store/uiStore';

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
    background-color: #f5f5f5;
    color: #333;
  }

  #root {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }
`;

const AppContainer = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
`;

const MainContent = styled.main`
  flex: 1;
  padding: 2rem;
  overflow-y: auto;
`;

function App() {
  const { isImagePickerOpen } = useUIStore();
  const { initializeApp } = useAppInitializer();

  useEffect(() => {
    initializeApp();
  }, [initializeApp]);

  try {
    return (
      <>
        <GlobalStyle />
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