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

// Hosting IP
const API_URL = 'http://192.168.8.199:8000/bookings/';

const { width } = Dimensions.get('window');

// ─────────────────────────────────────────────
// Success Overlay — works on web AND mobile
// because it's built with React Native components,
// not the native OS Alert dialog.
// ─────────────────────────────────────────────
interface SuccessOverlayProps {
  roomName: string;
  nights: number;
  totalPrice: number;
  isGuest: boolean;
  onDone: () => void;
}

const SuccessOverlay = ({ roomName, nights, totalPrice, isGuest, onDone }: SuccessOverlayProps) => {
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const cardSlide = useRef(new Animated.Value(60)).current;
  const cardFade = useRef(new Animated.Value(0)).current;
  const checkScale = useRef(new Animated.Value(0)).current;
  const contentFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(backdropAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.parallel([
        Animated.spring(cardSlide, { toValue: 0, useNativeDriver: true, tension: 60, friction: 8 }),
        Animated.timing(cardFade, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]),
      Animated.spring(checkScale, { toValue: 1, useNativeDriver: true, tension: 80, friction: 5 }),
      Animated.timing(contentFade, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleDone = () => {
    Animated.parallel([
      Animated.timing(backdropAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
      Animated.timing(cardFade, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => onDone());
  };

  return (
    <Animated.View style={[styles.overlayBackdrop, { opacity: backdropAnim }]}>
      <Animated.View
        style={[styles.overlayCard, { opacity: cardFade, transform: [{ translateY: cardSlide }] }]}
      >
        <Animated.View style={[styles.checkCircle, { transform: [{ scale: checkScale }] }]}>
          <Text style={styles.checkIcon}>✓</Text>
        </Animated.View>

        <Animated.View style={{ opacity: contentFade, alignItems: 'center', width: '100%' }}>
          <Text style={styles.successEyebrow}>BOOKING CONFIRMED</Text>
          <Text style={styles.successHeading}>You're all set!</Text>

          <View style={styles.summaryPill}>
            <Text style={styles.summaryPillText}>{roomName}</Text>
          </View>

          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>DURATION</Text>
              <Text style={styles.detailValue}>{nights} night{nights > 1 ? 's' : ''}</Text>
            </View>
            <View style={styles.detailDivider} />
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>TOTAL</Text>
              <Text style={[styles.detailValue, { color: '#2ecc71' }]}>
                LKR {totalPrice.toLocaleString()}
              </Text>
            </View>
          </View>

          {/* Show a sign-up nudge for guest bookings */}
          {isGuest && (
            <View style={styles.guestNudge}>
              <Text style={styles.guestNudgeText}>
                💡 Create an account to manage your bookings and get exclusive rates.
              </Text>
              <TouchableOpacity onPress={() => { handleDone(); router.push('/signup'); }}>
                <Text style={styles.guestNudgeLink}>Sign up now →</Text>
              </TouchableOpacity>
            </View>
          )}

          <Text style={styles.successSubtext}>
            A confirmation will be sent to your email address.
          </Text>

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
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // ─────────────────────────────────────────────
  // 📘 LESSON: Optional user session
  // We TRY to load a saved user from AsyncStorage.
  // If found → registered user flow (user_id attached to booking)
  // If not found → guest flow (user_id omitted from booking)
  // Both are allowed. The UI adapts to show which mode is active.
  // ─────────────────────────────────────────────
  const [userId, setUserId] = useState<string | null>(null);
  const [isRegisteredUser, setIsRegisteredUser] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const savedId = await AsyncStorage.getItem('user_id');
        const savedName = await AsyncStorage.getItem('user_name');
        if (savedId) {
          setUserId(savedId);
          setIsRegisteredUser(true);
        }
        if (savedName) setGuestName(savedName);
      } catch {
        // AsyncStorage unavailable (e.g. web without storage) — guest mode
      }
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

    setSubmitting(true);
    try {
      // ─────────────────────────────────────────────
      // Build the booking payload.
      // For registered users: include user_id (links to their account).
      // For guests: omit user_id entirely (backend accepts null now).
      // In both cases we always send name/email/phone for the record.
      // ─────────────────────────────────────────────
      const payload: Record<string, unknown> = {
        room_id: parseInt(roomId ?? '0'),
        full_name: guestName,
        email: email,
        mobile: phone,
        check_in_date: checkIn,
        check_out_date: checkOut,
        total_price: totalPrice,
      };

      // Only attach user_id if the user is registered
      if (userId) {
        payload.user_id = userId;
      }

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error(`Booking failed: ${response.status}`);

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

        {/* ── User mode banner ── */}
        {isRegisteredUser ? (
          // Registered user — green confirmed banner
          <View style={styles.registeredBanner}>
            <Text style={styles.registeredBannerText}>
              ✓ Signed in · booking as {guestName}
            </Text>
          </View>
        ) : (
          // Guest — neutral info banner with signup option
          <View style={styles.guestBanner}>
            <Text style={styles.guestBannerText}>
              Booking as guest · no account needed
            </Text>
            <TouchableOpacity onPress={() => router.push('/signup')}>
              <Text style={styles.guestBannerLink}>Sign up for faster booking →</Text>
            </TouchableOpacity>
          </View>
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

      {/* Success overlay — shown on top after successful booking */}
      {bookingSuccess && (
        <SuccessOverlay
          roomName={roomName ?? 'your room'}
          nights={nights}
          totalPrice={totalPrice}
          isGuest={!isRegisteredUser}
          onDone={() => router.replace('/')}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  scroll: { padding: 20, paddingBottom: 40 },

  summaryCard: { backgroundColor: '#2c3e50', borderRadius: 16, padding: 20, marginBottom: 16 },
  summaryLabel: { color: '#2ecc71', fontSize: 10, fontWeight: '800', letterSpacing: 3, marginBottom: 6 },
  summaryRoom: { color: '#fff', fontSize: 24, fontWeight: '900', marginBottom: 8 },
  summaryRow: { flexDirection: 'row', alignItems: 'baseline' },
  summaryPrice: { color: '#2ecc71', fontSize: 22, fontWeight: 'bold' },
  summaryPerNight: { color: '#7f8c8d', fontSize: 13, marginLeft: 4 },

  // Registered user banner — green
  registeredBanner: {
    backgroundColor: '#e8f8f5',
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#1abc9c',
  },
  registeredBannerText: { color: '#1abc9c', fontSize: 13, fontWeight: '700' },

  // Guest banner — neutral blue-grey, not alarming
  guestBanner: {
    backgroundColor: '#f0f4f8',
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#dce3ea',
  },
  guestBannerText: { color: '#5d7a8a', fontSize: 13, fontWeight: '600', marginBottom: 4 },
  guestBannerLink: { color: '#2ecc71', fontSize: 12, fontWeight: '700' },

  sectionTitle: { fontSize: 13, fontWeight: '800', color: '#2c3e50', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 14, marginTop: 4 },
  dateHint: { fontSize: 11, color: '#95a5a6', marginTop: -10, marginBottom: 12 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 12, fontWeight: '700', color: '#7f8c8d', marginBottom: 6, letterSpacing: 0.5 },
  input: { backgroundColor: '#fff', borderRadius: 10, padding: 14, fontSize: 15, color: '#2c3e50', borderWidth: 1.5, borderColor: '#ecf0f1' },
  inputFocused: { borderColor: '#2ecc71' },
  dateRow: { flexDirection: 'row' },

  priceSummary: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: '#ecf0f1' },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  priceRowLabel: { color: '#7f8c8d', fontSize: 14 },
  priceRowValue: { color: '#2c3e50', fontSize: 14, fontWeight: '600' },
  priceDivider: { height: 1, backgroundColor: '#f1f2f6', marginVertical: 8 },
  totalLabel: { color: '#2c3e50', fontSize: 16, fontWeight: '800' },
  totalValue: { color: '#2ecc71', fontSize: 18, fontWeight: '900' },

  button: { backgroundColor: '#2ecc71', borderRadius: 14, paddingVertical: 18, paddingHorizontal: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  buttonArrow: { color: '#fff', fontSize: 20 },
  disclaimer: { color: '#95a5a6', fontSize: 11, textAlign: 'center' },

  // ── Success Overlay ──────────────────────────
  overlayBackdrop: {
    ...StyleSheet.absoluteFillObject,
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
  successEyebrow: { color: '#2ecc71', fontSize: 10, fontWeight: '800', letterSpacing: 3, marginBottom: 8 },
  successHeading: { fontSize: 32, fontWeight: '900', color: '#2c3e50', letterSpacing: -0.5, marginBottom: 20 },
  summaryPill: { backgroundColor: '#f0fdf8', borderWidth: 1, borderColor: '#d1fae5', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginBottom: 24 },
  summaryPillText: { color: '#059669', fontSize: 14, fontWeight: '700' },
  detailsGrid: { flexDirection: 'row', backgroundColor: '#f8f9fa', borderRadius: 16, padding: 16, width: '100%', marginBottom: 20 },
  detailItem: { flex: 1, alignItems: 'center' },
  detailLabel: { fontSize: 9, fontWeight: '800', color: '#95a5a6', letterSpacing: 1.5, marginBottom: 6 },
  detailValue: { fontSize: 18, fontWeight: '900', color: '#2c3e50' },
  detailDivider: { width: 1, backgroundColor: '#ecf0f1', marginHorizontal: 8 },

  // Guest nudge inside success overlay
  guestNudge: {
    backgroundColor: '#fffbeb',
    borderRadius: 12,
    padding: 14,
    width: '100%',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  guestNudgeText: { color: '#92400e', fontSize: 12, lineHeight: 18, marginBottom: 6 },
  guestNudgeLink: { color: '#2ecc71', fontSize: 13, fontWeight: '800' },

  successSubtext: { fontSize: 13, color: '#7f8c8d', textAlign: 'center', lineHeight: 20, marginBottom: 28, paddingHorizontal: 8 },
  doneButton: { backgroundColor: '#2c3e50', borderRadius: 14, paddingVertical: 16, paddingHorizontal: 40, width: '100%', alignItems: 'center', marginBottom: 12 },
  doneButtonText: { color: '#fff', fontSize: 15, fontWeight: '800', letterSpacing: 0.3 },
  successDisclaimer: { color: '#bdc3c7', fontSize: 11, textAlign: 'center' },
});

export default BookingScreen;