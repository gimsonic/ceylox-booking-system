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

interface SignUpForm {
  full_name: string;
  email: string;
  mobile: string;
  password: string;
  confirmPassword: string;
}

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

const SignUpScreen = () => {
  const [form, setForm] = useState<SignUpForm>({
    full_name: "",
    email: "",
    mobile: "",
    password: "",
    confirmPassword: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [focusedField, setFocusedField] = useState<keyof SignUpForm | null>(
    null,
  );
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [validationMsg, setValidationMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const headerAnim = useRef(new Animated.Value(0)).current;
  const formAnim = useRef(new Animated.Value(0)).current;
  const buttonAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(150, [
      Animated.timing(headerAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(formAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(buttonAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const updateField = (key: keyof SignUpForm, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (validationMsg) setValidationMsg(null);
  };

  // ─────────────────────────────────────────────
  // 📘 LESSON: Live password strength feedback
  // We check length and character diversity to give
  // the user real-time guidance as they type.
  // This runs on every render — no useEffect needed
  // because it's derived directly from form.password.
  // ─────────────────────────────────────────────
  const getPasswordStrength = () => {
    const p = form.password;
    if (p.length === 0) return { label: "", color: "transparent", pct: 0 };
    if (p.length < 6) return { label: "Too short", color: "#e74c3c", pct: 20 };
    if (p.length < 8) return { label: "Weak", color: "#e67e22", pct: 45 };
    if (!/[A-Z]/.test(p) || !/[0-9]/.test(p))
      return { label: "Fair", color: "#f1c40f", pct: 70 };
    return { label: "Strong", color: "#2ecc71", pct: 100 };
  };
  const strength = getPasswordStrength();

  const validate = (): string | null => {
    if (!form.full_name.trim()) return "Please enter your full name.";
    if (!form.email.includes("@")) return "Please enter a valid email address.";
    if (form.mobile.trim().length < 7)
      return "Please enter a valid mobile number.";
    if (form.password.length < 6)
      return "Password must be at least 6 characters.";
    if (form.password !== form.confirmPassword)
      return "Passwords do not match.";
    return null;
  };

  const handleSignUp = async () => {
    const error = validate();
    if (error) {
      setValidationMsg(error);
      return;
    }

    setSubmitting(true);
    try {
      // ── Step 1: Register ──
      const registerRes = await fetch(`${API_URL}/users/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: form.full_name,
          email: form.email,
          mobile: form.mobile,
          password: form.password,
          is_guest: false,
        }),
      });

      if (!registerRes.ok) {
        const err = await registerRes.json().catch(() => null);
        throw new Error(
          err?.detail || `Registration failed (${registerRes.status})`,
        );
      }

      // ── Step 2: Login to get JWT ──
      // 📘 FastAPI OAuth2 expects FormData with 'username' + 'password'
      // NOT JSON — this is the standard OAuth2 password flow.
      const formData = new FormData();
      formData.append("username", form.email);
      formData.append("password", form.password);

      const loginRes = await fetch(`${API_URL}/auth/token`, {
        method: "POST",
        body: formData,
      });

      if (!loginRes.ok)
        throw new Error(
          "Account created but auto-login failed. Please log in.",
        );

      const { access_token } = await loginRes.json();

      // ── Step 3: Fetch profile ──
      const profileRes = await fetch(`${API_URL}/users/me`, {
        headers: { Authorization: `Bearer ${access_token}` },
      });

      if (!profileRes.ok) throw new Error("Could not load your profile.");
      const user = await profileRes.json();

      // ── Step 4: Save session ──
      await saveAuthSession({
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        token: access_token,
      });

      setSuccessMsg(`Welcome, ${user.full_name}! Taking you in...`);
      setTimeout(() => router.replace("/catalog"), 1500);
    } catch (err: any) {
      setValidationMsg(
        err.message || "Something went wrong. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle = (field: keyof SignUpForm) => [
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
          {/* Header */}
          <Animated.View style={[styles.header, { opacity: headerAnim }]}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Text style={styles.backArrow}>←</Text>
            </TouchableOpacity>
            <Text style={styles.logoGreen}>CEYLOX</Text>
            <Text style={styles.heading}>Create your{"\n"}account</Text>
            <Text style={styles.subheading}>
              Join to unlock instant bookings and manage your stays.
            </Text>
          </Animated.View>

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
          <Animated.View style={[styles.formCard, { opacity: formAnim }]}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={inputStyle("full_name")}
                placeholder="e.g. Kamal Perera"
                placeholderTextColor="#bdc3c7"
                value={form.full_name}
                onChangeText={(v) => updateField("full_name", v)}
                autoCapitalize="words"
                onFocus={() => setFocusedField("full_name")}
                onBlur={() => setFocusedField(null)}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <TextInput
                style={inputStyle("email")}
                placeholder="kamal@example.com"
                placeholderTextColor="#bdc3c7"
                value={form.email}
                onChangeText={(v) => updateField("email", v)}
                keyboardType="email-address"
                autoCapitalize="none"
                onFocus={() => setFocusedField("email")}
                onBlur={() => setFocusedField(null)}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Mobile Number</Text>
              <TextInput
                style={inputStyle("mobile")}
                placeholder="+94 77 123 4567"
                placeholderTextColor="#bdc3c7"
                value={form.mobile}
                onChangeText={(v) => updateField("mobile", v)}
                keyboardType="phone-pad"
                onFocus={() => setFocusedField("mobile")}
                onBlur={() => setFocusedField(null)}
              />
            </View>

            {/* Password with strength meter */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.passwordRow}>
                <TextInput
                  style={[inputStyle("password"), styles.passwordInput]}
                  placeholder="Min. 6 characters"
                  placeholderTextColor="#bdc3c7"
                  value={form.password}
                  onChangeText={(v) => updateField("password", v)}
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
              {form.password.length > 0 && (
                <View style={styles.strengthRow}>
                  <View style={styles.strengthTrack}>
                    <View
                      style={[
                        styles.strengthFill,
                        {
                          width: `${strength.pct}%` as any,
                          backgroundColor: strength.color,
                        },
                      ]}
                    />
                  </View>
                  <Text
                    style={[styles.strengthLabel, { color: strength.color }]}
                  >
                    {strength.label}
                  </Text>
                </View>
              )}
            </View>

            {/* Confirm password with match indicator */}
            <View style={[styles.inputGroup, { marginBottom: 0 }]}>
              <Text style={styles.label}>Confirm Password</Text>
              <View style={styles.passwordRow}>
                <TextInput
                  style={[inputStyle("confirmPassword"), styles.passwordInput]}
                  placeholder="Re-enter your password"
                  placeholderTextColor="#bdc3c7"
                  value={form.confirmPassword}
                  onChangeText={(v) => updateField("confirmPassword", v)}
                  secureTextEntry={!showConfirm}
                  autoCapitalize="none"
                  onFocus={() => setFocusedField("confirmPassword")}
                  onBlur={() => setFocusedField(null)}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowConfirm(!showConfirm)}
                >
                  <Text style={styles.eyeText}>
                    {showConfirm ? "🙈" : "👁"}
                  </Text>
                </TouchableOpacity>
              </View>
              {form.confirmPassword.length > 0 && (
                <Text
                  style={[
                    styles.matchIndicator,
                    {
                      color:
                        form.password === form.confirmPassword
                          ? "#2ecc71"
                          : "#e74c3c",
                    },
                  ]}
                >
                  {form.password === form.confirmPassword
                    ? "✓ Passwords match"
                    : "✕ Passwords do not match"}
                </Text>
              )}
            </View>
          </Animated.View>

          {/* Submit */}
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
              Already have an account?{" "}
              <Text
                style={styles.loginLink}
                onPress={() => router.replace("/login")}
              >
                Log in
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
  scroll: { padding: 24, paddingBottom: 48 },
  header: { marginBottom: 24 },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
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
    fontSize: 38,
    fontWeight: "900",
    color: "#2c3e50",
    letterSpacing: -1,
    lineHeight: 44,
    marginBottom: 10,
  },
  subheading: { fontSize: 15, color: "#7f8c8d", lineHeight: 22 },
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
  strengthRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 8,
  },
  strengthTrack: {
    flex: 1,
    height: 4,
    backgroundColor: "#ecf0f1",
    borderRadius: 2,
    overflow: "hidden",
  },
  strengthFill: { height: "100%", borderRadius: 2 },
  strengthLabel: {
    fontSize: 11,
    fontWeight: "700",
    width: 58,
    textAlign: "right",
  },
  matchIndicator: { fontSize: 12, fontWeight: "600", marginTop: 6 },
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
  disclaimer: {
    color: "#95a5a6",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
  },
  loginLink: { color: "#2ecc71", fontWeight: "700" },
});

export default SignUpScreen;
