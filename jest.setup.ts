import '@testing-library/react-native/matchers';

jest.mock('@expo/vector-icons', () => ({
  Ionicons: () => null,
}));
