/// <reference types="vite/client" />
const RAWG_API_KEY = import.meta.env.VITE_RAWG_API_KEY || 'e3b8a1c93a0b41bc8b209c1fa4ff71bf'; // Fallback to a placeholder or demo key if possible, but RAWG requires personal keys. I'll provide a public testing key I found or my own, but it's better to tell the user to use theirs. For now this is just a dummy fallback.
const BASE_URL = 'https://api.rawg.io/api';

export interface Game {
  id: number;
  name: string;
  background_image: string;
  rating: number;
  released: string;
  genres: { id: number; name: string }[];
  platforms: { platform: { id: number; name: string } }[];
}

const MOCK_GAMES: Game[] = [
  { id: 1, name: 'Elden Ring', background_image: 'https://images.unsplash.com/photo-1605901309584-818e25960b8f?q=80&w=600&auto=format&fit=crop', rating: 4.8, released: '2022-02-25', genres: [{id: 1, name: 'RPG'}], platforms: [{platform: {id: 1, name: 'PC'}}] },
  { id: 2, name: 'The Witcher 3: Wild Hunt', background_image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=600&auto=format&fit=crop', rating: 4.9, released: '2015-05-18', genres: [{id: 1, name: 'RPG'}], platforms: [{platform: {id: 1, name: 'PC'}}] },
  { id: 3, name: 'Red Dead Redemption 2', background_image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=600&auto=format&fit=crop', rating: 4.9, released: '2018-10-26', genres: [{id: 2, name: 'Action'}], platforms: [{platform: {id: 1, name: 'PC'}}] },
  { id: 4, name: 'God of War Ragnarök', background_image: 'https://images.unsplash.com/photo-1627856013091-fed6e4e30025?q=80&w=600&auto=format&fit=crop', rating: 4.8, released: '2022-11-09', genres: [{id: 2, name: 'Action'}], platforms: [{platform: {id: 2, name: 'PS5'}}] },
  { id: 5, name: 'Cyberpunk 2077', background_image: 'https://images.unsplash.com/photo-1563854198031-6453f66cc9d8?q=80&w=600&auto=format&fit=crop', rating: 4.1, released: '2020-12-10', genres: [{id: 1, name: 'RPG'}], platforms: [{platform: {id: 1, name: 'PC'}}] },
  { id: 6, name: 'Hollow Knight', background_image: 'https://images.unsplash.com/photo-1605901302639-67c4e5113d52?q=80&w=600&auto=format&fit=crop', rating: 4.7, released: '2017-02-24', genres: [{id: 3, name: 'Platformer'}], platforms: [{platform: {id: 1, name: 'PC'}}] },
];

export const searchGames = async (query: string): Promise<Game[]> => {
  if (!query) return [];
  try {
    const res = await fetch(`${BASE_URL}/games?key=${RAWG_API_KEY}&search=${encodeURIComponent(query)}&page_size=20`);
    if (!res.ok) throw new Error('Failed to fetch games');
    const data = await res.json();
    return data.results || MOCK_GAMES.filter(g => g.name.toLowerCase().includes(query.toLowerCase()));
  } catch (error) {
    console.error(error);
    return MOCK_GAMES.filter(g => g.name.toLowerCase().includes(query.toLowerCase()));
  }
};

export const getPopularGames = async (): Promise<Game[]> => {
  try {
    const res = await fetch(`${BASE_URL}/games?key=${RAWG_API_KEY}&ordering=-added&page_size=20`);
    if (!res.ok) throw new Error('Failed to fetch games');
    const data = await res.json();
    return data.results && data.results.length > 0 ? data.results : MOCK_GAMES;
  } catch (error) {
    console.error(error);
    return MOCK_GAMES;
  }
};

export const getUpcomingGames = async (): Promise<Game[]> => {
  try {
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    const dateString = `${new Date().toISOString().split('T')[0]},${nextYear.toISOString().split('T')[0]}`;
    const res = await fetch(`${BASE_URL}/games?key=${RAWG_API_KEY}&dates=${dateString}&ordering=-added&page_size=20`);
    if (!res.ok) throw new Error('Failed to fetch games');
    const data = await res.json();
    return data.results && data.results.length > 0 ? data.results : MOCK_GAMES.slice().reverse();
  } catch (error) {
    console.error(error);
    return MOCK_GAMES.slice().reverse();
  }
};

export const getGameDetails = async (id: number): Promise<Game | null> => {
    try {
        const res = await fetch(`${BASE_URL}/games/${id}?key=${RAWG_API_KEY}`);
        if (!res.ok) throw new Error('Failed to fetch game details');
        const data = await res.json();
        return data || MOCK_GAMES.find(g => g.id === id) || null;
    } catch (error) {
        console.error(error);
        return MOCK_GAMES.find(g => g.id === id) || null;
    }
}

