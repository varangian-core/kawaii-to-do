export const firebaseConfigs = {
  kawaii: {
    apiKey: "AIzaSyAW5yrDL3Nif3LZ2kYEGksZYVs-8pkXKxQ",
    authDomain: "kawaiitodo-d8d42.firebaseapp.com",
    projectId: "kawaiitodo-d8d42",
    storageBucket: "kawaiitodo-d8d42.firebasestorage.app",
    messagingSenderId: "30512236201",
    appId: "1:30512236201:web:f5ea5a0784d2f2c1958bb8",
    measurementId: "G-YPYNW64HDD"
  },
  cowork: {
    apiKey: "AIzaSyAmV6obWQfCw1a98Sx2wNNsb8BPabr5vY0",
    authDomain: "coworkcornertodo.firebaseapp.com",
    projectId: "coworkcornertodo",
    storageBucket: "coworkcornertodo.firebasestorage.app",
    messagingSenderId: "1024350621713",
    appId: "1:1024350621713:web:7943b86139e3eab7b621b0",
    measurementId: "G-09NLS1CPDL"
  }
};

export function getFirebaseConfig() {
  // Check if we're on Firebase Hosting
  const hostname = window.location.hostname;
  
  if (hostname.includes('coworkcornertodo')) {
    return firebaseConfigs.cowork;
  } else if (hostname.includes('kawaiitodo')) {
    return firebaseConfigs.kawaii;
  }
  
  // Default to kawaii for local development
  return firebaseConfigs.kawaii;
}