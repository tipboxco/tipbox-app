import React from 'react';
import { FlatList } from 'react-native';
import { Box } from '@gluestack-ui/themed';
import { Badge } from '@/src/mock/profile/badges/types';
import BadgeCard from '../BadgeCard';

interface BridgeBadgesTabProps {
  badges: Badge[];
  onBadgePress?: (badge: Badge) => void;
}

export const BridgeBadgesTab: React.FC<BridgeBadgesTabProps> = ({
  badges,
  onBadgePress,
}) => {
  return (
    <FlatList
      data={badges}
      renderItem={({ item }) => (
        <Box width="50%" p="$2">
          <BadgeCard
            badge={item}
            onPress={() => onBadgePress?.(item)}
          />
        </Box>
      )}
      keyExtractor={(item) => item.id}
      numColumns={2}
      contentContainerStyle={{ padding: 8 }}
      showsVerticalScrollIndicator={false}
      columnWrapperStyle={{ justifyContent: 'space-between' }}
    />
  );
};

export default BridgeBadgesTab;

