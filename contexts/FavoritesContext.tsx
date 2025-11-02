import React, { createContext, useState, useEffect, useContext, ReactNode, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';
import { useAuth } from './AuthContext';

interface FavoritesContextType {
  favoriteSymbols: Set<string>;
  isFavorite: (symbol: string) => boolean;
  toggleFavorite: (symbol: string) => Promise<void>;
  refetchFavorites: () => void;
  loading: boolean;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export const FavoritesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { session } = useAuth();
  const [favoriteSymbols, setFavoriteSymbols] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const fetchFavorites = useCallback(async () => {
    if (!session) {
      setFavoriteSymbols(new Set());
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.rpc('get_user_favorite_stocks');
    if (error) {
      console.error("Error fetching favorites:", error);
    } else {
      setFavoriteSymbols(new Set(data.map((item: any) => item.stock_symbol)));
    }
    setLoading(false);
  }, [session]);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);
  
  const isFavorite = (symbol: string) => favoriteSymbols.has(symbol);

  const toggleFavorite = async (symbol: string) => {
    if (!session) return;
    const originalFavorites = new Set(favoriteSymbols);
    
    // Optimistic update
    setFavoriteSymbols(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(symbol)) {
        newFavorites.delete(symbol);
      } else {
        newFavorites.add(symbol);
      }
      return newFavorites;
    });

    // RPC call
    const { error } = await supabase.rpc('toggle_favorite_stock', { p_symbol: symbol });
    
    if (error) {
      console.error("Error toggling favorite:", error);
      // Revert on error
      setFavoriteSymbols(originalFavorites);
    }
  };
  
  const value = { favoriteSymbols, isFavorite, toggleFavorite, refetchFavorites: fetchFavorites, loading };

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
};

export const useFavorites = (): FavoritesContextType => {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
};
