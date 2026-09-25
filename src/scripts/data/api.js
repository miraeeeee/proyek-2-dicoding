// src/scripts/data/api.js
import CONFIG from '../config.js';

export async function register(name, email, password) {
  const response = await fetch(`${CONFIG.BASE_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password })
  });
  return await response.json();
}

export async function login(email, password) {
  const response = await fetch(`${CONFIG.BASE_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  return await response.json();
}

export async function addStory(description, photo, lat, lon) {
  const token = localStorage.getItem('authToken');
  const formData = new FormData();
  formData.append('description', description);
  formData.append('photo', photo);
  if (lat && lon) {
    formData.append('lat', lat);
    formData.append('lon', lon);
  }

  const response = await fetch(`${CONFIG.BASE_URL}/stories`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData
  });
  return await response.json();
}

export async function getStories(withLocation = 0) {
  const token = localStorage.getItem('authToken');
  const response = await fetch(`${CONFIG.BASE_URL}/stories?location=${withLocation}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return await response.json();
}

export async function getStoryById(id) {
  const token = localStorage.getItem('authToken');
  const headers = {
    'Content-Type': 'application/json',
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  // PERBAIKAN: Gunakan PATH PARAMETER, bukan QUERY PARAMETER
  // Ganti baris fetch dari /stories?id=${id} menjadi /stories/${id}
  const response = await fetch(`${CONFIG.BASE_URL}/stories/${id}`, {
    headers,
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();
  if (data.error) {
    throw new Error(data.message || 'Gagal mengambil cerita');
  }

  return data; // { error: false, story: { ... } }
}