import { Stack } from "expo-router";

//import { useEffect } from "react";
//import { clearAuthSession } from "./auth";

export default function RootLayout() {
  {
    /*
    useEffect(() => {
      clearAuthSession();
    }, []);*/
  }
  return (
    <Stack
      // Default styling applied to ALL screens unless overridden below
      screenOptions={{
        headerStyle: {
          backgroundColor: "#ffffff",
        },
        headerTintColor: "#2ecc71", // Back arrow color
        headerTitleStyle: {
          fontWeight: "800",
          color: "#2c3e50",
          fontSize: 16,
        },
        headerBackTitle: "", // Hides the text next to back arrow on iOS (cleaner look)
        animation: "slide_from_right", // Consistent slide animation on both iOS & Android
        contentStyle: {
          backgroundColor: "#f8f9fa", // Prevents white flash between screen transitions
        },
      }}
    >
      {/* ─── Welcome Screen ─────────────────────────────
          headerShown: false — lets the hero image go full
          bleed to the top of the screen with no header bar
          interrupting it.
      ─────────────────────────────────────────────────── */}
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
          animation: "fade", // Fade in on first load feels more premium
        }}
      />

      {/* ─── Catalog Screen ──────────────────────────────
          Standard header with a back arrow auto-added by
          Expo Router. User can tap it or swipe right on iOS.
      ─────────────────────────────────────────────────── */}
      <Stack.Screen
        name="catalog"
        options={{
          headerShown: false,
        }}
      />

      {/* ─── Booking Screen ──────────────────────────────
          Same standard header. The title confirms to the
          user they are about to make a real booking.
      ─────────────────────────────────────────────────── */}
      <Stack.Screen
        name="booking"
        options={{
          title: "Secure Booking",
        }}
      />
    </Stack>
  );
}
