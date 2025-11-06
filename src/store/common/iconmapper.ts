import * as Icons from '@ant-design/icons';
import { ReactNode, ComponentType, createElement } from 'react';
 
export const getAntdIcon = (name: string): ReactNode => {
  const iconMap = Icons as unknown as Record<string, ComponentType>;
  const Icon = iconMap[name];
  return Icon ? createElement(Icon) : null;
};