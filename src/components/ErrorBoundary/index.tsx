import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useColorScheme } from 'react-native';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Global Error Boundary Component
 * 
 * Catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI instead of crashing.
 * 
 * PERFORMANCE FIX: Prevents app crashes and provides graceful error handling
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console
    console.error('[ErrorBoundary] ❌ Error caught by boundary:', error);
    console.error('[ErrorBoundary] Error Info:', errorInfo);

    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return <ErrorFallback error={this.state.error} onReset={this.handleReset} />;
    }

    return this.props.children;
  }
}

/**
 * Default Error Fallback Component
 * CRITICAL FIX: Uses pure React Native components instead of Gluestack-UI
 * This prevents "StyledProvider not found" errors when ErrorBoundary catches errors
 */
interface ErrorFallbackProps {
  error: Error | null;
  onReset: () => void;
}

const ErrorFallback: React.FC<ErrorFallbackProps> = ({ error, onReset }) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#000000' : '#FFFFFF' }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: isDark ? '#FFFFFF' : '#000000' }]}>
          Bir Hata Oluştu
        </Text>
        <Text style={[styles.message, { color: isDark ? '#A0A0A0' : '#666666' }]}>
          Üzgünüz, beklenmeyen bir hata oluştu. Lütfen uygulamayı yeniden başlatmayı deneyin.
        </Text>
        {__DEV__ && error && (
          <View style={[styles.errorBox, { backgroundColor: isDark ? '#1A1A1A' : '#F5F5F5' }]}>
            <Text style={[styles.errorText, { color: isDark ? '#A0A0A0' : '#666666' }]}>
              {error.toString()}
            </Text>
          </View>
        )}
        <TouchableOpacity
          onPress={onReset}
          style={styles.button}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>
            Tekrar Dene
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  content: {
    alignItems: 'center',
    maxWidth: 400,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  errorBox: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
    maxWidth: '100%',
  },
  errorText: {
    fontSize: 12,
    fontFamily: 'monospace',
  },
  button: {
    backgroundColor: '#E8FF6B',
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  buttonText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '600',
  },
});

