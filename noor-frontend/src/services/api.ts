// import axios from 'axios';
// import { Platform } from 'react-native';

// // ✅ PRODUCTION BACKEND URL (AWS)
// const PROD_API_URL = "https://noorclient.prolync.in/api";

// // ✅ Decide API based on environment
// const getApiUrl = () => {
//     if (__DEV__) {
//         if (Platform.OS === 'web') {
//             return 'http://localhost:5000/api';
//         } else if (Platform.OS === 'android') {
//             return 'http://10.0.2.2:5000/api'; // Android Emulator localhost
//         } else {
//             return 'http://localhost:5000/api'; // iOS Simulator
//         }
//     }
//     return PROD_API_URL;
// };

// const API_URL = getApiUrl();

// const api = axios.create({
//     baseURL: API_URL,
//     headers: {
//         'Content-Type': 'application/json',
//     },
//     timeout: 10000,
// });

// // ✅ Auth token handler
// export const setAuthToken = (token: string | null) => {
//     if (token) {
//         api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
//     } else {
//         delete api.defaults.headers.common['Authorization'];
//     }
// };

// export default api;



// import axios from "axios";
// import { Platform } from "react-native";

// // ✅ Determine Base URL based on Platform
// // Android Emulator uses 10.0.2.2 to access host localhost.
// // iOS Simulator uses localhost.
// // Web uses localhost.
// const getBaseUrl = () => {
//     if (Platform.OS === 'android') {
//         return "http://10.0.2.2:5000/api";
//     }
//     return "http://localhost:5000/api";
// };

// export const API_URL = getBaseUrl();
// export const BASE_URL = API_URL.replace(/\/api$/, "");

// const api = axios.create({
//     baseURL: API_URL,
//     headers: {
//         "Content-Type": "application/json",
//     },
//     timeout: 10000,
// });

// // ✅ Auth token handler
// export const setAuthToken = (token: string | null) => {
//     if (token) {
//         api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
//     } else {
//         delete api.defaults.headers.common["Authorization"];
//     }
// };

// export default api;



// import axios from "axios";
// import { Platform } from "react-native";

// // ✅ Determine Base URL based on Platform
// // Android Emulator uses 10.0.2.2 to access host localhost.
// // iOS Simulator uses localhost.
// // Web uses localhost.
// const getBaseUrl = () => {
//     if (Platform.OS === 'android') {
//         return "http://10.0.2.2:5000/api";
//     }
//     return "http://localhost:5000/api";
// };

// export const API_URL = getBaseUrl();
// export const BASE_URL = API_URL.replace(/\/api$/, "");

// const api = axios.create({
//     baseURL: API_URL,
//     headers: {
//         "Content-Type": "application/json",
//     },
//     timeout: 10000,
// });

// // ✅ Auth token handler
// export const setAuthToken = (token: string | null) => {
//     if (token) {
//         api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
//     } else {
//         delete api.defaults.headers.common["Authorization"];
//     }
// };

// export default api;

import axios from "axios";
import { Platform } from "react-native";

const LOCAL_API = "http://localhost:5000/api";
const PROD_API = "https://noorbuilders.com/api";

export const API_URL =
  Platform.OS === "web" ? LOCAL_API : PROD_API;

export const BASE_URL =
  Platform.OS === "web"
    ? "http://localhost:5000"
    : "https://noorbuilders.com";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

export const setAuthToken = (token: string | null) => {
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common["Authorization"];
  }
};

export default api;
