import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Animated,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { saveAuthSession } from "./auth";

const API_URL = "http://192.168.8.199:8000";

const ValidationBanner = ({
  message,
  onDismiss,
}: {
  message: string;
  onDismiss: () => void;
}) => (
  <View style={styles.validationBanner}>
    <Text style={styles.validationText}>⚠ {message}</Text>
    <TouchableOpacity onPress={onDismiss}>
      <Text style={styles.validationDismiss}>✕</Text>
    </TouchableOpacity>
  </View>
);

const LoginScreen = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [validationMsg, setValidationMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 700,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      setValidationMsg("Please enter your email and password.");
      return;
    }
    if (!email.includes("@")) {
      setValidationMsg("Please enter a valid email address.");
      return;
    }

    setValidationMsg(null);
    setSubmitting(true);

    try {
      const loginRes = await fetch(`${API_URL}/login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const loginData = await loginRes.json().catch(() => null);

      if (!loginRes.ok) {
        throw new Error(
          loginData?.detail || `Login failed (${loginRes.status})`,
        );
      }

      await saveAuthSession({
        id: loginData.user.id,
        full_name: loginData.user.full_name,
        email: loginData.user.email,
        token: loginData.access_token,
      });

      setSuccessMsg(`Welcome back, ${loginData.user.full_name}!`);
      setTimeout(() => router.replace("/catalog"), 1200);
    } catch (err: any) {
      setValidationMsg(
        err.message || "Something went wrong. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };
  /*
  const handleLogin = async () => {
    if (!email || !password) {
      setValidationMsg("Please enter your email and password.");
      return;
    }
    if (!email.includes("@")) {
      setValidationMsg("Please enter a valid email address.");
      return;
    }

    setValidationMsg(null);
    setSubmitting(true);

    try {
      // ─────────────────────────────────────────────
      // 📘 LESSON: OAuth2 Password Flow
      // FastAPI's /auth/token endpoint follows the OAuth2
      // standard which requires FormData (not JSON).
      // The field must be named 'username' even though
      // we're using an email — this is the OAuth2 spec.
      // ─────────────────────────────────────────────
      const formData = new FormData();
      formData.append("username", email);
      formData.append("password", password);

      const loginRes = await fetch(`${API_URL}/auth/token`, {
        method: "POST",
        body: formData,
      });

      if (!loginRes.ok) {
        // 401 = wrong credentials
        if (loginRes.status === 401)
          throw new Error("Incorrect email or password.");
        throw new Error(`Login failed (${loginRes.status})`);
      }

      const { access_token } = await loginRes.json();

      // Fetch full user profile with the token
      const profileRes = await fetch(`${API_URL}/users/me`, {
        headers: { Authorization: `Bearer ${access_token}` },
      });

      if (!profileRes.ok) throw new Error("Could not load your profile.");
      const user = await profileRes.json();

      // Save the session using our auth utility
      await saveAuthSession({
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        token: access_token,
      });

      setSuccessMsg(`Welcome back, ${user.full_name}!`);
      setTimeout(() => router.replace("/catalog"), 1200);
    } catch (err: any) {
      setValidationMsg(
        err.message || "Something went wrong. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };
  */

  const inputStyle = (field: string) => [
    styles.input,
    focusedField === field && styles.inputFocused,
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View
            style={[
              styles.content,
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
            ]}
          >
            {/* Header */}
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Text style={styles.backArrow}>←</Text>
            </TouchableOpacity>

            <Text style={styles.logoGreen}>CEYLOX</Text>
            <Text style={styles.heading}>Welcome{"\n"}back.</Text>
            <Text style={styles.subheading}>
              Sign in to manage your bookings and access member rates.
            </Text>

            {validationMsg && (
              <ValidationBanner
                message={validationMsg}
                onDismiss={() => setValidationMsg(null)}
              />
            )}
            {successMsg && (
              <View style={styles.successBanner}>
                <Text style={styles.successBannerText}>✓ {successMsg}</Text>
              </View>
            )}

            {/* Form */}
            <View style={styles.formCard}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email Address</Text>
                <TextInput
                  style={inputStyle("email")}
                  placeholder="kamal@example.com"
                  placeholderTextColor="#bdc3c7"
                  value={email}
                  onChangeText={(v) => {
                    setEmail(v);
                    if (validationMsg) setValidationMsg(null);
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  onFocus={() => setFocusedField("email")}
                  onBlur={() => setFocusedField(null)}
                />
              </View>

              <View style={[styles.inputGroup, { marginBottom: 0 }]}>
                <Text style={styles.label}>Password</Text>
                <View style={styles.passwordRow}>
                  <TextInput
                    style={[inputStyle("password"), styles.passwordInput]}
                    placeholder="Your password"
                    placeholderTextColor="#bdc3c7"
                    value={password}
                    onChangeText={(v) => {
                      setPassword(v);
                      if (validationMsg) setValidationMsg(null);
                    }}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    onFocus={() => setFocusedField("password")}
                    onBlur={() => setFocusedField(null)}
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Text style={styles.eyeText}>
                      {showPassword ? "🙈" : "👁"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Login button */}
            <TouchableOpacity
              style={[styles.button, submitting && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={submitting}
              activeOpacity={0.85}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.buttonText}>Log In</Text>
                  <Text style={styles.buttonArrow}>→</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Guest option */}
            <TouchableOpacity
              style={styles.guestButton}
              onPress={() => router.replace("/catalog")}
              activeOpacity={0.8}
            >
              <Text style={styles.guestButtonText}>Continue as Guest</Text>
            </TouchableOpacity>

            <Text style={styles.disclaimer}>
              Don't have an account?{" "}
              <Text
                style={styles.signUpLink}
                onPress={() => router.replace("/signup")}
              >
                Sign up
              </Text>
            </Text>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa" },
  scroll: { flexGrow: 1 },
  content: { flex: 1, padding: 24, paddingBottom: 48 },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 32,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  backArrow: { fontSize: 20, color: "#2c3e50" },
  logoGreen: {
    fontSize: 13,
    fontWeight: "900",
    color: "#2ecc71",
    letterSpacing: 2,
    marginBottom: 16,
  },
  heading: {
    fontSize: 42,
    fontWeight: "900",
    color: "#2c3e50",
    letterSpacing: -1.5,
    lineHeight: 48,
    marginBottom: 12,
  },
  subheading: {
    fontSize: 15,
    color: "#7f8c8d",
    lineHeight: 22,
    marginBottom: 28,
  },
  validationBanner: {
    backgroundColor: "#fdf2f2",
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#f5c6c6",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  validationText: {
    color: "#c0392b",
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
  },
  validationDismiss: {
    color: "#c0392b",
    fontSize: 16,
    fontWeight: "800",
    paddingLeft: 12,
  },
  successBanner: {
    backgroundColor: "#e8f8f5",
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#1abc9c",
  },
  successBannerText: { color: "#1abc9c", fontSize: 13, fontWeight: "700" },
  formCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  inputGroup: { marginBottom: 18 },
  label: {
    fontSize: 11,
    fontWeight: "800",
    color: "#95a5a6",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: "#2c3e50",
    borderWidth: 1.5,
    borderColor: "#f1f2f6",
  },
  inputFocused: { borderColor: "#2ecc71", backgroundColor: "#fff" },
  passwordRow: { position: "relative" },
  passwordInput: { paddingRight: 48 },
  eyeButton: { position: "absolute", right: 14, top: 14 },
  eyeText: { fontSize: 18 },
  button: {
    backgroundColor: "#2c3e50",
    borderRadius: 14,
    paddingVertical: 18,
    paddingHorizontal: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "800" },
  buttonArrow: { color: "#2ecc71", fontSize: 22 },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 12,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: "#ecf0f1" },
  dividerText: { color: "#bdc3c7", fontSize: 13, fontWeight: "600" },
  guestButton: {
    borderWidth: 1.5,
    borderColor: "#dce3ea",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 20,
    backgroundColor: "#fff",
  },
  guestButtonText: { color: "#7f8c8d", fontSize: 15, fontWeight: "700" },
  disclaimer: { color: "#95a5a6", fontSize: 13, textAlign: "center" },
  signUpLink: { color: "#2ecc71", fontWeight: "700" },
});

export default LoginScreen;
