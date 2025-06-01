// src/components/general/Button.js
import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../constants/colors'; // Renklerimiz

const Button = ({
  title,
  onPress,
  style, // Dışarıdan verilecek ek container stilleri
  textStyle, // Dışarıdan verilecek ek metin stilleri
  iconName, // Butonun solunda gösterilecek ikon adı (Ionicons)
  iconColor = colors.white,
  iconSize = 20,
  disabled = false,
  loading = false,
  variant = 'primary', // 'primary', 'secondary', 'outline', 'ghost'
  size = 'medium', // 'small', 'medium', 'large'
  ...props // TouchableOpacity'nin diğer propları
}) => {
  const getButtonStyles = () => {
    let baseStyle = [styles.buttonBase];
    let baseTextStyle = [styles.textBase];

    // Variant styles
    switch (variant) {
      case 'secondary':
        baseStyle.push(styles.buttonSecondary);
        baseTextStyle.push(styles.textSecondary);
        break;
      case 'outline':
        baseStyle.push(styles.buttonOutline);
        baseTextStyle.push(styles.textOutline);
        break;
      case 'ghost':
        baseStyle.push(styles.buttonGhost);
        baseTextStyle.push(styles.textGhost);
        break;
      case 'primary':
      default:
        baseStyle.push(styles.buttonPrimary);
        baseTextStyle.push(styles.textPrimary);
        break;
    }

    // Size styles
    switch (size) {
      case 'small':
        baseStyle.push(styles.buttonSmall);
        baseTextStyle.push(styles.textSmall);
        break;
      case 'large':
        baseStyle.push(styles.buttonLarge);
        baseTextStyle.push(styles.textLarge);
        break;
      case 'medium':
      default:
        baseStyle.push(styles.buttonMedium);
        baseTextStyle.push(styles.textMedium);
        break;
    }

    if (disabled || loading) {
      baseStyle.push(styles.buttonDisabled);
    }

    return {
      button: [baseStyle, style],
      text: [baseTextStyle, textStyle],
    };
  };

  const { button, text } = getButtonStyles();

  return (
    <TouchableOpacity
      style={button}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' || variant === 'secondary' ? colors.white : colors.primary} size="small" />
      ) : (
        <View style={styles.contentContainer}>
          {iconName && (
            <Ionicons name={iconName} size={iconSize} color={text[1]?.color || iconColor} style={styles.icon} />
          )}
          <Text style={text}>{title}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  buttonBase: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  textBase: {
    fontWeight: '600',
    textAlign: 'center',
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginRight: 8,
  },
  // Variants
  buttonPrimary: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  textPrimary: {
    color: colors.white,
  },
  buttonSecondary: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
  },
  textSecondary: {
    color: colors.white,
  },
  buttonOutline: {
    backgroundColor: 'transparent',
    borderColor: colors.primary,
  },
  textOutline: {
    color: colors.primary,
  },
  buttonGhost: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
  textGhost: {
    color: colors.primary,
  },
  // Sizes
  buttonSmall: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  textSmall: {
    fontSize: 13,
  },
  buttonMedium: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  textMedium: {
    fontSize: 15,
  },
  buttonLarge: {
    paddingVertical: 15,
    paddingHorizontal: 24,
  },
  textLarge: {
    fontSize: 17,
  },
  // Disabled state
  buttonDisabled: {
    opacity: 0.6,
  },
});

export default Button;
