import { create } from 'zustand';

type StoreState = {
  search: string;
  favorites: Set<string>;
  setSearch: (search: string) => void;
  toggleFavorite: (name: string) => void;
};

export const useStore = create<StoreState>((set) => ({
  search: '',
  favorites: new Set<string>(),
  setSearch: (search: string) => set(() => ({ search })),
  toggleFavorite: (name: string) =>
    set((state) => {
      const favorites = new Set(state.favorites);
      if (favorites.has(name)) favorites.delete(name);
      else favorites.add(name);
      return { favorites };
    }),
}));
