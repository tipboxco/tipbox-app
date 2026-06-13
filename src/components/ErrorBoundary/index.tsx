import React, { Component, ErrorInfo, ReactNode } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  useColorScheme,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import * as SplashScreen from 'expo-splash-screen';

// Modül seviyesinde tutulan çarpışma sayacı.
// Component remount'larında sıfırlanmaz; sonsuz döngüyü önlemek için kullanılır.
let consecutiveCrashes = 0;
const MAX_AUTO_CLEAR = 1; // İlk crash: otomatik temizle. Sonraki crash: manuel ekran göster.

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  isClearing: boolean;
  // İlk crashte auto-clear devredeyse true → spinner gösterilir
  autoClearing: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      isClearing: false,
      autoClearing: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    consecutiveCrashes += 1;
    const autoClearing = consecutiveCrashes <= MAX_AUTO_CLEAR;
    return { hasError: true, error, autoClearing };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // ─── CRASH REPORT ────────────────────────────────────────────────────────
    console.error('╔══════════════════════════════════════════════════════════');
    console.error('║ [ErrorBoundary] ❌ CRASH #' + consecutiveCrashes);
    console.error('║ Hata tipi :', error.name);
    console.error('║ Mesaj     :', error.message);
    console.error('║ Stack     :', error.stack?.split('\n').slice(0, 5).join('\n             '));
    console.error('║ Component :', errorInfo.componentStack?.trim().split('\n').slice(0, 8).join('\n             '));
    console.error('╚══════════════════════════════════════════════════════════');
    this.setState({ errorInfo });

    // Splash screen açık kalıyorsa kapat — recovery ekranı görünsün
    SplashScreen.hideAsync().catch(() => {});

    // İlk crashte storage otomatik temizlenir ve uygulama yeniden başlar.
    // consecutiveCrashes > MAX_AUTO_CLEAR ise sonsuz döngü riski var, manuel ekran gösterilir.
    if (consecutiveCrashes <= MAX_AUTO_CLEAR) {
      this.runAutoClear();
    }
  }

  runAutoClear = async () => {
    try {
      await Promise.allSettled([
        AsyncStorage.clear(),
        SecureStore.deleteItemAsync('access_token'),
        SecureStore.deleteItemAsync('refresh_token'),
      ]);
    } catch (_) {
      // Temizleme başarısız olsa da sıfırlamaya devam et
    }
    // Reset in-memory auth state so the app shows login screen after recovery,
    // not the authenticated tree (which would crash again immediately).
    try {
      const { useAppStore } = require('@/src/store/appStore');
      useAppStore.setState({ isAuthenticated: false, user: null, accessToken: null });
    } catch (_) {}
    // NOTE: consecutiveCrashes is intentionally NOT reset here.
    // Resetting it would cause the second crash to be treated as the "first" again → infinite loop.
    this.setState({ hasError: false, error: null, errorInfo: null, autoClearing: false });
  };

  handleManualReset = () => {
    consecutiveCrashes = 0;
    this.setState({ hasError: false, error: null, errorInfo: null, isClearing: false, autoClearing: false });
  };

  handleManualClearAndReset = async () => {
    this.setState({ isClearing: true });
    try {
      await Promise.allSettled([
        AsyncStorage.clear(),
        SecureStore.deleteItemAsync('access_token'),
        SecureStore.deleteItemAsync('refresh_token'),
      ]);
    } catch (_) {}
    consecutiveCrashes = 0;
    this.setState({ hasError: false, error: null, errorInfo: null, isClearing: false, autoClearing: false });
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    if (this.props.fallback) {
      return this.props.fallback;
    }

    // İlk crash: otomatik temizleme spinner'ı
    if (this.state.autoClearing) {
      return (
        <AutoClearScreen
          error={this.state.error}
          errorInfo={this.state.errorInfo}
        />
      );
    }

    // İkinci+ crash: kullanıcıya manuel seçenekler sun
    return (
      <ManualRecoveryScreen
        error={this.state.error}
        errorInfo={this.state.errorInfo}
        isClearing={this.state.isClearing}
        onReset={this.handleManualReset}
        onClearAndReset={this.handleManualClearAndReset}
      />
    );
  }
}

// ─── Otomatik Temizleme Ekranı ───────────────────────────────────────────────

interface AutoClearScreenProps {
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

const AutoClearScreen: React.FC<AutoClearScreenProps> = ({ error, errorInfo }) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const bg = isDark ? '#0F0F0F' : '#FFFFFF';
  const textSecondary = isDark ? '#A0A0A0' : '#666666';

  return (
    <View style={[styles.root, { backgroundColor: bg }]}>
      <ActivityIndicator size="large" color="#BBFF4E" />
      <Text style={[styles.recoveringText, { color: textSecondary }]}>
        Kurtarılıyor...
      </Text>
      {__DEV__ && error && (
        <View style={styles.devInline}>
          <Text style={styles.devError}>{error.toString()}</Text>
          {errorInfo?.componentStack ? (
            <Text style={styles.devStack}>{errorInfo.componentStack.trim()}</Text>
          ) : null}
        </View>
      )}
    </View>
  );
};

// ─── Manuel Kurtarma Ekranı ──────────────────────────────────────────────────

interface ManualRecoveryScreenProps {
  error: Error | null;
  errorInfo: ErrorInfo | null;
  isClearing: boolean;
  onReset: () => void;
  onClearAndReset: () => void;
}

const ManualRecoveryScreen: React.FC<ManualRecoveryScreenProps> = ({
  error,
  errorInfo,
  isClearing,
  onReset,
  onClearAndReset,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const bg = isDark ? '#0F0F0F' : '#FFFFFF';
  const surface = isDark ? '#1A1A1A' : '#F5F5F5';
  const textPrimary = isDark ? '#FFFFFF' : '#111111';
  const textSecondary = isDark ? '#A0A0A0' : '#666666';
  const border = isDark ? '#2A2A2A' : '#E5E5E5';

  return (
    <View style={[styles.root, { backgroundColor: bg }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.iconWrap, { backgroundColor: surface, borderColor: border }]}>
          <Text style={styles.iconText}>⚠️</Text>
        </View>

        <Text style={[styles.title, { color: textPrimary }]}>
          Uygulama Başlatılamadı
        </Text>
        <Text style={[styles.body, { color: textSecondary }]}>
          Otomatik kurtarma yeterli olmadı.{'\n'}
          Aşağıdaki seçeneklerden birini deneyin.
        </Text>

        <View style={styles.actions}>
          <TouchableOpacity
            onPress={onReset}
            style={[styles.btnSecondary, { borderColor: border }]}
            activeOpacity={0.7}
            disabled={isClearing}
          >
            <Text style={[styles.btnSecondaryText, { color: textPrimary }]}>
              Tekrar Dene
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onClearAndReset}
            style={[styles.btnPrimary, isClearing && styles.btnDisabled]}
            activeOpacity={0.8}
            disabled={isClearing}
          >
            {isClearing ? (
              <ActivityIndicator color="#000000" size="small" />
            ) : (
              <Text style={styles.btnPrimaryText}>Uygulamayı Sıfırla</Text>
            )}
          </TouchableOpacity>
        </View>

        <Text style={[styles.hint, { color: textSecondary }]}>
          Sıfırlama; oturum ve önbellek verilerini temizler.{'\n'}
          Hesabınız silinmez.
        </Text>

        {__DEV__ && error && (
          <View style={[styles.devBox, { backgroundColor: surface, borderColor: border }]}>
            <Text style={[styles.devTitle, { color: textSecondary }]}>DEV — Hata Detayı</Text>
            <Text style={[styles.devError, { color: '#FF6B6B' }]}>{error.toString()}</Text>
            {errorInfo?.componentStack ? (
              <Text style={[styles.devStack, { color: textSecondary }]}>
                {errorInfo.componentStack.trim()}
              </Text>
            ) : null}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recoveringText: {
    marginTop: 16,
    fontSize: 15,
    fontWeight: '500',
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  iconText: {
    fontSize: 32,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  body: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  actions: {
    width: '100%',
    gap: 12,
    marginBottom: 16,
  },
  btnPrimary: {
    backgroundColor: '#BBFF4E',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  btnPrimaryText: {
    color: '#000000',
    fontSize: 15,
    fontWeight: '600',
  },
  btnSecondary: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  btnSecondaryText: {
    fontSize: 15,
    fontWeight: '500',
  },
  hint: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 4,
    marginBottom: 32,
  },
  devInline: {
    marginTop: 24,
    paddingHorizontal: 24,
    width: '100%',
  },
  devBox: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
  },
  devTitle: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  devError: {
    fontSize: 13,
    fontFamily: 'monospace',
    marginBottom: 8,
  },
  devStack: {
    fontSize: 11,
    fontFamily: 'monospace',
    lineHeight: 16,
  },
});
