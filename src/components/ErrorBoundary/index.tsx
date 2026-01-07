import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Text, VStack, Button } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';

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
    // Log error to console (in production, this should go to crash reporting service)
    console.error('[ErrorBoundary] ❌ Error caught by boundary:', error);
    console.error('[ErrorBoundary] Error Info:', errorInfo);
    
    // In production, send to crash reporting service (e.g., Sentry)
    if (!__DEV__) {
      // TODO: Integrate with Sentry or similar service
      // Sentry.captureException(error, { contexts: { react: errorInfo } });
    }

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
 */
interface ErrorFallbackProps {
  error: Error | null;
  onReset: () => void;
}

const ErrorFallback: React.FC<ErrorFallbackProps> = ({ error, onReset }) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  return (
    <Box flex={1} bg={isDark ? '$backgroundDark950' : '$backgroundLight0'} justifyContent="center" alignItems="center" px="$4">
      <VStack space="md" alignItems="center">
        <Text
          color={isDark ? '$textDark50' : '$textLight900'}
          fontSize="$xl"
          fontWeight="$bold"
          textAlign="center"
        >
          Bir Hata Oluştu
        </Text>
        <Text
          color={isDark ? '$textDark400' : '$textLight600'}
          fontSize="$sm"
          textAlign="center"
        >
          Üzgünüz, beklenmeyen bir hata oluştu. Lütfen uygulamayı yeniden başlatmayı deneyin.
        </Text>
        {__DEV__ && error && (
          <Box
            bg={isDark ? '$backgroundDark900' : '$backgroundLight100'}
            p="$4"
            borderRadius="$md"
            maxWidth="100%"
          >
            <Text
              color={isDark ? '$textDark400' : '$textLight600'}
              fontSize="$xs"
              fontFamily="monospace"
            >
              {error.toString()}
            </Text>
          </Box>
        )}
        <Button
          onPress={onReset}
          bg="$primary500"
          borderRadius="$md"
          px="$6"
          py="$3"
        >
          <Text color="$white" fontSize="$sm" fontWeight="$medium">
            Tekrar Dene
          </Text>
        </Button>
      </VStack>
    </Box>
  );
};

