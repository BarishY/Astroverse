declare module 'react' {
  import * as React from 'react';
  export = React;
  export as namespace React;
}

declare module 'react-native' {
  import * as ReactNative from 'react-native';
  export = ReactNative;
  export as namespace ReactNative;
}

declare module 'expo-router' {
  import { ComponentType } from 'react';
  import { ViewStyle, TextStyle } from 'react-native';

  export interface LinkProps {
    href: string;
    style?: ViewStyle | TextStyle;
    children?: React.ReactNode;
  }

  export const Link: React.FC<LinkProps>;

  export interface StackProps {
    children?: React.ReactNode;
  }

  export const Stack: React.FC<StackProps> & {
    Screen: React.FC<{
      options?: {
        title?: string;
      };
    }>;
  };
} 