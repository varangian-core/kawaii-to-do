import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { Modal } from '../common/Modal';
import { useUIStore } from '../../store/uiStore';
import { useBoardStore } from '../../store/boardStore';

const CategoryTabs = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  border-bottom: 2px solid #e0e0e0;
  padding-bottom: 0.5rem;
`;

const CategoryTab = styled.button<{ $active: boolean }>`
  background: none;
  border: none;
  padding: 0.5rem 1rem;
  font-size: 1rem;
  font-weight: ${props => props.$active ? '600' : '400'};
  color: ${props => props.$active ? '#667eea' : '#666'};
  cursor: pointer;
  position: relative;
  transition: all 0.2s ease;
  
  &:hover {
    color: #667eea;
  }
  
  ${props => props.$active && `
    &::after {
      content: '';
      position: absolute;
      bottom: -0.75rem;
      left: 0;
      right: 0;
      height: 3px;
      background: #667eea;
    }
  `}
`;

const ImageGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 1rem;
  max-height: 400px;
  overflow-y: auto;
  padding: 0.5rem;
`;

const ImageCard = styled(motion.div)<{ gradient?: string }>`
  position: relative;
  aspect-ratio: 1;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  background: ${props => props.gradient || '#f0f0f0'};
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    transform: scale(1.05);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  }
`;

const Image = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const GradientLabel = styled.span`
  color: white;
  font-weight: 600;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
  font-size: 0.9rem;
`;

const RemoveBackgroundButton = styled.button`
  background: #ff6b6b;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  margin-bottom: 1rem;
  width: 100%;
  
  &:hover {
    background: #ff5252;
  }
`;

const LoadingMessage = styled.div`
  text-align: center;
  color: #666;
  padding: 2rem;
`;

const EmptyMessage = styled.div`
  text-align: center;
  color: #999;
  padding: 3rem;
  
  p {
    margin-bottom: 1rem;
  }
  
  code {
    background: #f0f0f0;
    padding: 0.2rem 0.4rem;
    border-radius: 4px;
    font-size: 0.9rem;
  }
`;

interface ImageManifest {
  images: Array<{ name: string; path: string }>;
  [key: string]: any;
}

const defaultGradients = [
  { name: 'Sunset', gradient: 'linear-gradient(135deg, #ffeaa7 0%, #fab1a0 100%)' },
  { name: 'Ocean', gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
  { name: 'Forest', gradient: 'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)' },
  { name: 'Cherry', gradient: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)' },
  { name: 'Lavender', gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)' },
  { name: 'Mint', gradient: 'linear-gradient(135deg, #d4fc79 0%, #96e6a1 100%)' },
  { name: 'Peach', gradient: 'linear-gradient(135deg, #ffdde1 0%, #ee9ca7 100%)' },
  { name: 'Sky', gradient: 'linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)' },
];

export const ImagePickerModal: React.FC = () => {
  const { isImagePickerOpen, imagePickerTargetId, closeImagePicker } = useUIStore();
  const { updateTask, tasks } = useBoardStore();
  const [imageManifest, setImageManifest] = useState<ImageManifest | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('gradients');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isImagePickerOpen) {
      fetchImageManifest();
    }
  }, [isImagePickerOpen]);

  const fetchImageManifest = async () => {
    try {
      const response = await fetch('/images.json');
      
      if (response.ok) {
        const data = await response.json();
        setImageManifest(data);
        
        // Set the first category as default if images exist
        const categories = Object.keys(data).filter(key => key !== 'images' && typeof data[key] === 'object');
        const hasImages = categories.some(cat => data[cat].images && data[cat].images.length > 0);
        
        if (hasImages && categories.length > 0) {
          setSelectedCategory(categories[0]);
        } else {
          setSelectedCategory('gradients');
        }
      } else {
        console.error('Failed to fetch images.json:', response.statusText);
      }
    } catch (error) {
      console.error('Error loading image manifest:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelect = (imagePath: string) => {
    if (imagePickerTargetId) {
      updateTask(imagePickerTargetId, { backgroundImageUrl: imagePath });
      closeImagePicker();
    }
  };

  const handleRemoveBackground = () => {
    if (imagePickerTargetId) {
      updateTask(imagePickerTargetId, { backgroundImageUrl: undefined });
      closeImagePicker();
    }
  };

  const getCategories = () => {
    const categories = ['gradients'];
    if (imageManifest) {
      const imageCats = Object.keys(imageManifest).filter(key => key !== 'images' && typeof imageManifest[key] === 'object');
      categories.push(...imageCats);
    }
    return categories;
  };

  const getCategoryImages = () => {
    if (selectedCategory === 'gradients') {
      return defaultGradients;
    }
    if (!imageManifest || !selectedCategory) return [];
    const category = imageManifest[selectedCategory];
    return category?.images || [];
  };

  const currentTask = imagePickerTargetId ? tasks[imagePickerTargetId] : null;
  const hasBackground = currentTask?.backgroundImageUrl;

  return (
    <Modal
      isOpen={isImagePickerOpen}
      onClose={closeImagePicker}
      title="Choose Background Image"
    >
      {loading ? (
        <LoadingMessage>Loading images...</LoadingMessage>
      ) : (
        <>
          {hasBackground && (
            <RemoveBackgroundButton onClick={handleRemoveBackground}>
              Remove Current Background
            </RemoveBackgroundButton>
          )}
          
          <CategoryTabs>
            {getCategories().map(category => (
              <CategoryTab
                key={category}
                $active={category === selectedCategory}
                onClick={() => setSelectedCategory(category)}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </CategoryTab>
            ))}
          </CategoryTabs>
          
          <ImageGrid>
            {selectedCategory === 'gradients' ? (
              getCategoryImages().map((item: any, index: number) => (
                <ImageCard
                  key={item.name}
                  gradient={item.gradient}
                  onClick={() => handleImageSelect(item.gradient)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <GradientLabel>{item.name}</GradientLabel>
                </ImageCard>
              ))
            ) : (
              getCategoryImages().map((image: { name: string; path: string }, index: number) => (
                <ImageCard
                  key={image.path}
                  onClick={() => handleImageSelect(image.path)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Image src={image.path} alt={image.name} />
                </ImageCard>
              ))
            )}
          </ImageGrid>
          
          {selectedCategory !== 'gradients' && getCategoryImages().length === 0 && (
            <EmptyMessage>
              <p>No images in this category!</p>
              <p>Add images to: <code>public/images/{selectedCategory}/</code></p>
            </EmptyMessage>
          )}
        </>
      )}
    </Modal>
  );
};