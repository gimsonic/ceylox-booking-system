import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const API_URL = "http://192.168.8.199:8000/services/";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1611892440504-42a792e24d32?q=80&w=2070&auto=format&fit=crop";

// ─────────────────────────────────────────────
// 📘 LESSON: Why FlatList numColumns breaks on web
//
// FlatList's numColumns prop is designed for native.
// On Expo web it's implemented differently and doesn't
// respond correctly to dynamic column changes.
//
// Solution: on web, use a plain ScrollView with
// flexDirection:"row" + flexWrap:"wrap". Each card
// gets an explicit percentage width based on columns.
// This is exactly how CSS grid works — just in RN style.
//
// Mobile keeps FlatList (better performance for long lists,
// built-in pull-to-refresh, virtualization).
// ─────────────────────────────────────────────

const getColumns = (w: number) => {
  if (w >= 1024) return 3;
  if (w >= 620) return 2;
  return 1;
};

export interface Service {
  id: number;
  name: string;
  description?: string;
  price?: number;
  img_url?: string;
}

// ── Card ─────────────────────────────────────
const ServiceCard = ({
  item,
  cardWidth,
  compact,
}: {
  item: Service;
  cardWidth: number | string;
  compact: boolean;
}) => (
  <TouchableOpacity
    style={[styles.card, { width: cardWidth as any }]}
    activeOpacity={0.9}
    onPress={() =>
      router.push({
        pathname: "./booking",
        params: {
          roomId: item.id,
          roomName: item.name,
          price: item.price ?? 5500,
        },
      })
    }
  >
    <Image
      source={{ uri: item.img_url || FALLBACK_IMAGE }}
      style={[styles.image, compact && styles.imageCompact]}
    />
    <View style={styles.info}>
      <View style={styles.headerRow}>
        <Text style={styles.title} numberOfLines={1}>
          {item.name}
        </Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Available</Text>
        </View>
      </View>
      <Text style={styles.description} numberOfLines={2}>
        {item.description ||
          "Experience premium comfort in our signature rooms."}
      </Text>
      <View style={styles.footerRow}>
        <Text style={styles.tapLabel}>Tap to Book</Text>
        <Text style={styles.price}>
          LKR {item.price ? item.price.toLocaleString() : "5,500"}
          <Text style={styles.perNight}>/night</Text>
        </Text>
      </View>
    </View>
  </TouchableOpacity>
);

// ── Screen ────────────────────────────────────
const CatalogScreen = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [screenWidth, setScreenWidth] = useState(
    Dimensions.get("window").width,
  );

  useEffect(() => {
    const sub = Dimensions.addEventListener("change", ({ window }) => {
      setScreenWidth(window.width);
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    if (!refreshing) setLoading(true);
    setError(null);
    try {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      setServices(await res.json());
    } catch {
      setError(
        "Could not connect to the server. Please check your connection.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const isWeb = Platform.OS === "web";
  const columns = getColumns(screenWidth);
  const compact = columns > 1;

  // For web grid: each card is a percentage of the row minus gaps
  // GAP is 16px. With 3 cols: each card ≈ 33.33% minus a share of gaps.
  // We use a small padding trick: outer container has padding 20,
  // cards have marginBottom 20 and marginRight calculated below.
  const GAP = 16;

  const Header = () => (
    <View style={styles.header}>
      <View
        style={[
          styles.headerInner,
          isWeb && {
            maxWidth: 1200,
            alignSelf: "center" as any,
            width: "100%",
          },
        ]}
      >
        <Text style={styles.brand}>
          <Text style={styles.brandGreen}>Ceylox </Text>
          <Text style={styles.brandSub}> by gimsonic Labs</Text>
        </Text>
        <Text style={styles.tagline}>Redefining the standard of stay.</Text>
      </View>
    </View>
  );

  if (loading)
    return (
      <SafeAreaView style={styles.container}>
        <Header />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#2ecc71" />
        </View>
      </SafeAreaView>
    );

  if (error)
    return (
      <SafeAreaView style={styles.container}>
        <Header />
        <View style={styles.centered}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchServices}>
            <Text style={styles.retryButtonText}>Tap to Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <Header />

      {isWeb ? (
        // ── Web: ScrollView + flexWrap grid ──────────
        // This is the reliable way to do a responsive grid on web.
        // Each card gets a calculated % width. No FlatList quirks.
        <ScrollView
          contentContainerStyle={[styles.webGrid, { maxWidth: 1200 }]}
          showsVerticalScrollIndicator={false}
        >
          {services.length === 0 ? (
            <Text style={styles.emptyText}>No rooms available right now.</Text>
          ) : (
            services.map((item, index) => {
              // Last card in each row should NOT have marginRight
              const isLastInRow = (index + 1) % columns === 0;
              return (
                <ServiceCard
                  key={item.id}
                  item={item}
                  // Card width as a percentage string — works on web like CSS %
                  cardWidth={
                    columns === 1
                      ? "100%"
                      : columns === 2
                        ? `calc(50% - ${GAP / 2}px)`
                        : `calc(33.333% - ${(GAP * 2) / 3}px)`
                  }
                  compact={compact}
                />
              );
            })
          )}
        </ScrollView>
      ) : (
        // ── Mobile: FlatList (unchanged behaviour) ──
        <FlatList
          data={services}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <ServiceCard item={item} cardWidth="100%" compact={false} />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            fetchServices();
          }}
          ListEmptyComponent={
            <View style={styles.centered}>
              <Text style={styles.emptyText}>
                No rooms available right now.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa" },
  header: {
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f2f6",
  },
  headerInner: { padding: 20, paddingHorizontal: 28 },
  brand: {
    fontSize: 26,
    fontWeight: "900",
    color: "#2c3e50",
    letterSpacing: -0.5,
  },
  brandGreen: { color: "#2ecc71" },
  brandSub: { fontSize: 15, fontWeight: "500", color: "#000" },
  tagline: { fontSize: 12, color: "#95a5a6", marginTop: 4, fontWeight: "600" },

  // Mobile FlatList container
  listContent: { padding: 20, paddingBottom: 40 },

  // Web grid container — flex row + wrap = CSS grid behaviour
  webGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16, // gap between cards (web supports gap)
    padding: 24,
    paddingBottom: 48,
    alignSelf: "center",
    width: "100%",
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    // marginBottom handled by gap on web, explicit on mobile
    marginBottom: 20,
  },
  image: { width: "100%", height: 165 },
  imageCompact: { height: 145 }, // slightly shorter in grid view

  info: { padding: 10 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2c3e50",
    flex: 1,
    marginRight: 8,
  },
  badge: {
    backgroundColor: "#e8f8f5",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    color: "#1abc9c",
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  description: {
    fontSize: 13,
    color: "#7f8c8d",
    lineHeight: 20,
    marginBottom: 16,
  },
  footerRow: {
    borderTopWidth: 1,
    borderTopColor: "#f1f2f6",
    paddingTop: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
  },
  tapLabel: { fontSize: 12, color: "#95a5a6" },
  price: { fontSize: 18, fontWeight: "bold", color: "#2ecc71" },
  perNight: { fontSize: 12, color: "#95a5a6", fontWeight: "normal" },

  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  errorIcon: { fontSize: 36, marginBottom: 12 },
  errorText: {
    color: "#e74c3c",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 22,
  },
  retryButton: {
    backgroundColor: "#2ecc71",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  retryButtonText: { color: "#fff", fontWeight: "700" },
  emptyText: { color: "#95a5a6", fontSize: 16 },
});

export default CatalogScreen;
