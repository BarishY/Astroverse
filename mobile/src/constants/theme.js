// src/constants/theme.js
import { Dimensions } from 'react-native';
import colors from './colors'; // Renklerimizi import ediyoruz

const { width, height } = Dimensions.get('window');

const SIZES = {
  // global sizes
  base: 8,
  font: 14,
  radius: 12,
  padding: 24,
  padding2: 36,

  // font sizes
  largeTitle: 50,
  h1: 30,
  h2: 22,
  h3: 20,
  h4: 18,
  body1: 30,
  body2: 20,
  body3: 16,
  body4: 14,
  body5: 12,

  // app dimensions
  width,
  height,
};

const FONTS = {
  largeTitle: { fontFamily: Platform.OS === 'android' ? 'Roboto' : 'System', fontSize: SIZES.largeTitle, lineHeight: 55 },
  h1: { fontFamily: Platform.OS === 'android' ? 'Roboto-Bold' : 'System', fontSize: SIZES.h1, lineHeight: 36, fontWeight: 'bold' },
  h2: { fontFamily: Platform.OS === 'android' ? 'Roboto-Bold' : 'System', fontSize: SIZES.h2, lineHeight: 30, fontWeight: 'bold' },
  h3: { fontFamily: Platform.OS === 'android' ? 'Roboto-Bold' : 'System', fontSize: SIZES.h3, lineHeight: 22, fontWeight: 'bold' },
  h4: { fontFamily: Platform.OS === 'android' ? 'Roboto-Bold' : 'System', fontSize: SIZES.h4, lineHeight: 22, fontWeight: 'bold' },
  body1: { fontFamily: Platform.OS === 'android' ? 'Roboto-Regular' : 'System', fontSize: SIZES.body1, lineHeight: 36 },
  body2: { fontFamily: Platform.OS === 'android' ? 'Roboto-Regular' : 'System', fontSize: SIZES.body2, lineHeight: 30 },
  body3: { fontFamily: Platform.OS === 'android' ? 'Roboto-Regular' : 'System', fontSize: SIZES.body3, lineHeight: 22 },
  body4: { fontFamily: Platform.OS === 'android' ? 'Roboto-Regular' : 'System', fontSize: SIZES.body4, lineHeight: 22 },
  body5: { fontFamily: Platform.OS === 'android' ? 'Roboto-Regular' : 'System', fontSize: SIZES.body5, lineHeight: 22 },
};

const theme = {
  colors, // colors.js'den gelen renkleri buraya dahil ediyoruz
  SIZES,
  FONTS,
  // Diğer tema elemanları buraya eklenebilir
  // Örneğin, gölge stilleri, buton stilleri vb.
  spacing: {
    xs: 4,
    s: 8,
    m: 16,
    l: 24,
    xl: 40,
  },
  radius: {
    s: 4,
    m: 8,
    l: 12,
    xl: 20,
    round: 50,
  },
  // Genel component stilleri için bir başlangıç olabilir
  // button: {
  //   paddingVertical: SIZES.padding / 2,
  //   paddingHorizontal: SIZES.padding,
  //   borderRadius: SIZES.radius,
  //   backgroundColor: colors.primary,
  // },
  // buttonText: {
  //   color: colors.white,
  //   ...FONTS.h4,
  // },
};

export default theme;
