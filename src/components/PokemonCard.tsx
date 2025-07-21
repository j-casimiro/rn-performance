import React, { useState, useEffect, useCallback } from 'react';
import {
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  View,
  Text,
} from 'react-native';
import FastImage from '@d11/react-native-fast-image';

export const PokemonCard = React.memo(function PokemonCard({
  name,
  url,
  favorites,
  toggleFavorite,
}: {
  name: string;
  url: string;
  favorites: Set<string>;
  toggleFavorite: (name: string) => void;
}) {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(false);
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        setImageUrl(data.sprites?.front_default || '');
        setLoading(false);
      })
      .catch(() => {
        if (isMounted) {
          setError(true);
          setLoading(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, [url]);

  const onToggleFavorite = useCallback(
    () => toggleFavorite(name),
    [name, toggleFavorite]
  );

  let content;
  if (loading) {
    content = <ActivityIndicator style={styles.image} />;
  } else if (error || !imageUrl) {
    content = (
      <View style={[styles.image, styles.imagePlaceholder]}>
        <Text>?</Text>
      </View>
    );
  } else {
    content = (
      <FastImage
        style={styles.image}
        source={{
          uri: imageUrl,
          priority: FastImage.priority.normal,
        }}
        resizeMode={FastImage.resizeMode.contain}
      />
    );
  }

  return (
    <TouchableOpacity onPress={onToggleFavorite} style={styles.card}>
      {content}
      <Text style={styles.cardText}>
        {name.charAt(0).toUpperCase() + name.slice(1)}{' '}
        {favorites.has(name) ? '★' : ''}
      </Text>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginVertical: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 12,
  },
  image: { width: 100, height: 100, marginRight: 12 },
  imagePlaceholder: { justifyContent: 'center', alignItems: 'center' },
  cardText: { fontSize: 16, flexShrink: 1 },
});
