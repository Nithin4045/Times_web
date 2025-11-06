// API Configuration for better error handling and timeouts

export const API_CONFIG = {
  // Timeout settings
  TIMEOUT: {
    FETCH: 30000, // 30 seconds
    UPLOAD: 60000, // 60 seconds for file uploads
  },
  
  // Retry settings
  RETRY: {
    MAX_ATTEMPTS: 3,
    DELAY: 1000, // 1 second
  },
  
  // Python server endpoints
  PYTHON_SERVER: {
    BASE_URL: process.env.NEXT_PUBLIC_PYTHON_SERVER || 'http://localhost:8000/',
    ENDPOINTS: {
      PROCESS: 'process/process',
      STATUS: 'status/',
    },
  },
};

// Helper function to create fetch with timeout
export async function fetchWithTimeout(
  url: string, 
  options: RequestInit = {}, 
  timeout: number = API_CONFIG.TIMEOUT.FETCH
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    return response;
  } catch (error: any) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeout}ms`);
    }
    
    throw error;
  }
}

// Helper function for retry logic
export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  maxAttempts: number = API_CONFIG.RETRY.MAX_ATTEMPTS,
  delay: number = API_CONFIG.RETRY.DELAY
): Promise<Response> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fetchWithTimeout(url, options);
    } catch (error: any) {
      lastError = error;
      
      if (attempt === maxAttempts) {
        throw error;
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }
  
  throw lastError!;
} 