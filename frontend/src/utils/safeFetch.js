// Safe fetch utility with error handling and timeout
export const safeFetch = async (url, options = {}) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return { success: true, data, error: null };
  } catch (error) {
    clearTimeout(timeoutId);
    console.error('Safe fetch error:', error);
    return { 
      success: false, 
      data: null, 
      error: error.message || 'Network error occurred' 
    };
  }
};

// API base URL
export const API_BASE_URL = 'http://localhost:8000/api/v1';

// Health check function
export const checkHealth = async () => {
  return safeFetch(`${API_BASE_URL}/health`);
};
