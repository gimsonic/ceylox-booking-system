import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
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

const API_URL = "http://192.168.8.199:8000/bookings/";
const SCREEN_WIDTH = Dimensions.get("window").width;

// ── Helpers ──────────────────────────────────
const formatDate = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

// ─────────────────────────────────────────────
// Web Calendar
// Sized to fit within a single column — not side by side
// ─────────────────────────────────────────────
interface WebCalendarProps {
  value: Date | null;
  minDate?: Date;
  onChange: (date: Date) => void;
  onClose: () => void;
}

const WebCalendar = ({
  value,
  minDate,
  onChange,
  onClose,
}: WebCalendarProps) => {
  const today = new Date();
  const [viewYear, setViewYear] = useState(
    value?.getFullYear() ?? today.getFullYear(),
  );
  const [viewMonth, setViewMonth] = useState(
    value?.getMonth() ?? today.getMonth(),
  );

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else setViewMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else setViewMonth((m) => m + 1);
  };

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const isSelected = (day: number) =>
    value?.getFullYear() === viewYear &&
    value?.getMonth() === viewMonth &&
    value?.getDate() === day;
  const isDisabled = (day: number) => {
    if (!minDate) return false;
    return new Date(viewYear, viewMonth, day) < minDate;
  };
  const isToday = (day: number) =>
    today.getFullYear() === viewYear &&
    today.getMonth() === viewMonth &&
    today.getDate() === day;

  return (
    <View style={cal.container}>
      <View style={cal.header}>
        <TouchableOpacity onPress={prevMonth} style={cal.navBtn}>
          <Text style={cal.navArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={cal.monthLabel}>
          {MONTHS[viewMonth]} {viewYear}
        </Text>
        <TouchableOpacity onPress={nextMonth} style={cal.navBtn}>
          <Text style={cal.navArrow}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={cal.weekRow}>
        {DAYS.map((d) => (
          <Text key={d} style={cal.dayHeader}>
            {d}
          </Text>
        ))}
      </View>

      <View style={cal.grid}>
        {cells.map((day, i) => {
          if (!day) return <View key={`e-${i}`} style={cal.cell} />;
          const selected = isSelected(day);
          const disabled = isDisabled(day);
          const todayCell = isToday(day);
          return (
            <TouchableOpacity
              key={`d-${i}`}
              style={[
                cal.cell,
                selected && cal.selectedCell,
                todayCell && !selected && cal.todayCell,
              ]}
              onPress={() => {
                if (!disabled) {
                  onChange(new Date(viewYear, viewMonth, day));
                  onClose();
                }
              }}
              disabled={disabled}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  cal.dayText,
                  selected && cal.selectedDayText,
                  disabled && cal.disabledDayText,
                  todayCell && !selected && cal.todayDayText,
                ]}
              >
                {day}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity onPress={onClose} style={cal.cancelBtn}>
        <Text style={cal.cancelText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );
};

// ─────────────────────────────────────────────
// DatePickerField
// FIX 1 — Mobile: use inline DateTimePicker (no Modal)
//          which avoids the blank modal bug on iOS
// FIX 2 — Web: calendar is full-width, stacked vertically,
//          not squeezed into a flex row
// ─────────────────────────────────────────────
interface DatePickerFieldProps {
  label: string;
  value: Date | null;
  minDate?: Date;
  onChange: (date: Date) => void;
}

const DatePickerField = ({
  label,
  value,
  minDate,
  onChange,
}: DatePickerFieldProps) => {
  const [open, setOpen] = useState(false);
  const displayValue = value ? formatDate(value) : "Tap to select";

  if (Platform.OS === "ios") {
    // ── iOS: inline spinner — no Modal needed ──
    // The blank modal bug happens because Modal + DateTimePicker
    // has layout timing issues on iOS. Rendering it inline
    // inside the ScrollView works perfectly.
    return (
      <View style={styles.dateFieldContainer}>
        <Text style={styles.label}>{label}</Text>
        <TouchableOpacity
          style={[styles.dateButton, open && styles.dateButtonActive]}
          onPress={() => setOpen(!open)}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.dateButtonText,
              !value && styles.dateButtonPlaceholder,
            ]}
          >
            📅 {displayValue}
          </Text>
          <Text style={styles.dateButtonChevron}>{open ? "▲" : "▼"}</Text>
        </TouchableOpacity>

        {open && (
          <View style={styles.iosPickerContainer}>
            <DateTimePicker
              value={value ?? minDate ?? new Date()}
              mode="date"
              display="spinner"
              minimumDate={minDate}
              onChange={(_, selectedDate) => {
                if (selectedDate) onChange(selectedDate);
              }}
              style={styles.iosPicker}
              textColor="#2c3e50"
            />
            <TouchableOpacity
              style={styles.iosDoneBtn}
              onPress={() => setOpen(false)}
            >
              <Text style={styles.iosDoneBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  }

  if (Platform.OS === "android") {
    // ── Android: show system picker immediately when tapped ──
    return (
      <View style={styles.dateFieldContainer}>
        <Text style={styles.label}>{label}</Text>
        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => setOpen(true)}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.dateButtonText,
              !value && styles.dateButtonPlaceholder,
            ]}
          >
            📅 {displayValue}
          </Text>
        </TouchableOpacity>

        {open && (
          <DateTimePicker
            value={value ?? minDate ?? new Date()}
            mode="date"
            display="default"
            minimumDate={minDate}
            onChange={(_, selectedDate) => {
              setOpen(false);
              if (selectedDate) onChange(selectedDate);
            }}
          />
        )}
      </View>
    );
  }

  // ── Web: inline dropdown calendar ──
  return (
    <View style={styles.dateFieldContainer}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        style={[styles.dateButton, open && styles.dateButtonActive]}
        onPress={() => setOpen(!open)}
        activeOpacity={0.8}
      >
        <Text
          style={[
            styles.dateButtonText,
            !value && styles.dateButtonPlaceholder,
          ]}
        >
          📅 {displayValue}
        </Text>
        <Text style={styles.dateButtonChevron}>{open ? "▲" : "▼"}</Text>
      </TouchableOpacity>

      {open && (
        <WebCalendar
          value={value}
          minDate={minDate}
          onChange={onChange}
          onClose={() => setOpen(false)}
        />
      )}
    </View>
  );
};

// ─────────────────────────────────────────────
// Feedback Overlay
// ─────────────────────────────────────────────
interface FeedbackOverlayProps {
  type: "success" | "error";
  title: string;
  message: string;
  roomName?: string;
  nights?: number;
  totalPrice?: number;
  isGuest?: boolean;
  primaryLabel: string;
  secondaryLabel?: string;
  onPrimary: () => void;
  onSecondary?: () => void;
}

const FeedbackOverlay = ({
  type,
  title,
  message,
  roomName,
  nights,
  totalPrice,
  isGuest,
  primaryLabel,
  secondaryLabel,
  onPrimary,
  onSecondary,
}: FeedbackOverlayProps) => {
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const cardSlide = useRef(new Animated.Value(60)).current;
  const cardFade = useRef(new Animated.Value(0)).current;
  const iconScale = useRef(new Animated.Value(0)).current;
  const contentFade = useRef(new Animated.Value(0)).current;
  const isSuccess = type === "success";

  useEffect(() => {
    Animated.sequence([
      Animated.timing(backdropAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.spring(cardSlide, {
          toValue: 0,
          useNativeDriver: true,
          tension: 60,
          friction: 8,
        }),
        Animated.timing(cardFade, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
      Animated.spring(iconScale, {
        toValue: 1,
        useNativeDriver: true,
        tension: 80,
        friction: 5,
      }),
      Animated.timing(contentFade, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const animateOut = (cb: () => void) => {
    Animated.parallel([
      Animated.timing(backdropAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(cardFade, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => cb());
  };

  return (
    <Animated.View style={[styles.overlayBackdrop, { opacity: backdropAnim }]}>
      <Animated.View
        style={[
          styles.overlayCard,
          { opacity: cardFade, transform: [{ translateY: cardSlide }] },
        ]}
      >
        <Animated.View
          style={[
            styles.iconCircle,
            {
              backgroundColor: isSuccess ? "#2ecc71" : "#e74c3c",
              transform: [{ scale: iconScale }],
            },
          ]}
        >
          <Text style={styles.iconText}>{isSuccess ? "✓" : "✕"}</Text>
        </Animated.View>
        <Animated.View
          style={{ opacity: contentFade, alignItems: "center", width: "100%" }}
        >
          <Text
            style={[
              styles.overlayEyebrow,
              { color: isSuccess ? "#2ecc71" : "#e74c3c" },
            ]}
          >
            {isSuccess ? "BOOKING CONFIRMED" : "SOMETHING WENT WRONG"}
          </Text>
          <Text style={styles.overlayHeading}>{title}</Text>
          <Text style={styles.overlayMessage}>{message}</Text>
          {isSuccess && roomName && nights && totalPrice && (
            <>
              <View style={styles.summaryPill}>
                <Text style={styles.summaryPillText}>{roomName}</Text>
              </View>
              <View style={styles.detailsGrid}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>DURATION</Text>
                  <Text style={styles.detailValue}>
                    {nights} night{nights > 1 ? "s" : ""}
                  </Text>
                </View>
                <View style={styles.detailDivider} />
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>TOTAL</Text>
                  <Text style={[styles.detailValue, { color: "#2ecc71" }]}>
                    LKR {totalPrice.toLocaleString()}
                  </Text>
                </View>
              </View>
              {isGuest && (
                <View style={styles.guestNudge}>
                  <Text style={styles.guestNudgeText}>
                    💡 Create an account to manage your bookings and get
                    exclusive rates.
                  </Text>
                  <TouchableOpacity
                    onPress={() => animateOut(() => router.push("/signup"))}
                  >
                    <Text style={styles.guestNudgeLink}>Sign up now →</Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}
          <TouchableOpacity
            style={[
              styles.primaryButton,
              { backgroundColor: isSuccess ? "#2c3e50" : "#e74c3c" },
            ]}
            onPress={() => animateOut(onPrimary)}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryButtonText}>{primaryLabel}</Text>
          </TouchableOpacity>
          {secondaryLabel && onSecondary && (
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => animateOut(onSecondary)}
            >
              <Text style={styles.secondaryButtonText}>{secondaryLabel}</Text>
            </TouchableOpacity>
          )}
          {isSuccess && (
            <Text style={styles.overlayDisclaimer}>
              Free cancellation up to 24 hours before check-in
            </Text>
          )}
        </Animated.View>
      </Animated.View>
    </Animated.View>
  );
};

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

// ─────────────────────────────────────────────
// Main Booking Screen
// ─────────────────────────────────────────────
const BookingScreen = () => {
  const { roomId, roomName, price } = useLocalSearchParams<{
    roomId: string;
    roomName: string;
    price: string;
  }>();

  const [guestName, setGuestName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [checkIn, setCheckIn] = useState<Date | null>(null);
  const [checkOut, setCheckOut] = useState<Date | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [validationMsg, setValidationMsg] = useState<string | null>(null);
  const [overlayState, setOverlayState] = useState<"success" | "error" | null>(
    null,
  );
  const [errorMessage, setErrorMessage] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [isRegisteredUser, setIsRegisteredUser] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const savedId = await AsyncStorage.getItem("user_id");
        const savedName = await AsyncStorage.getItem("user_name");
        if (savedId) {
          setUserId(savedId);
          setIsRegisteredUser(true);
        }
        if (savedName) setGuestName(savedName);
      } catch {
        /* guest mode */
      }
    };
    loadUser();
  }, []);

  const calculateNights = (): number => {
    if (!checkIn || !checkOut) return 0;
    const diff = checkOut.getTime() - checkIn.getTime();
    const nights = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return nights > 0 ? nights : 0;
  };

  const nights = calculateNights();
  const totalPrice = nights * parseInt(price ?? "5500");

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  const minCheckOut = checkIn
    ? new Date(checkIn.getTime() + 86400000)
    : tomorrow;

  const handleBooking = async () => {
    if (!guestName || !email) {
      setValidationMsg("Please fill in your name and email.");
      return;
    }
    if (!email.includes("@")) {
      setValidationMsg("Please enter a valid email address.");
      return;
    }
    if (!checkIn) {
      setValidationMsg("Please select a check-in date.");
      return;
    }
    if (!checkOut) {
      setValidationMsg("Please select a check-out date.");
      return;
    }
    if (nights <= 0) {
      setValidationMsg("Check-out must be after check-in.");
      return;
    }

    setValidationMsg(null);
    setSubmitting(true);

    try {
      const payload: Record<string, unknown> = {
        room_id: parseInt(roomId ?? "0"),
        full_name: guestName,
        email: email,
        mobile: phone,
        check_in_date: formatDate(checkIn),
        check_out_date: formatDate(checkOut),
        total_price: totalPrice,
      };
      if (userId) payload.user_id = userId;

      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.detail || `Server returned error ${response.status}.`,
        );
      }

      setOverlayState("success");
    } catch (err: any) {
      setErrorMessage(
        err.message?.includes("fetch")
          ? "Could not reach the server. Please check your connection."
          : err.message || "Something went wrong. Please try again.",
      );
      setOverlayState("error");
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
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>YOU ARE BOOKING</Text>
          <Text style={styles.summaryRoom}>{roomName}</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryPrice}>
              LKR {parseInt(price ?? "5500").toLocaleString()}
            </Text>
            <Text style={styles.summaryPerNight}>/night</Text>
          </View>
        </View>

        {isRegisteredUser ? (
          <View style={styles.registeredBanner}>
            <Text style={styles.registeredBannerText}>
              ✓ Signed in · booking as {guestName}
            </Text>
          </View>
        ) : (
          <View style={styles.guestBanner}>
            <Text style={styles.guestBannerText}>
              Booking as guest · no account needed
            </Text>
            <TouchableOpacity onPress={() => router.push("/signup")}>
              <Text style={styles.guestBannerLink}>
                Sign up for faster booking →
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {validationMsg && (
          <ValidationBanner
            message={validationMsg}
            onDismiss={() => setValidationMsg(null)}
          />
        )}

        <Text style={styles.sectionTitle}>Guest Details</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Full Name *</Text>
          <TextInput
            style={inputStyle("name")}
            placeholder="e.g. Kamal Perera"
            placeholderTextColor="#bdc3c7"
            value={guestName}
            onChangeText={setGuestName}
            onFocus={() => setFocusedField("name")}
            onBlur={() => setFocusedField(null)}
          />
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email Address *</Text>
          <TextInput
            style={inputStyle("email")}
            placeholder="kamal@example.com"
            placeholderTextColor="#bdc3c7"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            onFocus={() => setFocusedField("email")}
            onBlur={() => setFocusedField(null)}
          />
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={inputStyle("phone")}
            placeholder="+94 77 123 4567"
            placeholderTextColor="#bdc3c7"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            onFocus={() => setFocusedField("phone")}
            onBlur={() => setFocusedField(null)}
          />
        </View>

        <Text style={styles.sectionTitle}>Stay Dates</Text>

        {/* ✅ FIX: Stacked vertically — NOT side by side
            Side-by-side made each calendar only 50% wide which
            looked cramped on web and broke on mobile.
            Stacked gives each picker full width to breathe. */}
        <DatePickerField
          label="Check-in *"
          value={checkIn}
          minDate={tomorrow}
          onChange={(date) => {
            setCheckIn(date);
            if (checkOut && checkOut <= date) setCheckOut(null);
          }}
        />

        <DatePickerField
          label="Check-out *"
          value={checkOut}
          minDate={minCheckOut}
          onChange={setCheckOut}
        />

        {nights > 0 && (
          <View style={styles.priceSummary}>
            <View style={styles.priceRow}>
              <Text style={styles.priceRowLabel}>
                LKR {parseInt(price ?? "5500").toLocaleString()} × {nights}{" "}
                night{nights > 1 ? "s" : ""}
              </Text>
              <Text style={styles.priceRowValue}>
                LKR {totalPrice.toLocaleString()}
              </Text>
            </View>
            <View style={styles.priceDivider} />
            <View style={styles.priceRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>
                LKR {totalPrice.toLocaleString()}
              </Text>
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

        <Text style={styles.disclaimer}>
          Free cancellation up to 24 hours before check-in.
        </Text>
      </ScrollView>

      {overlayState === "success" && (
        <FeedbackOverlay
          type="success"
          title="You're all set!"
          message="A confirmation will be sent to your email address."
          roomName={roomName ?? "your room"}
          nights={nights}
          totalPrice={totalPrice}
          isGuest={!isRegisteredUser}
          primaryLabel="Back to Home"
          onPrimary={() => router.replace("/")}
        />
      )}
      {overlayState === "error" && (
        <FeedbackOverlay
          type="error"
          title="Booking Failed"
          message={errorMessage}
          primaryLabel="Try Again"
          secondaryLabel="Go Back"
          onPrimary={() => setOverlayState(null)}
          onSecondary={() => router.back()}
        />
      )}
    </SafeAreaView>
  );
};

// ── Calendar styles ──────────────────────────
const cal = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#ecf0f1",
    marginTop: 6,
    padding: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  navBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#f8f9fa",
    justifyContent: "center",
    alignItems: "center",
  },
  navArrow: {
    fontSize: 20,
    color: "#2c3e50",
    fontWeight: "700",
    lineHeight: 24,
  },
  monthLabel: { fontSize: 14, fontWeight: "800", color: "#2c3e50" },
  weekRow: { flexDirection: "row", marginBottom: 2 },
  dayHeader: {
    flex: 1,
    textAlign: "center",
    fontSize: 10,
    fontWeight: "700",
    color: "#95a5a6",
    paddingVertical: 4,
  },
  grid: { flexDirection: "row", flexWrap: "wrap" },
  cell: {
    width: "14.28%",
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 6,
  },
  selectedCell: { backgroundColor: "#2ecc71" },
  todayCell: { borderWidth: 1.5, borderColor: "#2ecc71" },
  dayText: { fontSize: 12, fontWeight: "600", color: "#2c3e50" },
  selectedDayText: { color: "#fff", fontWeight: "900" },
  disabledDayText: { color: "#d5d8dc" },
  todayDayText: { color: "#2ecc71", fontWeight: "800" },
  cancelBtn: {
    marginTop: 8,
    paddingVertical: 8,
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#f1f2f6",
  },
  cancelText: { color: "#95a5a6", fontWeight: "700", fontSize: 12 },
});

// ── Main styles ──────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa" },
  scroll: { padding: 20, paddingBottom: 40 },
  summaryCard: {
    backgroundColor: "#364655", //#2c3e50
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  summaryLabel: {
    color: "#2ecc71",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 3,
    marginBottom: 6,
  },
  summaryRoom: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "900",
    marginBottom: 8,
  },
  summaryRow: { flexDirection: "row", alignItems: "baseline" },
  summaryPrice: { color: "#2ecc71", fontSize: 22, fontWeight: "bold" },
  summaryPerNight: { color: "#7f8c8d", fontSize: 13, marginLeft: 4 },
  registeredBanner: {
    backgroundColor: "#e8f8f5",
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#1abc9c",
  },
  registeredBannerText: { color: "#1abc9c", fontSize: 13, fontWeight: "700" },
  guestBanner: {
    backgroundColor: "#f0f4f8",
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#dce3ea",
  },
  guestBannerText: {
    color: "#5d7a8a",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 4,
  },
  guestBannerLink: { color: "#2ecc71", fontSize: 12, fontWeight: "700" },
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
  sectionTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#2c3e50",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 14,
    marginTop: 4,
  },
  inputGroup: { marginBottom: 16 },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: "#7f8c8d",
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    color: "#2c3e50",
    borderWidth: 1.5,
    borderColor: "#ecf0f1",
  },
  inputFocused: { borderColor: "#2ecc71" },

  // Date picker field wrapper
  dateFieldContainer: { marginBottom: 16 },
  dateButton: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 14,
    borderWidth: 1.5,
    borderColor: "#ecf0f1",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dateButtonActive: { borderColor: "#2ecc71" },
  dateButtonText: { fontSize: 14, color: "#2c3e50", fontWeight: "600" },
  dateButtonPlaceholder: { color: "#bdc3c7", fontWeight: "400" },
  dateButtonChevron: { fontSize: 10, color: "#95a5a6" },

  // iOS inline picker
  iosPickerContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ecf0f1",
    marginTop: 6,
    overflow: "hidden",
  },
  iosPicker: { height: 180 },
  iosDoneBtn: {
    paddingVertical: 12,
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#f1f2f6",
  },
  iosDoneBtnText: { color: "#2ecc71", fontWeight: "800", fontSize: 15 },

  priceSummary: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#ecf0f1",
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  priceRowLabel: { color: "#7f8c8d", fontSize: 14 },
  priceRowValue: { color: "#2c3e50", fontSize: 14, fontWeight: "600" },
  priceDivider: { height: 1, backgroundColor: "#f1f2f6", marginVertical: 8 },
  totalLabel: { color: "#2c3e50", fontSize: 16, fontWeight: "800" },
  totalValue: { color: "#2ecc71", fontSize: 18, fontWeight: "900" },
  button: {
    backgroundColor: "#2ecc71",
    borderRadius: 14,
    paddingVertical: 18,
    paddingHorizontal: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "800" },
  buttonArrow: { color: "#fff", fontSize: 20 },
  disclaimer: { color: "#95a5a6", fontSize: 11, textAlign: "center" },
  overlayBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(20,30,40,0.85)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  overlayCard: {
    backgroundColor: "#fff",
    borderRadius: 28,
    padding: 32,
    width: "100%",
    maxWidth: 420,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.3,
    shadowRadius: 40,
    elevation: 20,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  iconText: { color: "#fff", fontSize: 36, fontWeight: "900" },
  overlayEyebrow: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 3,
    marginBottom: 8,
  },
  overlayHeading: {
    fontSize: 28,
    fontWeight: "900",
    color: "#2c3e50",
    letterSpacing: -0.5,
    marginBottom: 10,
    textAlign: "center",
  },
  overlayMessage: {
    fontSize: 14,
    color: "#7f8c8d",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  summaryPill: {
    backgroundColor: "#f0fdf8",
    borderWidth: 1,
    borderColor: "#d1fae5",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 20,
  },
  summaryPillText: { color: "#059669", fontSize: 14, fontWeight: "700" },
  detailsGrid: {
    flexDirection: "row",
    backgroundColor: "#f8f9fa",
    borderRadius: 16,
    padding: 16,
    width: "100%",
    marginBottom: 20,
  },
  detailItem: { flex: 1, alignItems: "center" },
  detailLabel: {
    fontSize: 9,
    fontWeight: "800",
    color: "#95a5a6",
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  detailValue: { fontSize: 18, fontWeight: "900", color: "#2c3e50" },
  detailDivider: { width: 1, backgroundColor: "#ecf0f1", marginHorizontal: 8 },
  guestNudge: {
    backgroundColor: "#fffbeb",
    borderRadius: 12,
    padding: 14,
    width: "100%",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#fde68a",
  },
  guestNudgeText: {
    color: "#92400e",
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 6,
  },
  guestNudgeLink: { color: "#2ecc71", fontSize: 13, fontWeight: "800" },
  primaryButton: {
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 40,
    width: "100%",
    alignItems: "center",
    marginBottom: 10,
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  secondaryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    width: "100%",
    alignItems: "center",
    marginBottom: 8,
  },
  secondaryButtonText: { color: "#95a5a6", fontSize: 14, fontWeight: "600" },
  overlayDisclaimer: {
    color: "#bdc3c7",
    fontSize: 11,
    textAlign: "center",
    marginTop: 4,
  },
});

export default BookingScreen;
