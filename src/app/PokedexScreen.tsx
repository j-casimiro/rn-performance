import React, { useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useInfiniteQuery } from '@tanstack/react-query';
import debounce from 'lodash.debounce';
import { useStore } from '../utils/store';
import { fetchPokemons } from '../utils/fetch-pokemon';
import { PokemonCard } from '../components/PokemonCard';

export default function PokedexScreen() {
  // Use zustand selectors to avoid unnecessary re-renders
  const search = useStore((state) => state.search);
  const setSearch = useStore((state) => state.setSearch);
  const favorites = useStore((state) => state.favorites);
  const toggleFavorite = useStore((state) => state.toggleFavorite);

  // UseInfiniteQuery for paginated data
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useInfiniteQuery({
    queryKey: ['pokemons'],
    queryFn: fetchPokemons,
    getNextPageParam: (lastPage, pages) =>
      lastPage.next ? pages.length : undefined,
    initialPageParam: 0,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Debounce search input
  const debouncedSetSearch = useRef(debounce(setSearch, 300)).current;

  const handleSearch = useCallback(
    (text: string) => {
      debouncedSetSearch(text.toLowerCase());
    },
    [debouncedSetSearch]
  );

  // Memoize pokemons list for performance
  const pokemons = useMemo(() => {
    if (!data) return [];
    const all = data.pages.flatMap((page) => page.results);
    if (!search) return all;
    return all.filter((pokemon) => pokemon.name.includes(search));
  }, [data, search]);

  const renderItem = useCallback(
    ({ item }: { item: { name: string; url: string } }) => (
      <PokemonCard
        name={item.name}
        url={item.url}
        favorites={favorites}
        toggleFavorite={toggleFavorite}
      />
    ),
    [favorites, toggleFavorite]
  );

  // Remove delayedFetching logic and use isFetchingNextPage directly

  const ListHeaderComponent = useMemo(
    () => (
      <View style={styles.header}>
        <Text style={styles.title}>Optimized Pokédex</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search Pokémon"
          onChangeText={handleSearch}
          autoCapitalize="none"
          autoCorrect={false}
          clearButtonMode="while-editing"
          defaultValue={search}
        />
      </View>
    ),
    [handleSearch, search]
  );

  const ListFooterComponent = useMemo(() => {
    if (isFetchingNextPage) {
      return (
        <View style={styles.footer}>
          <ActivityIndicator size="small" />
        </View>
      );
    }
    if (!hasNextPage && pokemons.length > 0) {
      return (
        <View style={styles.footer}>
          <Text>No more Pokémon.</Text>
        </View>
      );
    }
    return null;
  }, [isFetchingNextPage, hasNextPage, pokemons.length]);

  const ListEmptyComponent = useMemo(
    () => (
      <View style={styles.center}>
        <Text>No Pokémon found.</Text>
      </View>
    ),
    []
  );

  if (isLoading)
    return <ActivityIndicator size="large" style={styles.center} />;
  if (isError) return <Text style={styles.center}>Something went wrong.</Text>;

  return (
    <View style={styles.container}>
      <FlatList
        data={pokemons}
        renderItem={renderItem}
        keyExtractor={(item) => item.name}
        onEndReached={() => hasNextPage && fetchNextPage()}
        onEndReachedThreshold={0.5}
        ListHeaderComponent={ListHeaderComponent}
        ListFooterComponent={ListFooterComponent}
        ListEmptyComponent={ListEmptyComponent}
        initialNumToRender={20}
        maxToRenderPerBatch={20}
        windowSize={7}
        removeClippedSubviews
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    width: '90%',
  },
  listContent: {
    paddingBottom: 16,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
    width: '100%',
    textAlign: 'center',
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  footer: { padding: 16, alignItems: 'center', width: '100%', minHeight: 24 },
});
