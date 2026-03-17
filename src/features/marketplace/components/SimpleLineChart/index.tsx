import React from 'react';
import { View } from 'react-native';
import { Box, Text, VStack, HStack } from '@gluestack-ui/themed';
import Svg, { Path, Circle, Line, Text as SvgText } from 'react-native-svg';

interface DataPoint {
  date: string;
  price: number;
}

interface SimpleLineChartProps {
  data: DataPoint[];
  width: number;
  height: number;
  isDark: boolean;
}

export const SimpleLineChart: React.FC<SimpleLineChartProps> = ({ 
  data, 
  width, 
  height,
  isDark 
}) => {
  if (!data || data.length === 0) return null;

  // Chart dimensions
  const padding = 40;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  // Find min and max values
  const prices = data.map(d => d.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceRange = maxPrice - minPrice || 1;

  // Create scale functions
  const xScale = (index: number) => {
    return padding + (chartWidth / (data.length - 1 || 1)) * index;
  };

  const yScale = (price: number) => {
    return height - padding - ((price - minPrice) / priceRange) * chartHeight;
  };

  // Generate path string for the line
  const generatePath = () => {
    let path = '';
    data.forEach((point, index) => {
      const x = xScale(index);
      const y = yScale(point.price);
      
      if (index === 0) {
        path += `M ${x} ${y}`;
      } else {
        // Bezier curve for smooth line
        const prevX = xScale(index - 1);
        const prevY = yScale(data[index - 1].price);
        const cpX = (prevX + x) / 2;
        
        path += ` Q ${cpX} ${prevY}, ${x} ${y}`;
      }
    });
    return path;
  };

  // Generate horizontal grid lines
  const gridLines = [0, 0.25, 0.5, 0.75, 1].map((fraction) => {
    const y = height - padding - chartHeight * fraction;
    const value = Math.round(minPrice + priceRange * fraction);
    return { y, value };
  });

  return (
    <Box>
      <Svg width={width} height={height}>
        {/* Horizontal grid lines */}
        {gridLines.map((line, index) => (
          <React.Fragment key={`grid-${index}`}>
            <Line
              x1={padding}
              y1={line.y}
              x2={width - padding}
              y2={line.y}
              stroke={isDark ? '#333333' : '#E5E5E5'}
              strokeWidth="1"
              strokeDasharray="5,5"
            />
            <SvgText
              x={padding - 10}
              y={line.y + 5}
              fill={isDark ? '#999999' : '#666666'}
              fontSize="10"
              textAnchor="end"
            >
              {line.value}
            </SvgText>
          </React.Fragment>
        ))}

        {/* Line path */}
        <Path
          d={generatePath()}
          stroke="#E2E81F"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points */}
        {data.map((point, index) => {
          const x = xScale(index);
          const y = yScale(point.price);
          
          return (
            <React.Fragment key={`point-${index}`}>
              <Circle
                cx={x}
                cy={y}
                r="6"
                fill="#E2E81F"
                stroke={isDark ? '#1A1A1A' : '#FFFFFF'}
                strokeWidth="2"
              />
              {/* X-axis labels */}
              <SvgText
                x={x}
                y={height - padding + 20}
                fill={isDark ? '#999999' : '#666666'}
                fontSize="10"
                textAnchor="middle"
              >
                {new Date(point.date).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </SvgText>
            </React.Fragment>
          );
        })}

        {/* Y-axis label */}
        <SvgText
          x={padding - 10}
          y={padding - 10}
          fill={isDark ? '#999999' : '#666666'}
          fontSize="10"
          textAnchor="end"
        >
          TIPS
        </SvgText>
      </Svg>

      {/* Legend - Price history */}
      <VStack space="xs" mt="$3">
        {data.map((sale, index) => (
          <HStack key={index} justifyContent="space-between" alignItems="center">
            <Text
              fontSize="$xs"
              color={isDark ? '$textDark400' : '$textLight600'}
            >
              {new Date(sale.date).toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric',
                year: 'numeric'
              })}
            </Text>
            <Text
              fontSize="$xs"
              fontWeight="$semibold"
              color={isDark ? '$textDark200' : '$textLight700'}
            >
              {Number(sale.price).toFixed(2)} TIPS
            </Text>
          </HStack>
        ))}
      </VStack>
    </Box>
  );
};
