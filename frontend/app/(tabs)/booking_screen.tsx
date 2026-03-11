import React, { useState } from 'react';
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
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';

// ─────────────────────────────────────────────
// 📘 TYPESCRIPT LESSON: useLocalSearchParams
// In Expo Router, params passed via router.push() are read with
// useLocalSearchParams(). They always come in as strings, so
// we parse numbers with parseInt() / parseFloat().
// ─────────────────────────────────────────────

const API_URL = 'http://192.168.8.199:8000/bookings/';

const BookingScreen = () => {
  // Read params from the URL/navigation
  const { roomId, roomName, price } = useLocalSearchParams<{
    roomId: string;
    roomName: string;
    price: string;
  }>();

  // Form state
  const [guestName, setGuestName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Simple date parsing to calculate number of nights
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
    // Basic validation
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
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          room_id: parseInt(roomId ?? '0'),
          full_name: guestName,
          email: email,
          mobile: phone,
          check_in_date: checkIn,
          check_out_date: checkOut,
          total_price: totalPrice,
        }),
      });

      if (!response.ok) throw new Error(`Booking failed: ${response.status}`);

      Alert.alert(
        '🎉 Booking Confirmed!',
        `Your stay at ${roomName} is booked for ${nights} night(s).\nTotal: LKR ${totalPrice.toLocaleString()}`,
        [{ text: 'Done', onPress: () => router.replace('/') }]
      );
    } catch (err) {
      Alert.alert('Booking Failed', 'Something went wrong. Please try again.');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Room Summary Card */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>YOU ARE BOOKING</Text>
          <Text style={styles.summaryRoom}>{roomName}</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryPrice}>
              LKR {parseInt(price ?? '5500').toLocaleString()}
            </Text>
            <Text style={styles.summaryPerNight}>/night</Text>
          </View>
        </View>

        {/* Guest Details */}
        <Text style={styles.sectionTitle}>Guest Details</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Full Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Kamal Perera"
            placeholderTextColor="#bdc3c7"
            value={guestName}
            onChangeText={setGuestName}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email Address *</Text>
          <TextInput
            style={styles.input}
            placeholder="kamal@example.com"
            placeholderTextColor="#bdc3c7"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={styles.input}
            placeholder="+94 77 123 4567"
            placeholderTextColor="#bdc3c7"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
        </View>

        {/* Stay Dates */}
        <Text style={styles.sectionTitle}>Stay Dates</Text>
        <Text style={styles.dateHint}>Format: YYYY-MM-DD (e.g. 2025-12-25)</Text>

        <View style={styles.dateRow}>
          <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.label}>Check-in *</Text>
            <TextInput
              style={styles.input}
              placeholder="2025-12-25"
              placeholderTextColor="#bdc3c7"
              value={checkIn}
              onChangeText={setCheckIn}
            />
          </View>
          <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
            <Text style={styles.label}>Check-out *</Text>
            <TextInput
              style={styles.input}
              placeholder="2025-12-28"
              placeholderTextColor="#bdc3c7"
              value={checkOut}
              onChangeText={setCheckOut}
            />
          </View>
        </View>

        {/* Price Summary — only show when dates are valid */}
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

        <Text style={styles.disclaimer}>
          Free cancellation up to 24 hours before check-in.
        </Text>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  scroll: { padding: 20, paddingBottom: 40 },

  // Summary card at top
  summaryCard: {
    backgroundColor: '#2c3e50',
    borderRadius: 16,
    padding: 20,
    marginBottom: 28,
  },
  summaryLabel: {
    color: '#2ecc71',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 3,
    marginBottom: 6,
  },
  summaryRoom: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 8,
  },
  summaryRow: { flexDirection: 'row', alignItems: 'baseline' },
  summaryPrice: { color: '#2ecc71', fontSize: 22, fontWeight: 'bold' },
  summaryPerNight: { color: '#7f8c8d', fontSize: 13, marginLeft: 4 },

  // Section titles
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#2c3e50',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 14,
    marginTop: 4,
  },
  dateHint: { fontSize: 11, color: '#95a5a6', marginTop: -10, marginBottom: 12 },

  // Inputs
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 12, fontWeight: '700', color: '#7f8c8d', marginBottom: 6, letterSpacing: 0.5 },
  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    color: '#2c3e50',
    borderWidth: 1,
    borderColor: '#ecf0f1',
  },
  dateRow: { flexDirection: 'row' },

  // Price summary box
  priceSummary: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ecf0f1',
  },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  priceRowLabel: { color: '#7f8c8d', fontSize: 14 },
  priceRowValue: { color: '#2c3e50', fontSize: 14, fontWeight: '600' },
  priceDivider: { height: 1, backgroundColor: '#f1f2f6', marginVertical: 8 },
  totalLabel: { color: '#2c3e50', fontSize: 16, fontWeight: '800' },
  totalValue: { color: '#2ecc71', fontSize: 18, fontWeight: '900' },

  // Button
  button: {
    backgroundColor: '#2ecc71',
    borderRadius: 14,
    paddingVertical: 18,
    paddingHorizontal: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  buttonArrow: { color: '#fff', fontSize: 20 },
  disclaimer: { color: '#95a5a6', fontSize: 11, textAlign: 'center' },
});

export default BookingScreen;