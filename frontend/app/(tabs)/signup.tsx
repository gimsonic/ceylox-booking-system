import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Animated,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://192.168.8.199:8000/users/';

// ─────────────────────────────────────────────
// 📘 TYPESCRIPT LESSON: Typing form state
// Each field is a string (inputs always produce strings).
// We define the shape with an interface so we could pass
// this object around to other functions safely.
// ─────────────────────────────────────────────
interface SignUpForm {
  full_name: string;
  email: string;
  mobile: string;
}

interface FieldConfig {
  key: keyof SignUpForm;
  label: string;
  placeholder: string;
  keyboardType: 'default' | 'email-address' | 'phone-pad';
  autoCapitalize: 'none' | 'words' | 'sentences';
}

const FIELDS: FieldConfig[] = [
  {
    key: 'full_name',
    label: 'Full Name',
    placeholder: 'e.g. Kamal Perera',
    keyboardType: 'default',
    autoCapitalize: 'words',
  },
  {
    key: 'email',
    label: 'Email Address',
    placeholder: 'kamal@example.com',
    keyboardType: 'email-address',
    autoCapitalize: 'none',
  },
  {
    key: 'mobile',
    label: 'Mobile Number',
    placeholder: '+94 77 123 4567',
    keyboardType: 'phone-pad',
    autoCapitalize: 'none',
  },
];

const SignUpScreen = () => {
  const [form, setForm] = useState<SignUpForm>({
    full_name: '',
    email: '',
    mobile: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [focusedField, setFocusedField] = useState<keyof SignUpForm | null>(null);

  // Entrance animations
  const headerAnim = useRef(new Animated.Value(0)).current;
  const formAnim = useRef(new Animated.Value(0)).current;
  const buttonAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(150, [
      Animated.timing(headerAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(formAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(buttonAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  const updateField = (key: keyof SignUpForm, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const validate = (): string | null => {
    if (!form.full_name.trim()) return 'Please enter your full name.';
    if (!form.email.includes('@')) return 'Please enter a valid email address.';
    if (form.mobile.trim().length < 7) return 'Please enter a valid mobile number.';
    return null;
  };

  const handleSignUp = async () => {
    const error = validate();
    if (error) {
      Alert.alert('Missing Info', error);
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        const errorData = await response.json();
        // Handle duplicate email from backend
        if (response.status === 400 || response.status === 422) {
          throw new Error(errorData.detail || 'Registration failed.');
        }
        throw new Error(`Server error: ${response.status}`);
      }

      const user = await response.json();

      // ─────────────────────────────────────────────
      // 📘 ASYNCSTORAGE LESSON:
      // AsyncStorage is React Native's way of persisting
      // small data across app sessions — like a cookie.
      // We save the user's ID and name here so:
      //   1. The app knows who is logged in
      //   2. BookingScreen can attach user_id to bookings
      //      without asking the user to type it again
      // ─────────────────────────────────────────────
      await AsyncStorage.setItem('user_id', user.id);
      await AsyncStorage.setItem('user_name', user.full_name);

      Alert.alert(
        '🎉 Welcome to Ceylox!',
        `Account created for ${user.full_name}.\nYou can now book rooms.`,
        [{ text: "Let's Go", onPress: () => router.replace('/catalog') }]
      );
    } catch (err: any) {
      Alert.alert('Sign Up Failed', err.message || 'Something went wrong. Please try again.');
      console.error('SignUp Error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Header ── */}
          <Animated.View style={[styles.header, { opacity: headerAnim }]}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <Text style={styles.backArrow}>←</Text>
            </TouchableOpacity>

            <View style={styles.logoRow}>
              <Text style={styles.logoGreen}>Ceylox</Text>
            </View>

            <Text style={styles.heading}>Create your{'\n'}account</Text>
            <Text style={styles.subheading}>
              Join to unlock instant bookings and manage your stays.
            </Text>
          </Animated.View>

          {/* ── Form ── */}
          <Animated.View style={[styles.formCard, { opacity: formAnim }]}>
            {FIELDS.map((field) => (
              <View key={field.key} style={styles.inputGroup}>
                <Text style={styles.label}>{field.label}</Text>
                <TextInput
                  style={[
                    styles.input,
                    focusedField === field.key && styles.inputFocused,
                  ]}
                  placeholder={field.placeholder}
                  placeholderTextColor="#bdc3c7"
                  value={form[field.key]}
                  onChangeText={(val) => updateField(field.key, val)}
                  keyboardType={field.keyboardType}
                  autoCapitalize={field.autoCapitalize}
                  onFocus={() => setFocusedField(field.key)}
                  onBlur={() => setFocusedField(null)}
                />
              </View>
            ))}
          </Animated.View>

          {/* ── Button ── */}
          <Animated.View style={{ opacity: buttonAnim }}>
            <TouchableOpacity
              style={[styles.button, submitting && styles.buttonDisabled]}
              onPress={handleSignUp}
              disabled={submitting}
              activeOpacity={0.85}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.buttonText}>Create Account</Text>
                  <Text style={styles.buttonArrow}>→</Text>
                </>
              )}
            </TouchableOpacity>

            <Text style={styles.disclaimer}>
              Already have an account?{' '}
              <Text
                style={styles.loginLink}
                onPress={() => router.replace('/catalog')}
              >
                Continue as guest
              </Text>
            </Text>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  scroll: { padding: 24, paddingBottom: 48 },

  // Header
  header: { marginBottom: 28 },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  backArrow: { fontSize: 20, color: '#2c3e50' },
  logoRow: { flexDirection: 'row', marginBottom: 16 },
  logoGreen: {
    fontSize: 14,
    fontWeight: '900',
    color: '#2ecc71',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  heading: {
    fontSize: 38,
    fontWeight: '900',
    color: '#2c3e50',
    letterSpacing: -1,
    lineHeight: 44,
    marginBottom: 10,
  },
  subheading: {
    fontSize: 15,
    color: '#7f8c8d',
    lineHeight: 22,
  },

  // Form card
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  inputGroup: { marginBottom: 18 },
  label: {
    fontSize: 11,
    fontWeight: '800',
    color: '#95a5a6',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: '#2c3e50',
    borderWidth: 1.5,
    borderColor: '#f1f2f6',
  },
  // Green border when field is active
  inputFocused: {
    borderColor: '#2ecc71',
    backgroundColor: '#fff',
  },

  // Button
  button: {
    backgroundColor: '#2c3e50',
    borderRadius: 14,
    paddingVertical: 18,
    paddingHorizontal: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  buttonArrow: { color: '#2ecc71', fontSize: 22 },

  disclaimer: {
    color: '#95a5a6',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },
  loginLink: {
    color: '#2ecc71',
    fontWeight: '700',
  },
});

export default SignUpScreen;