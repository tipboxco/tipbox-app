import { ReviewImageCardProps } from '@/src/components/ReviewCard/types';

export const mock_review_card_image: Omit<ReviewImageCardProps, 'onPress'> = {
    title: "Okay Coffee Maker, Nothing Special",
    content: "This filter coffee maker brews decent coffee and is easy to use. However, the brewing time is a bit slow, and the coffee temperature doesn't stay hot for long. The design is...",
    mainImage: require('@/assets/product/product_02.png'),
    productImage: require('@/assets/product/product_02.png'),
    productName: "PHILIPS Coffee Maker XL",
    likes: 110,
    comments: 32,
    shares: 11,
    bookmarks: 32,
    rating: 3,
    usageDuration: "4-7 Days",
    experience: "Could be Better",
    userImage: require('@/assets/avatar/ozan.png'),
    userName: "Teresa Randolph",
    userBadge: "Kitchen Specialist",
    userAction: "Added a new product and experiences to your inventory!"
};
