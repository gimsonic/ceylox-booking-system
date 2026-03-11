import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Alert,
  ActivityIndicator,
  Animated,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://192.168.8.199:8000/bookings/';
const { width } = Dimensions.get('window');

// ─────────────────────────────────────────────
// Success Overlay Component
// This is a separate component so it has its own
// clean animation lifecycle. It renders on TOP of
// everything using absolute positioning.
// ─────────────────────────────────────────────
interface SuccessOverlayProps {
  roomName: string;
  nights: number;
  totalPrice: number;
  onDone: () => void;
}

const SuccessOverlay = ({ roomName, nights, totalPrice, onDone }: SuccessOverlayProps) => {
  // Three layered animations for a staggered entrance feel
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const cardAnim = useRef(new Animated.Value(60)).current;
  const cardFade = useRef(new Animated.Value(0)).current;
  const checkAnim = useRef(new Animated.Value(0)).current;
  const contentFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      // 1. Backdrop fades in
      Animated.timing(backdropAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      // 2. Card slides up and fades in together
      Animated.parallel([
        Animated.spring(cardAnim, { toValue: 0, useNativeDriver: true, tension: 60, friction: 8 }),
        Animated.timing(cardFade, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]),
      // 3. Check icon pops in
      Animated.spring(checkAnim, { toValue: 1, useNativeDriver: true, tension: 80, friction: 5 }),
      // 4. Text content fades in
      Animated.timing(contentFade, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleDone = () => {
    // Fade out before navigating
    Animated.parallel([
      Animated.timing(backdropAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
      Animated.timing(cardFade, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => onDone());
  };

  return (
    <Animated.View style={[styles.overlayBackdrop, { opacity: backdropAnim }]}>
      <Animated.View
        style={[
          styles.overlayCard,
          {
            opacity: cardFade,
            transform: [{ translateY: cardAnim }],
          },
        ]}
      >
        {/* Animated check circle */}
        <Animated.View
          style={[
            styles.checkCircle,
            { transform: [{ scale: checkAnim }] },
          ]}
        >
          <Text style={styles.checkIcon}>✓</Text>
        </Animated.View>

        <Animated.View style={{ opacity: contentFade, alignItems: 'center' }}>
          <Text style={styles.successEyebrow}>BOOKING CONFIRMED</Text>
          <Text style={styles.successHeading}>You're all set!</Text>

          {/* Booking summary pill */}
          <View style={styles.summaryPill}>
            <Text style={styles.summaryPillText}>{roomName}</Text>
          </View>

          {/* Details grid */}
          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>DURATION</Text>
              <Text style={styles.detailValue}>{nights} night{nights > 1 ? 's' : ''}</Text>
            </View>
            <View style={styles.detailDivider} />
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>TOTAL PAID</Text>
              <Text style={[styles.detailValue, { color: '#2ecc71' }]}>
                LKR {totalPrice.toLocaleString()}
              </Text>
            </View>
          </View>

          <Text style={styles.successSubtext}>
            A confirmation will be sent to your registered email address.
          </Text>

          {/* Done button */}
          <TouchableOpacity style={styles.doneButton} onPress={handleDone} activeOpacity={0.85}>
            <Text style={styles.doneButtonText}>Back to Home</Text>
          </TouchableOpacity>

          <Text style={styles.successDisclaimer}>
            Free cancellation up to 24 hours before check-in
          </Text>
        </Animated.View>
      </Animated.View>
    </Animated.View>
  );
};

// ─────────────────────────────────────────────
// Main Booking Screen
// ─────────────────────────────────────────────
const BookingScreen = () => {
  const { roomId, roomName, price } = useLocalSearchParams<{
    roomId: string;
    roomName: string;
    price: string;
  }>();

  const [guestName, setGuestName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // ✅ Controls whether the success overlay is visible
  const [bookingSuccess, setBookingSuccess] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      const savedId = await AsyncStorage.getItem('user_id');
      const savedName = await AsyncStorage.getItem('user_name');
      if (savedId) setUserId(savedId);
      if (savedName) setGuestName(savedName);
    };
    loadUser();
  }, []);

  const calculateNights = (): number => {
    const inDate = new Date(checkIn);
    const outDate = new Date(checkOut);
    const diff = outDate.getTime() - inDate.getTime();
    const nights = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return nights > 0 ? nights : 0;
  };

  const nights = calculateNights();
  const totalPrice = nights * parseInt(price ?? '5500');

  const handleBooking = async () => {
    if (!guestName || !email || !checkIn || !checkOut) {
      Alert.alert('Missing Info', 'Please fill in all required fields.');
      return;
    }
    if (nights <= 0) {
      Alert.alert('Invalid Dates', 'Check-out must be after check-in.');
      return;
    }
    if (!userId) {
      Alert.alert('Sign Up Required', 'You need an account to make a booking.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Up', onPress: () => router.push('/signup') },
      ]);
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          room_id: parseInt(roomId ?? '0'),
          check_in_date: checkIn,
          check_out_date: checkOut,
          total_price: totalPrice,
        }),
      });

      if (!response.ok) throw new Error(`Booking failed: ${response.status}`);

      // ✅ Instead of Alert.alert(), show our custom overlay
      setBookingSuccess(true);

    } catch (err) {
      Alert.alert('Booking Failed', 'Something went wrong. Please try again.');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle = (field: string) => [
    styles.input,
    focusedField === field && styles.inputFocused,
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Room Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>YOU ARE BOOKING</Text>
          <Text style={styles.summaryRoom}>{roomName}</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryPrice}>LKR {parseInt(price ?? '5500').toLocaleString()}</Text>
            <Text style={styles.summaryPerNight}>/night</Text>
          </View>
        </View>

        {/* User status banner */}
        {userId ? (
          <View style={styles.userBanner}>
            <Text style={styles.userBannerText}>✓ Signed in · booking as {guestName}</Text>
          </View>
        ) : (
          <TouchableOpacity style={styles.signUpBanner} onPress={() => router.push('/signup')}>
            <Text style={styles.signUpBannerText}>⚠ Sign up first to complete your booking →</Text>
          </TouchableOpacity>
        )}

        {/* Guest Details */}
        <Text style={styles.sectionTitle}>Guest Details</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Full Name *</Text>
          <TextInput
            style={inputStyle('name')}
            placeholder="e.g. Kamal Perera"
            placeholderTextColor="#bdc3c7"
            value={guestName}
            onChangeText={setGuestName}
            onFocus={() => setFocusedField('name')}
            onBlur={() => setFocusedField(null)}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email Address *</Text>
          <TextInput
            style={inputStyle('email')}
            placeholder="kamal@example.com"
            placeholderTextColor="#bdc3c7"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            onFocus={() => setFocusedField('email')}
            onBlur={() => setFocusedField(null)}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={inputStyle('phone')}
            placeholder="+94 77 123 4567"
            placeholderTextColor="#bdc3c7"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            onFocus={() => setFocusedField('phone')}
            onBlur={() => setFocusedField(null)}
          />
        </View>

        {/* Stay Dates */}
        <Text style={styles.sectionTitle}>Stay Dates</Text>
        <Text style={styles.dateHint}>Format: YYYY-MM-DD (e.g. 2025-12-25)</Text>

        <View style={styles.dateRow}>
          <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.label}>Check-in *</Text>
            <TextInput
              style={inputStyle('checkin')}
              placeholder="2025-12-25"
              placeholderTextColor="#bdc3c7"
              value={checkIn}
              onChangeText={setCheckIn}
              onFocus={() => setFocusedField('checkin')}
              onBlur={() => setFocusedField(null)}
            />
          </View>
          <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
            <Text style={styles.label}>Check-out *</Text>
            <TextInput
              style={inputStyle('checkout')}
              placeholder="2025-12-28"
              placeholderTextColor="#bdc3c7"
              value={checkOut}
              onChangeText={setCheckOut}
              onFocus={() => setFocusedField('checkout')}
              onBlur={() => setFocusedField(null)}
            />
          </View>
        </View>

        {/* Price Summary */}
        {nights > 0 && (
          <View style={styles.priceSummary}>
            <View style={styles.priceRow}>
              <Text style={styles.priceRowLabel}>
                LKR {parseInt(price ?? '5500').toLocaleString()} × {nights} night{nights > 1 ? 's' : ''}
              </Text>
              <Text style={styles.priceRowValue}>LKR {totalPrice.toLocaleString()}</Text>
            </View>
            <View style={styles.priceDivider} />
            <View style={styles.priceRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>LKR {totalPrice.toLocaleString()}</Text>
            </View>
          </View>
        )}

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.button, submitting && styles.buttonDisabled]}
          onPress={handleBooking}
          disabled={submitting}
          activeOpacity={0.85}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.buttonText}>Confirm Booking</Text>
              <Text style={styles.buttonArrow}>→</Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.disclaimer}>Free cancellation up to 24 hours before check-in.</Text>
      </ScrollView>

      {/* ✅ Success overlay — renders on top when booking succeeds */}
      {bookingSuccess && (
        <SuccessOverlay
          roomName={roomName ?? 'your room'}
          nights={nights}
          totalPrice={totalPrice}
          onDone={() => router.replace('/')}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  scroll: { padding: 20, paddingBottom: 40 },

  // Room summary
  summaryCard: { backgroundColor: '#2c3e50', borderRadius: 16, padding: 20, marginBottom: 16 },
  summaryLabel: { color: '#2ecc71', fontSize: 10, fontWeight: '800', letterSpacing: 3, marginBottom: 6 },
  summaryRoom: { color: '#fff', fontSize: 24, fontWeight: '900', marginBottom: 8 },
  summaryRow: { flexDirection: 'row', alignItems: 'baseline' },
  summaryPrice: { color: '#2ecc71', fontSize: 22, fontWeight: 'bold' },
  summaryPerNight: { color: '#7f8c8d', fontSize: 13, marginLeft: 4 },

  // Banners
  userBanner: { backgroundColor: '#e8f8f5', borderRadius: 10, padding: 12, marginBottom: 20, borderWidth: 1, borderColor: '#1abc9c' },
  userBannerText: { color: '#1abc9c', fontSize: 13, fontWeight: '700' },
  signUpBanner: { backgroundColor: '#fef9e7', borderRadius: 10, padding: 12, marginBottom: 20, borderWidth: 1, borderColor: '#f39c12' },
  signUpBannerText: { color: '#e67e22', fontSize: 13, fontWeight: '700' },

  // Form
  sectionTitle: { fontSize: 13, fontWeight: '800', color: '#2c3e50', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 14, marginTop: 4 },
  dateHint: { fontSize: 11, color: '#95a5a6', marginTop: -10, marginBottom: 12 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 12, fontWeight: '700', color: '#7f8c8d', marginBottom: 6, letterSpacing: 0.5 },
  input: { backgroundColor: '#fff', borderRadius: 10, padding: 14, fontSize: 15, color: '#2c3e50', borderWidth: 1.5, borderColor: '#ecf0f1' },
  inputFocused: { borderColor: '#2ecc71' },
  dateRow: { flexDirection: 'row' },

  // Price summary
  priceSummary: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: '#ecf0f1' },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  priceRowLabel: { color: '#7f8c8d', fontSize: 14 },
  priceRowValue: { color: '#2c3e50', fontSize: 14, fontWeight: '600' },
  priceDivider: { height: 1, backgroundColor: '#f1f2f6', marginVertical: 8 },
  totalLabel: { color: '#2c3e50', fontSize: 16, fontWeight: '800' },
  totalValue: { color: '#2ecc71', fontSize: 18, fontWeight: '900' },

  // Button
  button: { backgroundColor: '#2ecc71', borderRadius: 14, paddingVertical: 18, paddingHorizontal: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  buttonArrow: { color: '#fff', fontSize: 20 },
  disclaimer: { color: '#95a5a6', fontSize: 11, textAlign: 'center' },

  // ── Success Overlay ──────────────────────────────────────
  overlayBackdrop: {
    ...StyleSheet.absoluteFillObject,   // covers the entire screen
    backgroundColor: 'rgba(20, 30, 40, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  overlayCard: {
    backgroundColor: '#fff',
    borderRadius: 28,
    padding: 32,
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.3,
    shadowRadius: 40,
    elevation: 20,
  },
  checkCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#2ecc71',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#2ecc71',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  checkIcon: { color: '#fff', fontSize: 36, fontWeight: '900' },
  successEyebrow: {
    color: '#2ecc71',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 3,
    marginBottom: 8,
  },
  successHeading: {
    fontSize: 32,
    fontWeight: '900',
    color: '#2c3e50',
    letterSpacing: -0.5,
    marginBottom: 20,
  },
  summaryPill: {
    backgroundColor: '#f0fdf8',
    borderWidth: 1,
    borderColor: '#d1fae5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 24,
  },
  summaryPillText: { color: '#059669', fontSize: 14, fontWeight: '700' },
  detailsGrid: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    padding: 16,
    width: '100%',
    marginBottom: 20,
  },
  detailItem: { flex: 1, alignItems: 'center' },
  detailLabel: { fontSize: 9, fontWeight: '800', color: '#95a5a6', letterSpacing: 1.5, marginBottom: 6 },
  detailValue: { fontSize: 18, fontWeight: '900', color: '#2c3e50' },
  detailDivider: { width: 1, backgroundColor: '#ecf0f1', marginHorizontal: 8 },
  successSubtext: {
    fontSize: 13,
    color: '#7f8c8d',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 28,
    paddingHorizontal: 8,
  },
  doneButton: {
    backgroundColor: '#2c3e50',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 40,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  doneButtonText: { color: '#fff', fontSize: 15, fontWeight: '800', letterSpacing: 0.3 },
  successDisclaimer: { color: '#bdc3c7', fontSize: 11, textAlign: 'center' },
});

export default BookingScreen;