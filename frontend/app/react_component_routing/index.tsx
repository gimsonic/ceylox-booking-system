import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ImageBackground } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from './app';

const WelcomeScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <View style={styles.container}>
      <ImageBackground 
        source={{ uri: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=2070' }} 
        style={styles.hero}
      >
        <View style={styles.overlay}>
          <Text style={styles.brand}>Ceylox</Text>
          <Text style={styles.tagline}>Redefining the standard of stay.</Text>
          
          <TouchableOpacity 
            style={styles.button} 
            onPress={() => {
              console.log("Button Pressed - Navigating to Catalog");
              navigation.navigate('Catalog');
            }}
          >
            <Text style={styles.buttonText}>Explore Available Rooms</Text>
          </TouchableOpacity>
        </View>
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  hero: { flex: 1, justifyContent: 'center' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  brand: { fontSize: 48, fontWeight: '900', color: '#fff', marginBottom: 10 },
  tagline: { fontSize: 18, color: '#ecf0f1', marginBottom: 40, textAlign: 'center' },
  button: { backgroundColor: '#2ecc71', paddingVertical: 15, paddingHorizontal: 30, borderRadius: 30 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});

export default WelcomeScreen;