// Basic types that can be extended as needed
export interface BaseItem {
  id: string | number;
  title: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface User {
  id: string | number;
  name: string;
  email: string;
  avatar?: string;
}

export interface SettingsItem {
  id: string;
  title: string;
  description?: string;
  icon: string;
  action?: () => void;
}

// Add more types as your app grows
