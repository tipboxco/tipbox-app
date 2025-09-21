import React, { useState } from 'react';
import { 
    VStack, 
    HStack, 
    Text, 
    Pressable, 
    Box, 
    Image,
    ScrollView
} from '@gluestack-ui/themed';
import { Feather } from '@expo/vector-icons';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/src/navigation/navigation.types';
import { Header } from '@/src/components/Header';
import { SuggestedUserCard } from '../components/SuggestedUserCard';

type SuggestedUsersScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Mock data for suggested users
const mockSuggestedUsers = [
    {
        id: '1',
        name: 'Micheal Clark',
        title: 'Technology Enthuistant - Hardware Expert - Digital Innovation Specialist',
        avatars: [
            {
                id: '1',
                source: require('@/assets/avatar/ozan.png'),
                alt: 'User 1'
            }
        ]
    },
    {
        id: '2',
        name: 'Micheal Clark',
        title: 'Technology Enthuistant - Hardware Expert - Digital Innovation Specialist',
        avatars: [
            {
                id: '1',
                source: require('@/assets/avatar/ozan.png'),
                alt: 'User 1'
            }
        ]
    },
    {
        id: '3',
        name: 'Micheal Clark',
        title: 'Technology Enthuistant - Hardware Expert - Digital Innovation Specialist',
        avatars: [
            {
                id: '1',
                source: require('@/assets/avatar/ozan.png'),
                alt: 'User 1'
            }
        ]
    },
    {
        id: '4',
        name: 'Micheal Clark',
        title: 'Technology Enthuistant - Hardware Expert - Digital Innovation Specialist',
        avatars: [
            {
                id: '1',
                source: require('@/assets/avatar/ozan.png'),
                alt: 'User 1'
            }
        ]
    },
    {
        id: '5',
        name: 'Micheal Clark',
        title: 'Technology Enthuistant - Hardware Expert - Digital Innovation Specialist',
        avatars: [
            {
                id: '1',
                source: require('@/assets/avatar/ozan.png'),
                alt: 'User 1'
            }
        ]
    },
    {
        id: '6',
        name: 'Micheal Clark',
        title: 'Technology Enthuistant - Hardware Expert - Digital Innovation Specialist',
        avatars: [
            {
                id: '1',
                source: require('@/assets/avatar/ozan.png'),
                alt: 'User 1'
            }
        ]
    },
    {
        id: '7',
        name: 'Micheal Clark',
        title: 'Technology Enthuistant - Hardware Expert - Digital Innovation Specialist',
        avatars: [
            {
                id: '1',
                source: require('@/assets/avatar/ozan.png'),
                alt: 'User 1'
            }
        ]
    },
    {
        id: '8',
        name: 'Micheal Clark',
        title: 'Technology Enthuistant - Hardware Expert - Digital Innovation Specialist',
        avatars: [
            {
                id: '1',
                source: require('@/assets/avatar/ozan.png'),
                alt: 'User 1'
            }
        ]
    },
    {
        id: '9',
        name: 'Micheal Clark',
        title: 'Technology Enthuistant - Hardware Expert - Digital Innovation Specialist',
        avatars: [
            {
                id: '1',
                source: require('@/assets/avatar/ozan.png'),
                alt: 'User 1'
            }
        ]
    },
    {
        id: '10',
        name: 'Micheal Clark',
        title: 'Technology Enthuistant - Hardware Expert - Digital Innovation Specialist',
        avatars: [
            {
                id: '1',
                source: require('@/assets/avatar/ozan.png'),
                alt: 'User 1'
            }
        ]
    },
    {
        id: '11',
        name: 'Micheal Clark',
        title: 'Technology Enthuistant - Hardware Expert - Digital Innovation Specialist',
        avatars: [
            {
                id: '1',
                source: require('@/assets/avatar/ozan.png'),
                alt: 'User 1'
            }
        ]
    },
    {
        id: '12',
        name: 'Micheal Clark',
        title: 'Technology Enthuistant - Hardware Expert - Digital Innovation Specialist',
        avatars: [
            {
                id: '1',
                source: require('@/assets/avatar/ozan.png'),
                alt: 'User 1'
            }
        ]
    },
    {
        id: '13',
        name: 'Micheal Clark',
        title: 'Technology Enthuistant - Hardware Expert - Digital Innovation Specialist',
        avatars: [
            {
                id: '1',
                source: require('@/assets/avatar/ozan.png'),
                alt: 'User 1'
            }
        ]
    },
    {
        id: '14',
        name: 'Micheal Clark',
        title: 'Technology Enthuistant - Hardware Expert - Digital Innovation Specialist',
        avatars: [
            {
                id: '1',
                source: require('@/assets/avatar/ozan.png'),
                alt: 'User 1'
            }
        ]
    },
    {
        id: '15',
        name: 'Micheal Clark',
        title: 'Technology Enthuistant - Hardware Expert - Digital Innovation Specialist',
        avatars: [
            {
                id: '1',
                source: require('@/assets/avatar/ozan.png'),
                alt: 'User 1'
            }
        ]
    },
    {
        id: '16',
        name: 'Micheal Clark',
        title: 'Technology Enthuistant - Hardware Expert - Digital Innovation Specialist',
        avatars: [
            {
                id: '1',
                source: require('@/assets/avatar/ozan.png'),
                alt: 'User 1'
            }
        ]
    }
];

export const SuggestedUsersScreen = () => {
    const { colorMode } = useColorMode();
    const isDark = colorMode === 'dark';
    const navigation = useNavigation<SuggestedUsersScreenNavigationProp>();
    
    const [addedUsers, setAddedUsers] = useState<string[]>([]);

    const handleAddTrust = (userId: string) => {
        console.log('Add trust clicked for user:', userId);
        setAddedUsers(prev => [...prev, userId]);
    };

    return (
        <VStack flex={1} bg={isDark ? '#000' : '#FFFFFF'}>
            {/* Header */}
            <Header
                title="Micheal Clark"
                showBackButton
                onBackPress={() => navigation.goBack()}
            />

            {/* Content */}
            <ScrollView flex={1} keyboardShouldPersistTaps="handled">
                {mockSuggestedUsers.map((user, index) => (
                    <SuggestedUserCard
                        key={user.id}
                        id={user.id}
                        name={user.name}
                        title={user.title}
                        avatars={user.avatars}
                        onAddTrust={handleAddTrust}
                        showBorder={false}
                    />
                ))}
            </ScrollView>
        </VStack>
    );
};

export default SuggestedUsersScreen;
