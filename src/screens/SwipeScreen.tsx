import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  Animated,
  PanResponder,
  Dimensions,
  Alert,
} from 'react-native';
import { useAuthStore } from '../store/authStore';
import { useSync } from '../hooks/useSync';
import { useNetwork } from '../hooks/useNetwork';
import {
  getCarsFromLocal,
  getLocalCarCount,
  getSwiperCarIds,
  saveCarsToLocal,
  savePreferenceLocal,
} from '../database/database';
import { apiFetchCars, apiSavePreference } from '../services/api';
import { Car } from '../types';

const { width: SCREEN_W } = Dimensions.get('window');
const CARD_W = SCREEN_W - 48;
const SWIPE_THRESHOLD = SCREEN_W * 0.28;

export default function SwipeScreen() {
  const { user, logout } = useAuthStore();
  const { isOnline } = useSync(); 
  const [cars, setCars] = useState<Car[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionFeedback, setActionFeedback] = useState<'like' | 'skip' | null>(null);

  // Animated values for swipe gesture
  const pan = useRef(new Animated.ValueXY()).current;
  const rotate = pan.x.interpolate({
    inputRange: [-SCREEN_W / 2, 0, SCREEN_W / 2],
    outputRange: ['-15deg', '0deg', '15deg'],
    extrapolate: 'clamp',
  });
  const likeOpacity = pan.x.interpolate({
    inputRange: [0, SWIPE_THRESHOLD],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });
  const skipOpacity = pan.x.interpolate({
    inputRange: [-SWIPE_THRESHOLD, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });


  const loadCars = useCallback(async () => {
    setLoading(true);
    try {
      let fetchedCars: Car[] = [];

      if (isOnline) {
        try {
          fetchedCars = await apiFetchCars();
          await saveCarsToLocal(fetchedCars);
        } catch {
          fetchedCars = await getCarsFromLocal();
        }
      } else {
        const count = await getLocalCarCount();
        if (count === 0) {
          Alert.alert(
            'Offline',
            'No car data available. Connect to the internet to load cars for the first time.'
          );
          setLoading(false);
          return;
        }
        fetchedCars = await getCarsFromLocal();
      }

      // Filter out already-swiped cars
      const swipedIds = await getSwiperCarIds();
      const swipedSet = new Set(swipedIds);
      const unswiped = fetchedCars.filter((c) => !swipedSet.has(c.id));
      setCars(unswiped);
    } catch (err) {
      console.error('loadCars error:', err);
    } finally {
      setLoading(false);
    }
  }, [isOnline]);

  useEffect(() => {
    loadCars();
  }, []);


  const handleSwipe = useCallback(
    (action: 'like' | 'skip') => {
      const car = cars[currentIndex];
      if (!car) return;

      setActionFeedback(action);

      const toX = action === 'like' ? SCREEN_W * 1.5 : -SCREEN_W * 1.5;
      Animated.timing(pan, {
        toValue: { x: toX, y: 0 },
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setActionFeedback(null);
        setCurrentIndex((prev) => prev + 1);
        savePreferenceLocal(car.id, action).catch(() => {});
        if (isOnline) {
          apiSavePreference(car.id, action).catch(() => {});
        }
      });
    },
    [cars, currentIndex, isOnline, pan]
  );

  useLayoutEffect(() => {
    pan.setValue({ x: 0, y: 0 });
  }, [currentIndex]);

  const handleSwipeRef = useRef(handleSwipe);
  useEffect(() => {
    handleSwipeRef.current = handleSwipe;
  }, [handleSwipe]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx > SWIPE_THRESHOLD) {
          handleSwipeRef.current('like');
        } else if (gesture.dx < -SWIPE_THRESHOLD) {
          handleSwipeRef.current('skip');
        } else {
          Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: true }).start();
        }
      },
    })
  ).current;

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading cars...</Text>
      </View>
    );
  }

  const currentCar = cars[currentIndex];
  const nextCar = cars[currentIndex + 1];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, {user?.name?.split(' ')[0] ?? 'there'} 👋</Text>
          <Text style={styles.subGreeting}>Swipe to find your car</Text>
        </View>
        <View style={styles.headerRight}>
          {!isOnline && (
            <View style={styles.offlineBadge}>
              <Text style={styles.offlineBadgeText}>Offline</Text>
            </View>
          )}
          <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
            <Text style={styles.logoutText}>Sign out</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Card stack */}
      <View style={styles.cardArea}>
        {cars.length === 0 || currentIndex >= cars.length ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🎉</Text>
            <Text style={styles.emptyTitle}>All caught up!</Text>
            <Text style={styles.emptySub}>You've seen all available cars.</Text>
            <TouchableOpacity style={styles.reloadBtn} onPress={() => { setCurrentIndex(0); loadCars(); }}>
              <Text style={styles.reloadBtnText}>Reload</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Background card (next) */}
            {nextCar && (
              <View style={[styles.card, styles.cardBack]}>
                <CarCard car={nextCar} />
              </View>
            )}

            {/* Foreground card (current) */}
            <Animated.View
              {...panResponder.panHandlers}
              style={[
                styles.card,
                {
                  transform: [
                    { translateX: pan.x },
                    { translateY: pan.y },
                    { rotate },
                  ],
                },
              ]}
            >
              {/* Like / Skip overlays */}
              <Animated.View style={[styles.stampLike, { opacity: likeOpacity }]}>
                <Text style={styles.stampLikeText}>LIKE ❤️</Text>
              </Animated.View>
              <Animated.View style={[styles.stampSkip, { opacity: skipOpacity }]}>
                <Text style={styles.stampSkipText}>SKIP ✕</Text>
              </Animated.View>

              <CarCard car={currentCar} />
            </Animated.View>
          </>
        )}
      </View>

      {/* Action buttons */}
      {currentCar && currentIndex < cars.length && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.skipBtn]}
            onPress={() => handleSwipe('skip')}
          >
            <Text style={styles.skipBtnText}>✕</Text>
          </TouchableOpacity>

          <View style={styles.counter}>
            <Text style={styles.counterText}>
              {currentIndex + 1} / {cars.length}
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.actionBtn, styles.likeBtn]}
            onPress={() => handleSwipe('like')}
          >
            <Text style={styles.likeBtnText}>❤</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}


function CarCard({ car }: { car: Car }) {
  const [imgError, setImgError] = useState(false);

  return (
    <View style={cardStyles.container}>
      {car.image_url && !imgError ? (
        <Image
          source={{ uri: car.image_url }}
          style={cardStyles.image}
          resizeMode="cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <View style={cardStyles.imageFallback}>
          <Text style={cardStyles.imageFallbackText}>🚗</Text>
        </View>
      )}
      <View style={cardStyles.info}>
        <View style={cardStyles.typeBadge}>
          <Text style={cardStyles.typeText}>{car.type}</Text>
        </View>
        <Text style={cardStyles.model}>{car.model}</Text>
        <Text style={cardStyles.brand}>{car.brand}</Text>
      </View>
    </View>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f172a' },
  loadingText: { color: '#64748b', marginTop: 12, fontSize: 14 },

  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 16,
  },
  greeting: { fontSize: 20, fontWeight: '700', color: '#f8fafc' },
  subGreeting: { fontSize: 13, color: '#64748b', marginTop: 2 },
  headerRight: { alignItems: 'flex-end', gap: 8 },
  offlineBadge: {
    backgroundColor: '#f59e0b22',
    borderWidth: 0.5,
    borderColor: '#f59e0b',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
  },
  offlineBadgeText: { fontSize: 11, color: '#f59e0b', fontWeight: '600' },
  logoutBtn: { paddingHorizontal: 12, paddingVertical: 6 },
  logoutText: { fontSize: 13, color: '#64748b' },

  cardArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    position: 'absolute',
    width: CARD_W,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  cardBack: {
    transform: [{ scale: 0.95 }, { translateY: 16 }],
    zIndex: 0,
  },
  stampLike: {
    position: 'absolute',
    top: 28,
    left: 20,
    zIndex: 10,
    borderWidth: 3,
    borderColor: '#22c55e',
    borderRadius: 8,
    padding: 6,
    transform: [{ rotate: '-15deg' }],
  },
  stampLikeText: { fontSize: 20, fontWeight: '800', color: '#22c55e' },
  stampSkip: {
    position: 'absolute',
    top: 28,
    right: 20,
    zIndex: 10,
    borderWidth: 3,
    borderColor: '#ef4444',
    borderRadius: 8,
    padding: 6,
    transform: [{ rotate: '15deg' }],
  },
  stampSkipText: { fontSize: 20, fontWeight: '800', color: '#ef4444' },

  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 48,
    paddingTop: 16,
    gap: 24,
  },
  actionBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  skipBtn: { backgroundColor: '#1e293b', borderWidth: 1.5, borderColor: '#ef4444' },
  skipBtnText: { fontSize: 22, color: '#ef4444' },
  likeBtn: { backgroundColor: '#3b82f6' },
  likeBtnText: { fontSize: 22, color: '#fff' },
  counter: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#1e293b',
    borderRadius: 20,
  },
  counterText: { fontSize: 13, color: '#64748b', fontWeight: '500' },

  emptyState: { alignItems: 'center', padding: 32 },
  emptyEmoji: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { fontSize: 22, fontWeight: '700', color: '#f8fafc', marginBottom: 8 },
  emptySub: { fontSize: 14, color: '#64748b', textAlign: 'center' },
  reloadBtn: {
    marginTop: 24,
    backgroundColor: '#3b82f6',
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 10,
  },
  reloadBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
});

const cardStyles = StyleSheet.create({
  container: { backgroundColor: '#1e293b', borderRadius: 24, overflow: 'hidden' },
  image: { width: '100%', height: 340 },
  imageFallback: {
    width: '100%',
    height: 340,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageFallbackText: { fontSize: 72 },
  info: { padding: 20 },
  typeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#3b82f622',
    borderWidth: 0.5,
    borderColor: '#3b82f6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 8,
  },
  typeText: { fontSize: 12, color: '#60a5fa', fontWeight: '600' },
  model: { fontSize: 22, fontWeight: '700', color: '#f8fafc', marginBottom: 4 },
  brand: { fontSize: 15, color: '#64748b' },
});
