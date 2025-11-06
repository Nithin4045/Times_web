import { mkdir } from 'fs/promises';
import path from 'path';

/**
 * Ensures all required upload directories exist
 */
export async function ensureUploadDirectories() {
  const baseDir = process.cwd();
  const uploadDirs = [
    path.join(baseDir, 'uploads', 'aiquestions'),
    path.join(baseDir, 'uploads', 'palms'),
    path.join(baseDir, 'uploads', 'evaluate', 'static', 'files'),
    path.join(baseDir, 'temp'),
  ];

  console.log('🔧 [init] Ensuring upload directories exist...');
  
  for (const dir of uploadDirs) {
    try {
      await mkdir(dir, { recursive: true });
      console.log(`✅ [init] Directory ready: ${dir}`);
    } catch (error) {
      console.error(`❌ [init] Failed to create directory ${dir}:`, error);
    }
  }
  
  console.log('✅ [init] Upload directories initialization complete');
}

/**
 * Initialize application on startup
 */
export async function initializeApp() {
  console.log('🚀 [init] Starting application initialization...');
  
  try {
    await ensureUploadDirectories();
    console.log('✅ [init] Application initialization complete');
  } catch (error) {
    console.error('❌ [init] Application initialization failed:', error);
  }
} 