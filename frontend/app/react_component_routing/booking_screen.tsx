import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
} from 'react-native';

// UPDATE this URL every time you restart ngrok!
const API_URL = 'http://172.20.10.2:8000/services/';

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1611892440504-42a792e24d32?q=80&w=2070&auto=format&fit=crop';


interface Service {
  id: number;
  name: string;
  description?: string;   // '?' -> this field is optional(fallback value if missing)
  price?: number;         
  img_url?: string;     
}

// Define Component props

const ServiceCard = ({ item }: { item: Service }) => (
  <TouchableOpacity style={styles.card} activeOpacity={0.9}>
    <Image
      source={{ uri: item.img_url || FALLBACK_IMAGE }}
      style={styles.image}
    />
    <View style={styles.info}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{item.name}</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Available</Text>
        </View>
      </View>

      <Text style={styles.description} numberOfLines={2}>
        {item.description || 'Experience premium comfort in our signature rooms.'}
      </Text>

      <View style={styles.footerRow}>
        <Text style={styles.priceLabel}>Starting from</Text>
        <Text style={styles.price}>
          LKR {item.price ? item.price.toLocaleString() : '5,500'}
          <Text style={styles.perNight}>/night</Text>
        </Text>
      </View>
    </View>
  </TouchableOpacity>
);

const CeyloxHome = () => {
  // ─────────────────────────────────────────────
  // 📘 TYPESCRIPT LESSON 3: Typing useState
  // useState([]) alone makes TypeScript infer the type as 'never[]'
  // because it sees an empty array and can't guess what goes in it.
  // We fix this by explicitly passing the type in angle brackets: useState<Service[]>([])
  // This tells TypeScript: "this will be an array of Service objects"
  // ─────────────────────────────────────────────
  const [services, setServices] = useState<Service[]>([]);

  // ─────────────────────────────────────────────
  // 📘 TYPESCRIPT LESSON 4: Union types
  // useState(null) makes TypeScript type this as 'null' only.
  // But later we call setError("some string") which TypeScript rejects.
  // The fix: use a union type 'string | null' — meaning it can be
  // either a string OR null. The pipe '|' means "or".
  // ─────────────────────────────────────────────
  const [error, setError] = useState<string | null>(null);

  const [loading, setLoading] = useState<boolean>(true);

  const [refreshing, setRefreshing] = useState<boolean>(false);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async (): Promise<void> => {
    if (!refreshing) setLoading(true);
    setError(null);
    //setLoading(true);

    try {
      const response = await fetch(API_URL);

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data: Service[] = await response.json();
      setServices(data);
    } catch (err) {
      console.error('Empire Error: Could not fetch services', err);
      setError('Could not connect to the server. Please check your connection and try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Function triggers when swipe down
  const onRefresh = () => {
    setRefreshing(true);
    fetchServices();
  }

  const renderLoader = () => (
    <View style={styles.centered}>
      <ActivityIndicator size="large" color="#2ecc71" />
      <Text style={styles.loaderText}>Connecting...</Text>
    </View>
  );

  const renderError = () => (
    <View style={styles.centered}>
      <Text style={styles.errorIcon}>⚠️</Text>
      <Text style={styles.errorText}>{error}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={fetchServices}>
        <Text style={styles.retryButtonText}>Tap to Retry</Text>
      </TouchableOpacity>
    </View>
  );

  const renderList = () => (
    <FlatList
      data={services}
      keyExtractor={(item) => item.id.toString()}
      renderItem={({ item }) => <ServiceCard item={item} />}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}

      // enable the swipe-down refresh
      refreshing={refreshing}
      onRefresh={onRefresh}

      ListEmptyComponent={
        <View style={styles.centered}>
          <Text style={styles.emptyText}>No services available right now.</Text>
        </View>
      }
    />
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <Text style={styles.brand}>
          <Text style={styles.brandSub}>Ceylox</Text><Text style={styles.subBrand}>  by gimsonic.com</Text>
        </Text>
        <Text style={styles.tagline}> Redefining the standard of stay.</Text>
      </View>

      {loading ? renderLoader() : error ? renderError() : renderList()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: { padding: 20, backgroundColor: '#fff' },
  brand: { fontSize: 28, fontWeight: '900', color: '#2c3e50', letterSpacing: -1 },
  brandSub: { color: '#2ecc71' },
  tagline: { fontSize: 12, color: '#95a5a6', marginTop: 4, fontWeight: '600' },
  listContent: { padding: 20 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 20,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  image: { width: '100%', height: 180, backgroundColor: '#ecf0f1' },
  info: { padding: 16 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: { fontSize: 20, fontWeight: 'bold', color: '#2c3e50' },
  badge: { backgroundColor: '#e8f8f5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeText: { color: '#1abc9c', fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  description: { fontSize: 14, color: '#7f8c8d', lineHeight: 20, marginBottom: 16 },
  footerRow: {
    borderTopWidth: 1,
    borderTopColor: '#f1f2f6',
    paddingTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  priceLabel: { fontSize: 12, color: '#95a5a6' },
  price: { fontSize: 18, fontWeight: 'bold', color: '#2ecc71' },
  perNight: { fontSize: 12, color: '#95a5a6', fontWeight: 'normal' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  loaderText: { marginTop: 10, color: '#95a5a6', fontSize: 14 },
  errorIcon: { fontSize: 40, marginBottom: 12 },
  errorText: { color: '#e74c3c', fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 20 },
  retryButton: { backgroundColor: '#2ecc71', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
  retryButtonText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  emptyText: { color: '#95a5a6', fontSize: 16, textAlign: 'center' },
  subBrand: {fontSize: 16, fontWeight: '500', color: '#000000'},
});

export default CeyloxHome;