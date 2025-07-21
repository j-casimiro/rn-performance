import { View, StyleSheet } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import PokedexScreen from './PokedexScreen';

const queryClient = new QueryClient();

export default function RootLayout() {
  return (
    <View style={styles.container}>
      <QueryClientProvider client={queryClient}>
        <PokedexScreen />
      </QueryClientProvider>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});
