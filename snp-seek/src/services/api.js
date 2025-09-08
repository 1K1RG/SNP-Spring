import axios from "axios";

const api = axios.create({
    baseURL: process.env.REACT_APP_API_URL,
    headers: {
      "Content-Type": "application/json",
    },
    withCredentials: true 
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  return config;
});


api.interceptors.response.use(
  (response) => response, // Return the response if no error occurs
  (error) => {
    if (error.response && error.response.status === 401) {
      
      // Redirect to the home page 
      window.location.href = "/";
      localStorage.removeItem("token")
      localStorage.removeItem("role")
      localStorage.removeItem("username")
    }

    return Promise.reject(error); 
  }
);
  

export default api;
