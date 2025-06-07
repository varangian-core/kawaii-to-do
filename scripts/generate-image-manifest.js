const fs = require('fs');
const path = require('path');

const IMAGES_DIR = path.join(__dirname, '..', 'public', 'images');
const OUTPUT_FILE = path.join(__dirname, '..', 'public', 'images.json');

function getImagesFromDirectory(dirPath, relativePath = '') {
  const items = fs.readdirSync(dirPath);
  const images = [];
  const subdirs = {};

  items.forEach(item => {
    const fullPath = path.join(dirPath, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      // Recursively get images from subdirectories
      const subPath = path.join(relativePath, item);
      subdirs[item] = getImagesFromDirectory(fullPath, subPath);
    } else if (stat.isFile() && isImageFile(item)) {
      // Add image files to the list
      images.push({
        name: item,
        path: path.join('/images', relativePath, item).replace(/\\/g, '/')
      });
    }
  });

  return {
    images,
    ...subdirs
  };
}

function isImageFile(filename) {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
  const ext = path.extname(filename).toLowerCase();
  return imageExtensions.includes(ext);
}

function generateManifest() {
  console.log('Generating image manifest...');
  
  try {
    // Check if images directory exists
    if (!fs.existsSync(IMAGES_DIR)) {
      console.log('Images directory does not exist. Creating it...');
      fs.mkdirSync(IMAGES_DIR, { recursive: true });
    }

    // Get all images recursively
    const manifest = getImagesFromDirectory(IMAGES_DIR);
    
    // Write the manifest to JSON file
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(manifest, null, 2));
    
    console.log(`Image manifest generated successfully at ${OUTPUT_FILE}`);
    
    // Count total images
    let totalImages = 0;
    function countImages(obj) {
      if (obj.images) {
        totalImages += obj.images.length;
      }
      Object.keys(obj).forEach(key => {
        if (key !== 'images' && typeof obj[key] === 'object') {
          countImages(obj[key]);
        }
      });
    }
    countImages(manifest);
    
    console.log(`Total images found: ${totalImages}`);
  } catch (error) {
    console.error('Error generating image manifest:', error);
    process.exit(1);
  }
}

// Run the generator
generateManifest();