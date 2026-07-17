import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

export const searchBooks = async (query) => {
    const response = await axios.get(`${API_BASE_URL}/search`, { params: { q: query } });
    return response.data.books;
};

export const getBookDetails = async (bookId) => {
    const response = await axios.get(`${API_BASE_URL}/books/${bookId}`);
    return response.data;
};

export const saveBookmark = async (bookmark) => {
    const response = await axios.post(`${API_BASE_URL}/bookmarks`, bookmark);
    return response.data;
};

export const getBookmarks = async (bookId) => {
    const response = await axios.get(`${API_BASE_URL}/bookmarks/${bookId}`);
    return response.data.bookmarks;
};

export const updateProgress = async (progress) => {
    const response = await axios.post(`${API_BASE_URL}/progress`, progress);
    return response.data;
};

export const getDashboard = async () => {
    const response = await axios.get(`${API_BASE_URL}/dashboard`);
    return response.data;
};

export const getRecommendations = async () => {
    const response = await axios.get(`${API_BASE_URL}/recommendations`);
    return response.data.recommendations;
};
