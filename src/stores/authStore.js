import { create } from 'zustand';

// Mock users for demo
const mockUsers = [
  {
    id: '1',
    email: 'admin@restaurant.com',
    name: 'Admin User',
    role: 'admin',
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    email: 'manager@restaurant.com',
    name: 'Restaurant Manager',
    role: 'manager',
    createdAt: new Date().toISOString(),
  },
  {
    id: '3',
    email: 'cashier@restaurant.com',
    name: 'Cashier Staff',
    role: 'cashier',
    createdAt: new Date().toISOString(),
  },
  {
    id: '4',
    email: 'kitchen@restaurant.com',
    name: 'Kitchen Staff',
    role: 'kitchen',
    createdAt: new Date().toISOString(),
  },
];

export const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  login: async (email, password) => {
    // Mock authentication
    const user = mockUsers.find(u => u.email === email);
    if (user) {
      set({ user, isAuthenticated: true });
      return true;
    }
    return false;
  },
  logout: () => {
    set({ user: null, isAuthenticated: false });
  },
  register: async (userData) => {
    // Mock registration
    const newUser = {
      ...userData,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
    };
    mockUsers.push(newUser);
    set({ user: newUser, isAuthenticated: true });
    return true;
  },
}));