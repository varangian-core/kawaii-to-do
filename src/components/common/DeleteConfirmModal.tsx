import React from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';

const Overlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(5px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
`;

const ModalContainer = styled(motion.div)`
  background: linear-gradient(135deg, #ffffff 0%, #ffeaa7 100%);
  border-radius: 16px;
  padding: 1.5rem;
  max-width: 320px;
  width: 90%;
  max-height: 80vh;
  box-shadow: 0 20px 60px rgba(255, 182, 193, 0.4);
  border: 2px solid rgba(255, 182, 193, 0.3);
  position: relative;
  overflow: hidden;
  
  @media (max-width: 480px) {
    padding: 1.25rem;
    max-width: 90%;
  }
`;

const Content = styled.div`
  position: relative;
  z-index: 1;
  display: flex;
  align-items: flex-start;
  gap: 1rem;
`;

const IconWrapper = styled(motion.div)`
  font-size: 2rem;
  filter: drop-shadow(0 4px 8px rgba(255, 107, 107, 0.3));
  flex-shrink: 0;
  margin-top: 0.25rem;
  
  @media (max-width: 480px) {
    font-size: 1.75rem;
  }
`;

const TextContent = styled.div`
  flex: 1;
  text-align: left;
`;

const Title = styled(motion.h2)`
  font-size: 1.25rem;
  color: #333;
  margin: 0 0 0.5rem 0;
  font-weight: 600;
  background: linear-gradient(135deg, #ff6b6b 0%, #ff5252 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  
  @media (max-width: 480px) {
    font-size: 1.1rem;
  }
`;

const Message = styled(motion.p)`
  font-size: 0.9rem;
  color: #666;
  margin: 0 0 1.25rem 0;
  line-height: 1.4;
  word-break: break-word;
  
  strong {
    color: #333;
    background: rgba(255, 182, 193, 0.2);
    padding: 0.1rem 0.3rem;
    border-radius: 4px;
    font-weight: 500;
    display: inline-block;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  @media (max-width: 480px) {
    font-size: 0.85rem;
  }
`;

const ButtonContainer = styled(motion.div)`
  display: flex;
  gap: 0.75rem;
  justify-content: center;
  flex-wrap: wrap;
  
  @media (max-width: 480px) {
    gap: 0.5rem;
  }
`;

const Button = styled(motion.button)`
  border: none;
  border-radius: 8px;
  padding: 0.5rem 1.25rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
  min-width: 85px;
  
  @media (max-width: 480px) {
    padding: 0.4rem 1rem;
    font-size: 0.8rem;
    min-width: 75px;
  }
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: rgba(255, 255, 255, 0.3);
    transition: left 0.3s ease;
  }
  
  &:hover::before {
    left: 100%;
  }
`;

const ConfirmButton = styled(Button)`
  background: linear-gradient(135deg, #ff6b6b 0%, #ff5252 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(255, 107, 107, 0.3);
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(255, 107, 107, 0.4);
  }
  
  &:active {
    transform: translateY(0);
  }
`;

const CancelButton = styled(Button)`
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  color: #666;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
  }
  
  &:active {
    transform: translateY(0);
  }
`;

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  taskContent: string;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  taskContent,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <Overlay
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <ModalContainer
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ 
              type: "spring", 
              duration: 0.3,
              stiffness: 300,
              damping: 30
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <Content>
              <IconWrapper
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ 
                  type: "spring", 
                  delay: 0.1,
                  stiffness: 200,
                  damping: 20 
                }}
              >
                🗑️
              </IconWrapper>
              
              <TextContent>
                <Title
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  Delete Task?
                </Title>
                
                <Message
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.25 }}
                >
                  Are you sure you want to delete <strong>{taskContent}</strong>? This action cannot be undone.
                </Message>
                
                <ButtonContainer
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <CancelButton
                    onClick={onClose}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    Cancel
                  </CancelButton>
                  <ConfirmButton
                    onClick={() => {
                      onConfirm();
                      onClose();
                    }}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    Delete
                  </ConfirmButton>
                </ButtonContainer>
              </TextContent>
            </Content>
          </ModalContainer>
        </Overlay>
      )}
    </AnimatePresence>
  );
};