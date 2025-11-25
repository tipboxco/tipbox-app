import React from 'react';
import { FlatList } from 'react-native';
import { Box } from '@gluestack-ui/themed';
import { Badge } from '@/src/mock/profile/badges/types';
import BadgeCard from '../BadgeCard';
import { useSafeAreaValues } from '@/src/utils';

interface BridgeBadgesTabProps {
  badges: Badge[];
  onBadgePress?: (badge: Badge) => void;
}

export const BridgeBadgesTab: React.FC<BridgeBadgesTabProps> = ({
  badges,
  onBadgePress,
}) => {
  const bottomInset = useSafeAreaValues('bottom');

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
      contentContainerStyle={{
        paddingHorizontal: 8,
        paddingTop: 8,
        paddingBottom: bottomInset,
      }}
      showsVerticalScrollIndicator={false}
      columnWrapperStyle={{ justifyContent: 'space-between' }}
    />
  );
};

export default BridgeBadgesTab;

