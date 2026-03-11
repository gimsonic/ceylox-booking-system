import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import WelcomeScreen from './index';
import HomeScreen from './home_screen';
import BookingScreen from './booking_screen';

// 📘 TYPESCRIPT LESSON 5: Navigation Types
// This defines what 'params' each screen expects.
// 'Booking' expects a roomId and the price so the user doesn't have to re-type it.
export type RootStackParamList = {
  Home: undefined;
  Catalog: undefined;
  Booking: { roomId: number; roomName: string; price: number };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName='Home'>
        
        {/* Welcome screen */}
        <Stack.Screen name="Home" component={WelcomeScreen} options={{ title: 'CEYLOX' }} />
        
        {/* Catalog screen */}
        <Stack.Screen name="Catalog" component={HomeScreen} options={{title: 'Available Rooms'}} />

        {/* Booking form */}
        <Stack.Screen name="Booking" component={BookingScreen} options={{ title: 'Secure Booking' }} />
      
      </Stack.Navigator>
    </NavigationContainer>
  );
}