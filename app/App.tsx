import 'react-native-gesture-handler';
import React from 'react';
import { StripeProvider } from '@stripe/stripe-react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { RootNavigator } from './src/navigation/RootNavigator';

const publishableKey = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY;

if (!publishableKey) {
  throw new Error('EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY is required.');
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StripeProvider publishableKey={publishableKey}>
        <RootNavigator />
      </StripeProvider>
    </GestureHandlerRootView>
  );
}
