import { router } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  ImageBackground,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width, height } = Dimensions.get("window");

const WelcomeScreen = () => {
  const insets = useSafeAreaInsets();

  // Animated values for staggered entrance
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const taglineFade = useRef(new Animated.Value(0)).current;
  const taglineSlide = useRef(new Animated.Value(30)).current;
  const buttonFade = useRef(new Animated.Value(0)).current;
  const buttonSlide = useRef(new Animated.Value(30)).current;
  const dividerWidth = useRef(new Animated.Value(0)).current;
  const badgeFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Staggered entrance animation sequence
    Animated.sequence([
      // 1. Brand name fades in from below
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
      // 2. Divider line grows
      Animated.timing(dividerWidth, {
        toValue: 60,
        duration: 400,
        useNativeDriver: false,
      }),
      // 3. Tagline appears
      Animated.parallel([
        Animated.timing(taglineFade, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(taglineSlide, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
      // 4. Badge + button appear
      Animated.parallel([
        Animated.timing(badgeFade, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(buttonFade, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(buttonSlide, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />

      {/* Full-bleed hero image */}
      <ImageBackground
        source={{
          uri: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=2070",
        }}
        style={styles.hero}
        resizeMode="cover"
      >
        {/* Gradient overlay — dark at bottom, subtle at top */}
        <View style={styles.overlayTop} />
        <View style={styles.overlayBottom} />

        {/* Top bar — small branding */}
        <Animated.View
          style={[
            styles.topBar,
            { paddingTop: insets.top + 12, opacity: badgeFade },
          ]}
        >
          <View style={styles.topBadge}>
            <Text style={styles.topBadgeText}>SRI LANKA · EST. 2026</Text>
          </View>
        </Animated.View>

        {/* Center hero content */}
        <View style={styles.heroContent}>
          {/* Eyebrow label */}
          <Animated.Text style={[styles.eyebrow, { opacity: fadeAnim }]}>
            LUXURY STAYS
          </Animated.Text>

          {/* Main brand name — large, editorial */}
          <Animated.Text
            style={[
              styles.brand,
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
            ]}
          >
            Ceylox
          </Animated.Text>

          {/* Animated divider line */}
          <Animated.View style={[styles.divider, { width: dividerWidth }]} />

          {/* Tagline */}
          <Animated.Text
            style={[
              styles.tagline,
              {
                opacity: taglineFade,
                transform: [{ translateY: taglineSlide }],
              },
            ]}
          >
            Redefining the{"\n"}standard of stay.
          </Animated.Text>
        </View>

        {/* Bottom CTA section */}
        <Animated.View
          style={[
            styles.bottomSection,
            {
              paddingBottom: insets.bottom + 40,
              opacity: buttonFade,
              transform: [{ translateY: buttonSlide }],
            },
          ]}
        >
          {/* Feature pills */}
          <View style={styles.pillRow}>
            {["Free Cancellation", "Best Rate", "Instant Confirm"].map(
              (label) => (
                <View key={label} style={styles.pill}>
                  <Text style={styles.pillText}>{label}</Text>
                </View>
              ),
            )}
          </View>

          {/* Main CTA button */}
          <TouchableOpacity
            style={styles.primaryButton}
            activeOpacity={0.85}
            onPress={() => router.push("/catalog")}
          >
            <Text style={styles.primaryButtonText}>
              Explore Available Rooms
            </Text>
            <Text style={styles.buttonArrow}>→</Text>
          </TouchableOpacity>

          {/* Secondary CTA — Sign Up */}
          <TouchableOpacity
            style={styles.secondaryButton}
            activeOpacity={0.85}
            onPress={() => router.push("/signup")}
          >
            <Text style={styles.secondaryButtonText}>Create an Account</Text>
          </TouchableOpacity>

          {/* Subtle sub-link */}
          <Text style={styles.subLink}>
            No account needed · Book in 60 seconds
          </Text>
        </Animated.View>
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  hero: { flex: 1 },

  // Dual overlay for depth
  overlayTop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  overlayBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: height * 0.55,
    backgroundColor: "rgba(0,0,0,0.6)",
  },

  // Top bar
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  topBadge: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.4)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  topBadgeText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 2,
  },

  // Hero content
  heroContent: {
    flex: 1,
    justifyContent: "flex-end",
    paddingHorizontal: 32,
    paddingBottom: 40,
  },
  eyebrow: {
    color: "#2ecc71",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 4,
    marginBottom: 12,
  },
  brand: {
    fontSize: 72,
    fontWeight: "900",
    color: "#ffffff",
    letterSpacing: -2,
    lineHeight: 76,
  },
  divider: {
    height: 2,
    backgroundColor: "#2ecc71",
    marginTop: 16,
    marginBottom: 20,
  },
  tagline: {
    fontSize: 22,
    color: "rgba(255,255,255,0.85)",
    lineHeight: 32,
    fontWeight: "300",
    letterSpacing: 0.3,
  },

  // Bottom section
  bottomSection: {
    paddingHorizontal: 24,
  },
  pillRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 20,
    flexWrap: "wrap",
  },
  pill: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  pillText: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 11,
    fontWeight: "600",
  },
  primaryButton: {
    backgroundColor: "#2ecc71",
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    //width: "90%",
    alignItems: "center",
    //alignSelf: "center",
    marginBottom: 12,
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  buttonArrow: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "300",
  },
  secondaryButton: {
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.5)",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 14,
    alignItems: "center",
    //alignSelf: "center",
    marginBottom: 16,
    backgroundColor: "rgba(255,255,255,0.07)",
  },
  secondaryButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.2,
  },

  subLink: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 11,
    textAlign: "center",
    letterSpacing: 0.3,
  },
});

export default WelcomeScreen;
