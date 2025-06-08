import React from 'react';

// Service worker registration and management utilities

interface ServiceWorkerMessage {
  type: string;
  data?: unknown;
}

interface ServiceWorkerRegistrationState {
  registration: ServiceWorkerRegistration | null;
  isSupported: boolean;
  isRegistered: boolean;
  updateAvailable: boolean;
  isOnline: boolean;
}

class ServiceWorkerManager {
  private static instance: ServiceWorkerManager;
  private registration: ServiceWorkerRegistration | null = null;
  private listeners: Map<string, Set<(data: unknown) => void>> = new Map();
  private state: ServiceWorkerRegistrationState = {
    registration: null,
    isSupported: false,
    isRegistered: false,
    updateAvailable: false,
    isOnline: typeof window !== 'undefined' ? navigator.onLine : true,
  };

  constructor() {
    if (typeof window !== 'undefined') {
      this.setupNetworkListeners();
    }
  }

  static getInstance(): ServiceWorkerManager {
    if (!ServiceWorkerManager.instance) {
      ServiceWorkerManager.instance = new ServiceWorkerManager();
    }
    return ServiceWorkerManager.instance;
  }

  // Register service worker
  async register(): Promise<ServiceWorkerRegistration | null> {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      console.warn('Service workers not supported');
      this.state.isSupported = false;
      return null;
    }

    this.state.isSupported = true;

    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none'
      });

      this.registration = registration;
      this.state.registration = registration;
      this.state.isRegistered = true;

      console.log('✅ Service worker registered successfully');

      // Set up event listeners
      this.setupServiceWorkerListeners(registration);

      // Check for updates
      this.checkForUpdates();

      return registration;
    } catch {
      console.error('❌ Service worker registration failed:', error);
      return null;
    }
  }

  // Unregister service worker
  async unregister(): Promise<boolean> {
    if (!this.registration) {
      return false;
    }

    try {
      const success = await this.registration.unregister();
      if (success) {
        this.registration = null;
        this.state.registration = null;
        this.state.isRegistered = false;
        console.log('✅ Service worker unregistered');
      }
      return success;
    } catch {
      console.error('❌ Service worker unregistration failed:', error);
      return false;
    }
  }

  // Update service worker
  async update(): Promise<void> {
    if (!this.registration) {
      return;
    }

    try {
      await this.registration.update();
      console.log('🔄 Service worker update check initiated');
    } catch {
      console.error('❌ Service worker update failed:', error);
    }
  }

  // Skip waiting and activate new service worker
  skipWaiting(): void {
    if (this.registration?.waiting) {
      this.postMessage({ type: 'SKIP_WAITING' });
    }
  }

  // Post message to service worker
  postMessage(message: ServiceWorkerMessage): void {
    if (typeof window !== 'undefined' && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage(message);
    }
  }

  // Setup service worker event listeners
  private setupServiceWorkerListeners(registration: ServiceWorkerRegistration): void {
    // Listen for service worker state changes
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (newWorker) {
        console.log('🔄 Service worker update found');
        this.state.updateAvailable = true;
        this.emit('updatefound', { registration, newWorker });

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              // New worker is available
              console.log('✨ New service worker available');
              this.emit('updateready', { registration, newWorker });
            } else {
              // First install
              console.log('✅ Service worker installed for the first time');
              this.emit('firstinstall', { registration, newWorker });
            }
          }
        });
      }
    });

    // Listen for messages from service worker
    navigator.serviceWorker.addEventListener('message', (event) => {
      const { type, data } = event.data;
      console.log('📨 Message from service worker:', type, data);
      
      this.emit('message', { type, data });
      
      if (type) {
        this.emit(type, data);
      }
    });

    // Listen for controller changes
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('🔄 Service worker controller changed');
      this.emit('controllerchange', { registration });
      
      // Reload page to ensure fresh content
      if (this.state.updateAvailable) {
        window.location.reload();
      }
    });
  }

  // Setup network status listeners
  private setupNetworkListeners(): void {
    window.addEventListener('online', () => {
      this.state.isOnline = true;
      console.log('🌐 Network: Online');
      this.emit('online', { isOnline: true });
    });

    window.addEventListener('offline', () => {
      this.state.isOnline = false;
      console.log('📱 Network: Offline');
      this.emit('offline', { isOnline: false });
    });
  }

  // Check for service worker updates
  private checkForUpdates(): void {
    // Check for updates immediately
    this.update();

    // Check for updates periodically
    setInterval(() => {
      this.update();
    }, 60000); // Every minute

    // Check for updates when page gains focus
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        this.update();
      }
    });
  }

  // Event listener management
  on(event: string, callback: (data: unknown) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  off(event: string, callback: (data: unknown) => void): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(callback);
    }
  }

  private emit(event: string, data: unknown): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => callback(data));
    }
  }

  // Get current state
  getState(): ServiceWorkerRegistrationState {
    return { ...this.state };
  }

  // Cache management
  async getCacheSize(): Promise<number> {
    if (typeof window === 'undefined') return 0;
    
    return new Promise((resolve) => {
      const messageChannel = new MessageChannel();
      messageChannel.port1.onmessage = (event) => {
        resolve(event.data.cacheSize || 0);
      };

      this.postMessage({ type: 'GET_CACHE_SIZE' });
      
      // Fallback timeout
      setTimeout(() => resolve(0), 5000);
    });
  }

  async clearCaches(): Promise<void> {
    if (typeof window === 'undefined') return;
    
    try {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
      console.log('🗑️ All caches cleared');
    } catch {
      console.error('❌ Failed to clear caches:', error);
    }
  }

  // Push notification management
  async requestNotificationPermission(): Promise<NotificationPermission> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      console.warn('Notifications not supported');
      return 'denied';
    }

    let permission = Notification.permission;

    if (permission === 'default') {
      permission = await Notification.requestPermission();
    }

    console.log('🔔 Notification permission:', permission);
    return permission;
  }

  async subscribeToPushNotifications(): Promise<PushSubscription | null> {
    if (!this.registration) {
      console.warn('Service worker not registered');
      return null;
    }

    try {
      const subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
        ),
      });

      console.log('🔔 Push subscription created');
      return subscription;
    } catch {
      console.error('❌ Push subscription failed:', error);
      return null;
    }
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }
}

// Export singleton instance
export const serviceWorkerManager = ServiceWorkerManager.getInstance();

// React hooks for service worker integration
export function useServiceWorker() {
  const [state, setState] = React.useState(serviceWorkerManager.getState());
  const [cacheSize, setCacheSize] = React.useState<number>(0);

  React.useEffect(() => {
    // Register service worker
    serviceWorkerManager.register();

    // Setup event listeners
    const handleUpdate = () => setState(serviceWorkerManager.getState());

    serviceWorkerManager.on('updatefound', handleUpdate);
    serviceWorkerManager.on('updateready', handleUpdate);
    serviceWorkerManager.on('firstinstall', handleUpdate);
    serviceWorkerManager.on('controllerchange', handleUpdate);
    serviceWorkerManager.on('online', handleUpdate);
    serviceWorkerManager.on('offline', handleUpdate);

    // Get initial cache size
    serviceWorkerManager.getCacheSize().then(setCacheSize);

    return () => {
      serviceWorkerManager.off('updatefound', handleUpdate);
      serviceWorkerManager.off('updateready', handleUpdate);
      serviceWorkerManager.off('firstinstall', handleUpdate);
      serviceWorkerManager.off('controllerchange', handleUpdate);
      serviceWorkerManager.off('online', handleUpdate);
      serviceWorkerManager.off('offline', handleUpdate);
    };
  }, []);

  const updateServiceWorker = React.useCallback(() => {
    serviceWorkerManager.skipWaiting();
  }, []);

  const clearCaches = React.useCallback(async () => {
    await serviceWorkerManager.clearCaches();
    const newSize = await serviceWorkerManager.getCacheSize();
    setCacheSize(newSize);
  }, []);

  const requestNotifications = React.useCallback(async () => {
    const permission = await serviceWorkerManager.requestNotificationPermission();
    if (permission === 'granted') {
      await serviceWorkerManager.subscribeToPushNotifications();
    }
    return permission;
  }, []);

  return {
    ...state,
    cacheSize,
    updateServiceWorker,
    clearCaches,
    requestNotifications,
  };
}

// Hook for background sync status
export function useBackgroundSync() {
  const [syncStatus, setSyncStatus] = React.useState<{
    hasPendingSync: boolean;
    lastSyncTime: Date | null;
  }>({
    hasPendingSync: false,
    lastSyncTime: null,
  });

  React.useEffect(() => {
    const handleSyncSuccess = (data: unknown) => {
      setSyncStatus(prev => ({
        ...prev,
        lastSyncTime: new Date(),
        hasPendingSync: false,
      }));
    };

    serviceWorkerManager.on('SYNC_SUCCESS', handleSyncSuccess);

    return () => {
      serviceWorkerManager.off('SYNC_SUCCESS', handleSyncSuccess);
    };
  }, []);

  const triggerSync = React.useCallback(() => {
    // This would typically be triggered by a failed network request
    setSyncStatus(prev => ({
      ...prev,
      hasPendingSync: true,
    }));
  }, []);

  return {
    ...syncStatus,
    triggerSync,
  };
} 