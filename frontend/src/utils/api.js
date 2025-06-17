// Utility function for making authenticated API calls
export const authenticatedFetch = async (url, options = {}) => {
  const token = localStorage.getItem('authToken');
  
  if (!token) {
    throw new Error('No authentication token found');
  }
  
  const defaultHeaders = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
  
  const fetchOptions = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };
  
  const response = await fetch(url, fetchOptions);
  
  if (response.status === 401) {
    // Token is invalid, redirect to login
    localStorage.removeItem('authToken');
    localStorage.removeItem('userSub');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    window.location.href = '/';
    throw new Error('Authentication failed');
  }
  
  return response;
}; 