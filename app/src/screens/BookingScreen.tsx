import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput } from 'react-native';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useStripe } from '@stripe/stripe-react-native';
import { createReservation, fetchVehicles } from '../services/api/reservations';
import type { Vehicle } from '../types/api';

interface ContactForm {
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  startDate: string;
  endDate: string;
}

const ACCENT = '#5B8CFF';

export const BookingScreen = () => {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const bottomSheetRef = useRef<BottomSheet>(null);

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [depositAmount, setDepositAmount] = useState<number | null>(null);

  const [form, setForm] = useState<ContactForm>({
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    startDate: '',
    endDate: '',
  });

  const snapPoints = useMemo(() => ['48%', '78%'], []);
  const buttonScale = useSharedValue(1);

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  useEffect(() => {
    const loadVehicles = async () => {
      try {
        const data = await fetchVehicles();
        setVehicles(data.vehicles);
      } catch {
        setErrorMessage('Impossible de charger les véhicules.');
        setStatus('error');
      } finally {
        setLoading(false);
      }
    };

    void loadVehicles();
  }, []);

  const onSelectVehicle = async (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    await Haptics.selectionAsync();
    bottomSheetRef.current?.snapToIndex(1);
  };

  const updateField = (key: keyof ContactForm, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const onPayDeposit = async () => {
    if (!selectedVehicle) {
      setErrorMessage('Sélectionnez un véhicule.');
      setStatus('error');
      return;
    }

    setSubmitting(true);
    setStatus('idle');
    setErrorMessage('');

    try {
      const reservation = await createReservation({
        vehicleId: selectedVehicle.id,
        clientName: form.clientName,
        clientEmail: form.clientEmail,
        clientPhone: form.clientPhone,
        startDate: form.startDate,
        endDate: form.endDate,
      });

      setDepositAmount(reservation.depositAmountCents);

      // Stripe: PaymentSheet encapsule la saisie carte côté SDK Stripe.
      const initResult = await initPaymentSheet({
        merchantDisplayName: 'Laks Location',
        paymentIntentClientSecret: reservation.paymentIntentClientSecret,
      });

      if (initResult.error) {
        throw new Error(initResult.error.message);
      }

      const presentResult = await presentPaymentSheet();

      if (presentResult.error) {
        throw new Error(presentResult.error.message);
      }

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setStatus('success');
    } catch (error) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Paiement indisponible.');
    } finally {
      setSubmitting(false);
    }
  };

  const onPressIn = () => {
    // Animation: feedback tactile/visuel synchronisé pour renforcer la sensation premium.
    buttonScale.value = withSpring(0.97, { damping: 20, stiffness: 250 });
  };

  const onPressOut = () => {
    buttonScale.value = withSpring(1, { damping: 20, stiffness: 250 });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Laks Location</Text>
        <Text style={styles.subtitle}>Réservez votre véhicule en un seul flux.</Text>

        {loading ? (
          <ActivityIndicator size="large" color={ACCENT} />
        ) : (
          vehicles.map((vehicle, index) => (
            <Animated.View entering={FadeInDown.delay(index * 80)} key={vehicle.id}>
              <BlurView intensity={40} tint="light" style={styles.card}>
                <Text style={styles.cardTitle}>
                  {vehicle.brand} {vehicle.model}
                </Text>
                <Text style={styles.cardMeta}>
                  {vehicle.category.toUpperCase()} · {(vehicle.pricePerDayCents / 100).toFixed(2)} €/jour
                </Text>
                <Pressable style={styles.pickButton} onPress={() => void onSelectVehicle(vehicle)}>
                  <Text style={styles.pickButtonLabel}>Sélectionner</Text>
                </Pressable>
              </BlurView>
            </Animated.View>
          ))
        )}
      </ScrollView>

      <BottomSheet ref={bottomSheetRef} index={0} snapPoints={snapPoints} enablePanDownToClose={false}>
        <BottomSheetView style={styles.sheetContent}>
          <Text style={styles.sheetTitle}>Finaliser la réservation</Text>
          <Text style={styles.sheetHint}>Dates au format YYYY-MM-DD</Text>

          <TextInput
            style={styles.input}
            placeholder="Nom complet"
            value={form.clientName}
            onChangeText={(value) => updateField('clientName', value)}
          />
          <TextInput
            style={styles.input}
            placeholder="Email"
            keyboardType="email-address"
            autoCapitalize="none"
            value={form.clientEmail}
            onChangeText={(value) => updateField('clientEmail', value)}
          />
          <TextInput
            style={styles.input}
            placeholder="Téléphone"
            keyboardType="phone-pad"
            value={form.clientPhone}
            onChangeText={(value) => updateField('clientPhone', value)}
          />
          <TextInput
            style={styles.input}
            placeholder="Date début"
            value={form.startDate}
            onChangeText={(value) => updateField('startDate', value)}
          />
          <TextInput
            style={styles.input}
            placeholder="Date fin"
            value={form.endDate}
            onChangeText={(value) => updateField('endDate', value)}
          />

          <Animated.View style={buttonAnimatedStyle}>
            <Pressable
              style={[styles.payButton, submitting && styles.payButtonDisabled]}
              disabled={submitting}
              onPressIn={onPressIn}
              onPressOut={onPressOut}
              onPress={() => void onPayDeposit()}
            >
              {submitting ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.payButtonLabel}>Payer l'acompte</Text>
              )}
            </Pressable>
          </Animated.View>

          {status === 'success' && (
            <Text style={styles.successText}>
              Paiement initié avec succès. Le webhook Stripe confirmera l'état final en base.
            </Text>
          )}
          {status === 'error' && <Text style={styles.errorText}>{errorMessage}</Text>}
          {depositAmount !== null && (
            <Text style={styles.depositText}>Acompte: {(depositAmount / 100).toFixed(2)} €</Text>
          )}
        </BottomSheetView>
      </BottomSheet>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0E1118',
  },
  container: {
    padding: 20,
    gap: 14,
    paddingBottom: 220,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  subtitle: {
    color: '#BFC6D8',
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  card: {
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.32)',
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  cardMeta: {
    color: '#DDE4F8',
    marginTop: 4,
  },
  pickButton: {
    marginTop: 12,
    alignSelf: 'flex-start',
    backgroundColor: ACCENT,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  pickButtonLabel: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  sheetContent: {
    flex: 1,
    paddingHorizontal: 20,
    gap: 10,
    backgroundColor: '#F5F7FD',
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#141A27',
  },
  sheetHint: {
    color: '#6D7790',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D4DBEC',
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  payButton: {
    marginTop: 6,
    backgroundColor: ACCENT,
    borderRadius: 16,
    paddingVertical: 13,
    alignItems: 'center',
  },
  payButtonDisabled: {
    opacity: 0.7,
  },
  payButtonLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  successText: {
    color: '#0D8B4B',
    fontWeight: '600',
  },
  errorText: {
    color: '#B12626',
    fontWeight: '600',
  },
  depositText: {
    color: '#283149',
    fontWeight: '600',
  },
});
