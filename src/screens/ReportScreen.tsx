import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useAuthStore } from '../store/authStore';
import { useNetwork } from '../hooks/useNetwork';
import { getLocalReport } from '../database/database';
import { apiFetchReport } from '../services/api';
import { Report } from '../types';

export default function ReportScreen() {
  const { user } = useAuthStore();
  const { isOnline } = useNetwork();

  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [source, setSource] = useState<'server' | 'local'>('local');

  const loadReport = useCallback(async () => {
    try {
      if (isOnline) {
        try {
          const data = await apiFetchReport();
          setReport(data);
          setSource('server');
          return;
        } catch {
        }
      }
      const localData = await getLocalReport();
      setReport(localData);
      setSource('local');
    } catch (err) {
      console.error('loadReport error:', err);
    }
  }, [isOnline]);

  useEffect(() => {
    setLoading(true);
    loadReport().finally(() => setLoading(false));
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadReport();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading your stats...</Text>
      </View>
    );
  }

  const hasData =
    report &&
    (report.most_liked_brand || report.most_liked_model || report.most_liked_type);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#3b82f6"
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Your Report</Text>
        <Text style={styles.subtitle}>Based on your swipe history</Text>
        <View style={[styles.sourceBadge, source === 'local' && styles.sourceBadgeOffline]}>
          <Text style={[styles.sourceBadgeText, source === 'local' && styles.sourceBadgeTextOffline]}>
            {source === 'server' ? '🟢 Live data' : '🟡 Offline data'}
          </Text>
        </View>
      </View>

      {!hasData ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>📊</Text>
          <Text style={styles.emptyTitle}>No data yet</Text>
          <Text style={styles.emptySub}>
            Start swiping cars on the Browse tab to see your preferences here.
          </Text>
        </View>
      ) : (
        <>
          <View style={styles.totalsRow}>
            <View style={[styles.totalCard, styles.totalLike]}>
              <Text style={styles.totalEmoji}>❤️</Text>
              <Text style={styles.totalNumber}>{report?.total_likes ?? 0}</Text>
              <Text style={styles.totalLabel}>Liked</Text>
            </View>
            <View style={[styles.totalCard, styles.totalSkip]}>
              <Text style={styles.totalEmoji}>✕</Text>
              <Text style={styles.totalNumber}>{report?.total_skips ?? 0}</Text>
              <Text style={styles.totalLabel}>Skipped</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Your top preferences</Text>

          <StatCard
            icon="🏆"
            label="Most liked brand"
            value={report?.most_liked_brand}
            color="#f59e0b"
          />
          <StatCard
            icon="🚗"
            label="Most liked model"
            value={report?.most_liked_model}
            color="#3b82f6"
          />
          <StatCard
            icon="📂"
            label="Most liked type"
            value={report?.most_liked_type}
            color="#8b5cf6"
          />
        </>
      )}

      <Text style={styles.pullHint}>Pull down to refresh</Text>
    </ScrollView>
  );
}


function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: string;
  label: string;
  value: string | null | undefined;
  color: string;
}) {
  return (
    <View style={statStyles.card}>
      <View style={[statStyles.iconBox, { backgroundColor: color + '22', borderColor: color + '44' }]}>
        <Text style={statStyles.icon}>{icon}</Text>
      </View>
      <View style={statStyles.text}>
        <Text style={statStyles.label}>{label}</Text>
        <Text style={[statStyles.value, !value && statStyles.valueEmpty]}>
          {value ?? 'Not enough data'}
        </Text>
      </View>
    </View>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  content: { padding: 24, paddingTop: 60, paddingBottom: 40 },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f172a',
  },
  loadingText: { color: '#64748b', marginTop: 12, fontSize: 14 },

  header: { marginBottom: 28 },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#f8fafc',
    letterSpacing: -0.5,
  },
  subtitle: { fontSize: 14, color: '#64748b', marginTop: 4 },
  sourceBadge: {
    alignSelf: 'flex-start',
    marginTop: 10,
    backgroundColor: '#16a34a22',
    borderWidth: 0.5,
    borderColor: '#16a34a',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  sourceBadgeOffline: {
    backgroundColor: '#f59e0b22',
    borderColor: '#f59e0b',
  },
  sourceBadgeText: { fontSize: 12, color: '#4ade80', fontWeight: '500' },
  sourceBadgeTextOffline: { color: '#fbbf24' },

  totalsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 28,
  },
  totalCard: {
    flex: 1,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 0.5,
  },
  totalLike: {
    backgroundColor: '#16a34a18',
    borderColor: '#16a34a44',
  },
  totalSkip: {
    backgroundColor: '#ef444418',
    borderColor: '#ef444444',
  },
  totalEmoji: { fontSize: 24, marginBottom: 8 },
  totalNumber: {
    fontSize: 32,
    fontWeight: '700',
    color: '#f8fafc',
  },
  totalLabel: { fontSize: 13, color: '#64748b', marginTop: 4 },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#94a3b8',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },

  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyEmoji: { fontSize: 56, marginBottom: 16 },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 8,
  },
  emptySub: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 22,
  },

  pullHint: {
    textAlign: 'center',
    color: '#334155',
    fontSize: 12,
    marginTop: 24,
  },
});

const statStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 0.5,
    borderColor: '#334155',
    gap: 14,
  },
  iconBox: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
  },
  icon: { fontSize: 24 },
  text: { flex: 1 },
  label: { fontSize: 12, color: '#64748b', fontWeight: '500', marginBottom: 4 },
  value: { fontSize: 18, fontWeight: '700', color: '#f8fafc' },
  valueEmpty: { color: '#334155', fontSize: 14, fontWeight: '400' },
});
