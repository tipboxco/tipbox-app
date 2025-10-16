import { createNativeStackNavigator } from '@react-navigation/native-stack';
import BookMarksScreen from './screens/BookMarksScreen';

export type BookmarksStackParamList = {
  BookMarksScreen: undefined;
};

const Stack = createNativeStackNavigator<BookmarksStackParamList>();

export const BookmarksNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="BookMarksScreen" component={BookMarksScreen} />
    </Stack.Navigator>
  );
};
