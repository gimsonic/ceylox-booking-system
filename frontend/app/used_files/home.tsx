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
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from './app'; // Ensure this matches your file name

const API_URL = 'http://172.20.10.2:8000/services/';

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1611892440504-42a792e24d32?q=80&w=2070&auto=format&fit=crop';


// 📘 TYPESCRIPT LESSON: Exporting for other screens
// We export this so BookingScreen can use the same 'Service' definition
export interface Service {
  id: number;
  name: string;
  description?: string;
  price?: number;
  img_url?: string;
}

const ServiceCard = ({ item }: { item: Service }) => {
  // Use the navigation hook typed with our RootStackParamList
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <TouchableOpacity 
      style={styles.card} 
      activeOpacity={0.9}
      onPress={() => navigation.navigate('Booking', { 
        roomId: item.id, 
        roomName: item.name, 
        price: item.price || 5500 
      })}
    >
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
          <Text style={styles.priceLabel}>Tap to Book</Text>
          <Text style={styles.price}>
            LKR {item.price ? item.price.toLocaleString() : '5,500'}
            <Text style={styles.perNight}>/night</Text>
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const HomeScreen = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async (): Promise<void> => {
    if (!refreshing) setLoading(true);
    setError(null);

    try {
      const response = await fetch(API_URL);
      if (!response.ok) throw new Error(`Server error: ${response.status}`);
      const data: Service[] = await response.json();
      setServices(data);
    } catch (err) {
      console.error('Empire Error: Could not fetch services', err);
      setError('Could not connect to the server. Please check your connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.brand}>
          <Text style={styles.brandSub}>Ceylox</Text>
          <Text style={styles.subBrand}> by gimsonic.com</Text>
        </Text>
        <Text style={styles.tagline}>Redefining the standard of stay.</Text>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#2ecc71" />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchServices}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={services}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => <ServiceCard item={item} />}
          contentContainerStyle={styles.listContent}
          refreshing={refreshing}
          onRefresh={() => { setRefreshing(true); fetchServices(); }}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: { padding: 20, backgroundColor: '#fff' },
  brand: { fontSize: 28, fontWeight: '900', color: '#2c3e50', letterSpacing: -1 },
  brandSub: { color: '#2ecc71' },
  subBrand: { fontSize: 16, fontWeight: '500', color: '#000' },
  tagline: { fontSize: 12, color: '#95a5a6', marginTop: 4, fontWeight: '600' },
  listContent: { padding: 20 },
  card: { backgroundColor: '#fff', borderRadius: 16, marginBottom: 20, overflow: 'hidden', elevation: 4 },
  image: { width: '100%', height: 180 },
  info: { padding: 16 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#2c3e50' },
  badge: { backgroundColor: '#e8f8f5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeText: { color: '#1abc9c', fontSize: 10, fontWeight: '800' },
  description: { fontSize: 14, color: '#7f8c8d', marginBottom: 16 },
  footerRow: { borderTopWidth: 1, borderTopColor: '#f1f2f6', paddingTop: 12, flexDirection: 'row', justifyContent: 'space-between' },
  priceLabel: { fontSize: 12, color: '#95a5a6' },
  price: { fontSize: 18, fontWeight: 'bold', color: '#2ecc71' },
  perNight: { fontSize: 12, color: '#95a5a6' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: '#e74c3c', marginBottom: 20 },
  retryButton: { backgroundColor: '#2ecc71', padding: 12, borderRadius: 8 },
  retryButtonText: { color: '#fff', fontWeight: '700' },
});

export default HomeScreen;