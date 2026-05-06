#!/usr/bin/env node

/**
 * Seed script for landing page content in Firestore
 * Run this once to initialize the siteContent/landing document
 * 
 * Usage: node scripts/seedLandingContent.js
 */

import { initializeApp } from 'firebase/app'
import { getFirestore, doc, setDoc } from 'firebase/firestore'
import { DEFAULT_LANDING_CONTENT } from './src/data/landingDefaults.js'


// Firebase configuration - uses same env vars as the app
const firebaseConfig = {
  apiKey: "AIzaSyBrOyiwP-qVMa6dj9sJQYEaElbwYo0YrHo",
  authDomain: "i-jobcopilot.firebaseapp.com",
  projectId: "ai-jobcopilot",
  storageBucket: "ai-jobcopilot.firebasestorage.app",
  messagingSenderId: "815305638649",
  appId: "1:815305638649:web:172cbef45231735e645828",
  measurementId: "G-T3Z68ZMWY8"

}

console.log('🌱 Seeding landing page content to Firestore...')

try {
  // Initialize Firebase
  const app = initializeApp(firebaseConfig)
  const db = getFirestore(app)
  
  // Prepare content with placeholder image paths (will be updated with Firebase Storage URLs later)
  const content = {
    ...DEFAULT_LANDING_CONTENT,
    updatedAt: new Date().toISOString(),
    // Note: Images use local paths as placeholders
    // After uploading to Firebase Storage, update these URLs manually
  }
  
  // Write to Firestore
  const docRef = doc(db, 'siteContent', 'landing')
  await setDoc(docRef, content)
  
  console.log('✅ Successfully seeded landing page content!')
  console.log('📍 Document: siteContent/landing')
  console.log('📁 Note: Image paths are local placeholders. Upload to Firebase Storage and update URLs manually.')
  console.log('\nNext steps:')
  console.log('1. Upload images to Firebase Storage in landing-images/ folder')
  console.log('2. Get download URLs for each image')
  console.log('3. Update the Firestore document with Firebase Storage URLs')
  
} catch (error) {
  console.error('❌ Error seeding content:', error)
  process.exit(1)
}
