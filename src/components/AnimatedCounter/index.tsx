import React, { useEffect, useRef } from 'react';
import { TextInput, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  withSpring,
  Easing,
  interpolate,
  useAnimatedStyle,
  withSequence,
} from 'react-native-reanimated';

// Create animated TextInput component
Animated.addWhitelistedNativeProps({ text: true });
const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

interface AnimatedCounterProps {
  value: number;
  fontSize?: number;
  fontWeight?: string;
  color?: string;
  darkColor?: string;
  decimalPlaces?: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  ml?: number;
  mr?: number;
  mt?: number;
  mb?: number;
}

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value,
  fontSize = 38,
  fontWeight = 'bold',
  color = '#000000',
  darkColor = '#FFFFFF',
  decimalPlaces = 2,
  duration = 1000,
  prefix = '',
  suffix = '',
  ml = 0,
  mr = 0,
  mt = 0,
  mb = 0,
}) => {
  const animatedValue = useSharedValue(0);
  const scale = useSharedValue(1);
  const prevValueRef = useRef(0);

  useEffect(() => {
    const prevValue = prevValueRef.current;
    
    // Animate the counter value
    animatedValue.value = withTiming(value, {
      duration,
      easing: Easing.out(Easing.exp),
    });

    // Add scale animation when value changes
    if (prevValue !== value && prevValue !== 0) {
      scale.value = withSequence(
        withSpring(1.1, { damping: 10, stiffness: 100 }),
        withSpring(1, { damping: 10, stiffness: 100 })
      );
    }

    prevValueRef.current = value;
  }, [value, animatedValue, duration, scale]);

  const animatedProps = useAnimatedProps(() => {
    const displayValue = animatedValue.value.toFixed(decimalPlaces);
    return {
      text: `${prefix}${displayValue}${suffix}`,
    } as any;
  });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  return (
    <Animated.View style={[animatedStyle, { marginLeft: ml, marginRight: mr, marginTop: mt, marginBottom: mb }]}>
      <AnimatedTextInput
        animatedProps={animatedProps}
        editable={false}
        style={[
          styles.text,
          {
            fontSize,
            fontWeight: fontWeight as any,
            color: color,
          },
        ]}
        defaultValue="0.00"
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  text: {
    textAlign: 'center',
  },
});

