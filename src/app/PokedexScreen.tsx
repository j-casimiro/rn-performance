import React, {
  useCallback,
  useMemo,
  useRef,
  useEffect,
  useState,
} from 'react';
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
import {
  fetchPokemonDetails,
  getPokemonId,
} from '../utils/fetch-pokemon-details';

export default function PokedexScreen() {
  // Use zustand selectors to avoid unnecessary re-renders
  const search = useStore((state) => state.search);
  const setSearch = useStore((state) => state.setSearch);
  const favorites = useStore((state) => state.favorites);
  const toggleFavorite = useStore((state) => state.toggleFavorite);
  const [pokemonDetails, setPokemonDetails] = useState<{
    [name: string]: {
      id: number | null;
      sprite: string | null;
      types: string[];
    };
  }>({});

  // Refs to always have latest values in closures
  const setSearchRef = useRef(setSearch);

  // Keep refs in sync with latest store values to avoid stale closures in debounced and callback functions
  useEffect(() => {
    setSearchRef.current = setSearch;
  }, [setSearch]);

  // Debounce search input, always using latest setSearch
  const debouncedSetSearch = useRef(
    debounce((text: string) => setSearchRef.current(text), 300)
  );

  // Clean up debounced function on unmount to prevent memory leaks
  useEffect(() => {
    const debounced = debouncedSetSearch.current;
    return () => {
      if (debounced && debounced.cancel) {
        debounced.cancel();
      }
    };
  }, []);

  const handleSearch = useCallback((text: string) => {
    debouncedSetSearch.current(text);
  }, []);

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

  // Optimized memoization of pokemons list
  const pokemons = useMemo(() => {
    if (!data?.pages?.length) return [];
    const all = data.pages.flatMap((page) => page.results);
    if (!search) return all;
    return all.filter((pokemon) =>
      pokemon.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [data, search]);

  // Fetch additional info for visible pokemons
  useEffect(() => {
    let isMounted = true;
    const fetchDetails = async () => {
      const missing = pokemons.filter((p) => !pokemonDetails[p.name]);
      if (missing.length === 0) return;
      const promises = missing.map(async (p) => {
        const id = getPokemonId(p.url) || p.name;
        const details = await fetchPokemonDetails(id);
        return { name: p.name, ...details };
      });
      const results = await Promise.all(promises);
      if (isMounted) {
        setPokemonDetails((prev) => {
          const next = { ...prev };
          for (const r of results) {
            next[r.name] = { id: r.id, sprite: r.sprite, types: r.types };
          }
          return next;
        });
      }
    };
    fetchDetails();
    return () => {
      isMounted = false;
    };
  }, [pokemons]);

  // Use refs in renderItem to avoid stale closures
  const renderItem = useCallback(
    ({ item }: { item: { name: string; url: string } }) => {
      const details = pokemonDetails[item.name] || {};
      return (
        <View style={styles.cardContainer}>
          <PokemonCard
            name={item.name}
            url={item.url}
            favorites={favorites}
            toggleFavorite={toggleFavorite}
          />
          <View style={styles.extraInfo}>
            <View style={styles.infoText}>
              <Text style={styles.infoLine}>
                <Text style={styles.infoLabel}>ID:</Text> {details.id ?? '...'}
              </Text>
              <Text style={styles.infoLine}>
                <Text style={styles.infoLabel}>Types:</Text>{' '}
                {details.types && details.types.length > 0
                  ? details.types.join(', ')
                  : '...'}
              </Text>
            </View>
          </View>
        </View>
      );
    },
    [favorites, toggleFavorite, pokemonDetails]
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
  cardContainer: {
    backgroundColor: '#f8f8f8',
    marginVertical: 6,
    marginHorizontal: 4,
    borderRadius: 10,
    padding: 8,
    flexDirection: 'column',
    elevation: 1,
  },
  extraInfo: {
    marginHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  infoText: {
    flex: 1,
    flexDirection: 'column',
  },
  infoLine: {
    fontSize: 13,
    color: '#444',
    marginBottom: 2,
  },
  infoLabel: {
    fontWeight: 'bold',
    color: '#222',
  },
});
