import React from 'react';
import styled from 'styled-components';

const TestDiv = styled.div`
  padding: 20px;
  background: lightblue;
`;

function TestApp() {
  console.log('TestApp rendering');
  
  const [testState, setTestState] = React.useState('initial');
  
  React.useEffect(() => {
    console.log('TestApp useEffect running');
    setTestState('loaded');
  }, []);
  
  return (
    <TestDiv>
      <h1>Test App Works!</h1>
      <p>If you see this, React is working.</p>
      <p>State: {testState}</p>
      <button onClick={() => setTestState('clicked')}>Test Button</button>
    </TestDiv>
  );
}

export default TestApp;