import React from 'react';
import { View, ViewProps, ScrollView, ScrollViewProps } from 'react-native';
import { colors, space } from '../theme';

// Container Component
interface ContainerProps extends ViewProps {
  bg?: string;
  p?: keyof typeof space;
  px?: keyof typeof space;
  py?: keyof typeof space;
  pt?: keyof typeof space;
  pb?: keyof typeof space;
  pl?: keyof typeof space;
  pr?: keyof typeof space;
}

export const Container: React.FC<ContainerProps> = ({ 
  children, 
  bg = colors.background,
  p,
  px,
  py,
  pt,
  pb,
  pl,
  pr,
  style,
  ...props 
}) => {
  const getContainerStyles = () => {
    return {
      flex: 1,
      backgroundColor: bg,
      ...(p && { padding: space[p] }),
      ...(px && { paddingHorizontal: space[px] }),
      ...(py && { paddingVertical: space[py] }),
      ...(pt && { paddingTop: space[pt] }),
      ...(pb && { paddingBottom: space[pb] }),
      ...(pl && { paddingLeft: space[pl] }),
      ...(pr && { paddingRight: space[pr] }),
    };
  };

  return (
    <View style={[getContainerStyles(), style]} {...props}>
      {children}
    </View>
  );
};

// Box Component
interface BoxProps extends ViewProps {
  bg?: string;
  p?: keyof typeof space;
  px?: keyof typeof space;
  py?: keyof typeof space;
  pt?: keyof typeof space;
  pb?: keyof typeof space;
  pl?: keyof typeof space;
  pr?: keyof typeof space;
  m?: keyof typeof space;
  mx?: keyof typeof space;
  my?: keyof typeof space;
  mt?: keyof typeof space;
  mb?: keyof typeof space;
  ml?: keyof typeof space;
  mr?: keyof typeof space;
}

export const Box: React.FC<BoxProps> = ({ 
  children,
  bg,
  p, px, py, pt, pb, pl, pr,
  m, mx, my, mt, mb, ml, mr,
  style,
  ...props 
}) => {
  const getBoxStyles = () => {
    return {
      ...(bg && { backgroundColor: bg }),
      ...(p && { padding: space[p] }),
      ...(px && { paddingHorizontal: space[px] }),
      ...(py && { paddingVertical: space[py] }),
      ...(pt && { paddingTop: space[pt] }),
      ...(pb && { paddingBottom: space[pb] }),
      ...(pl && { paddingLeft: space[pl] }),
      ...(pr && { paddingRight: space[pr] }),
      ...(m && { margin: space[m] }),
      ...(mx && { marginHorizontal: space[mx] }),
      ...(my && { marginVertical: space[my] }),
      ...(mt && { marginTop: space[mt] }),
      ...(mb && { marginBottom: space[mb] }),
      ...(ml && { marginLeft: space[ml] }),
      ...(mr && { marginRight: space[mr] }),
    };
  };

  return (
    <View style={[getBoxStyles(), style]} {...props}>
      {children}
    </View>
  );
};

// SafeArea Component
interface SafeAreaProps extends ContainerProps {
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
}

export const SafeArea: React.FC<SafeAreaProps> = ({ 
  children,
  edges = ['top'],
  pt = edges.includes('top') ? 12 : undefined,
  pb = edges.includes('bottom') ? 8 : undefined,
  ...props 
}) => {
  return (
    <Container pt={pt} pb={pb} {...props}>
      {children}
    </Container>
  );
};

// Center Component
export const Center: React.FC<BoxProps> = ({ children, ...props }) => {
  return (
    <Box 
      style={{ 
        justifyContent: 'center', 
        alignItems: 'center' 
      }} 
      {...props}
    >
      {children}
    </Box>
  );
};

// HStack (Horizontal Stack)
interface StackProps extends BoxProps {
  spacing?: keyof typeof space;
}

export const HStack: React.FC<StackProps> = ({ 
  children, 
  spacing = 2,
  ...props 
}) => {
  const childrenWithSpacing = React.Children.map(children, (child, index) => {
    if (index === 0) return child;
    return (
      <View style={{ marginLeft: space[spacing] }}>
        {child}
      </View>
    );
  });

  return (
    <Box style={{ flexDirection: 'row', alignItems: 'center' }} {...props}>
      {childrenWithSpacing}
    </Box>
  );
};

// VStack (Vertical Stack)
export const VStack: React.FC<StackProps> = ({ 
  children, 
  spacing = 2,
  ...props 
}) => {
  const childrenWithSpacing = React.Children.map(children, (child, index) => {
    if (index === 0) return child;
    return (
      <View style={{ marginTop: space[spacing] }}>
        {child}
      </View>
    );
  });

  return (
    <Box style={{ flexDirection: 'column' }} {...props}>
      {childrenWithSpacing}
    </Box>
  );
};

// ScrollContainer
interface ScrollContainerProps extends ScrollViewProps {
  bg?: string;
  p?: keyof typeof space;
}

export const ScrollContainer: React.FC<ScrollContainerProps> = ({ 
  children,
  bg = colors.background,
  p = 5,
  contentContainerStyle,
  ...props 
}) => {
  return (
    <ScrollView 
      style={{ flex: 1, backgroundColor: bg }}
      contentContainerStyle={[
        { padding: space[p] },
        contentContainerStyle
      ]}
      showsVerticalScrollIndicator={false}
      {...props}
    >
      {children}
    </ScrollView>
  );
}; 