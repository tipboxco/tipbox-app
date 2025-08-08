import React from 'react';
import { Box, ScrollView } from '@gluestack-ui/themed';
import { ReviewCard } from '@/src/components/ReviewCard/ReviewCard';

export const PostsTab = () => {
  const samplePost = {
    title: "Decent but Could Be Better",
    content: "The PHILIPS Azur DST8050/20 steam iron offers decent steam power and is practical for ironing various fabrics. However, its weight and somewhat long heating time were drawbacks for me. I didn't get the best experience...",
    productImage: require('@/assets/product/product_01.png'),
    productName: "PHILIPS Azur DST8050/20 Steam Iron",
    likes: "110",
    comments: "32",
    shares: "11",
    bookmarks: "32",
    rating: 3,
    usageDuration: "4-7 Days",
    experience: "It Could be Better",
    useCase: "Daily Use",
    userImage: require('@/assets/avatar/ozan.png'),
    userName: "Adan Galloway",
    userBadge: "Technology Expert",
    userAction: "Added a new product and experiences to your inventory!"
  };

  return (
    <ScrollView flex={1} px="$4">
      <ReviewCard {...samplePost} />
    </ScrollView>
  );
};
