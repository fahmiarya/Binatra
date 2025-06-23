// composables/useSocket.js
import { ref, onUnmounted } from 'vue';
import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.connected = ref(false);
    this.reconnecting = ref(false);
    this.lastUpdateTime = ref('');
    this.eventListeners = new Map();
  }

  // Initialize socket connection
  connect(url = null) {
    if (this.socket?.connected) {
      console.log('🔄 Socket already connected');
      return;
    }

    const socketUrl = url || import.meta.env.VITE_API_URL;


    this.socket = io(socketUrl, {
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      timeout: 20000,
      forceNew: false,
    });

    this.setupEventListeners();
  }

  // Setup default event listeners
  setupEventListeners() {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('✅ Socket.IO connected:', this.socket.id);
      this.connected.value = true;
      this.reconnecting.value = false;
      this.lastUpdateTime.value = new Date().toLocaleTimeString();
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Socket.IO disconnected:', reason);
      this.connected.value = false;
    });

    this.socket.on('reconnect_attempt', (attemptNumber) => {
      console.log('🔄 Socket.IO reconnect attempt:', attemptNumber);
      this.reconnecting.value = true;
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('✅ Socket.IO reconnected after', attemptNumber, 'attempts');
      this.connected.value = true;
      this.reconnecting.value = false;
      this.lastUpdateTime.value = new Date().toLocaleTimeString();
    });

    this.socket.on('reconnect_failed', () => {
      console.error('❌ Socket.IO reconnection failed');
      this.reconnecting.value = false;
    });

    // Generic error handler
    this.socket.on('error', (error) => {
      console.error('❌ Socket.IO error:', error);
    });
  }

  // Add event listener with automatic cleanup
  on(event, callback) {
    if (!this.socket) {
      console.warn('⚠️ Socket not initialized. Call connect() first.');
      return;
    }

    this.socket.on(event, callback);

    // Store for cleanup
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(callback);

    // Return cleanup function
    return () => this.off(event, callback);
  }

  // Remove event listener
  off(event, callback = null) {
    if (!this.socket) return;

    if (callback) {
      this.socket.off(event, callback);

      // Remove from stored listeners
      const listeners = this.eventListeners.get(event);
      if (listeners) {
        const index = listeners.indexOf(callback);
        if (index > -1) {
          listeners.splice(index, 1);
        }
      }
    } else {
      this.socket.off(event);
      this.eventListeners.delete(event);
    }
  }

  // Emit event to server
  emit(event, data = null) {
    if (!this.socket?.connected) {
      console.warn('⚠️ Socket not connected. Cannot emit:', event);
      return false;
    }

    this.socket.emit(event, data);
    return true;
  }

  // Subscribe to device updates
  subscribeToDevice(deviceId) {
    return this.emit('subscribe-device', deviceId);
  }

  // Unsubscribe from device updates
  unsubscribeFromDevice(deviceId) {
    return this.emit('unsubscribe-device', deviceId);
  }

  // Subscribe to device status
  subscribeToDeviceStatus(deviceCode) {
    return this.emit('subscribe-device-status', deviceCode);
  }

  // Unsubscribe from device status
  unsubscribeFromDeviceStatus(deviceCode) {
    return this.emit('unsubscribe-device-status', deviceCode);
  }

  // Subscribe to location updates
  subscribeToLocation(locationId) {
    return this.emit('subscribe-location', locationId);
  }

  // Unsubscribe from location updates
  unsubscribeFromLocation(locationId) {
    return this.emit('unsubscribe-location', locationId);
  }

  // Request current flood status
  requestFloodStatus() {
    return this.emit('get-flood-status');
  }

  // Request location details
  requestLocationDetails(locationId) {
    return this.emit('get-location-details', locationId);
  }

  // Disconnect socket
  disconnect() {
    if (this.socket) {
      console.log('🔌 Disconnecting socket...');

      // Remove all listeners
      this.eventListeners.forEach((callbacks, event) => {
        this.socket.off(event);
      });
      this.eventListeners.clear();

      this.socket.disconnect();
      this.socket = null;
      this.connected.value = false;
      this.reconnecting.value = false;
    }
  }

  // Get connection status
  isConnected() {
    return this.socket?.connected || false;
  }

  // Get socket ID
  getSocketId() {
    return this.socket?.id || null;
  }
}

// Create singleton instance
const socketService = new SocketService();

// Vue composable
export function useSocket() {
  const connected = socketService.connected;
  const reconnecting = socketService.reconnecting;
  const lastUpdateTime = socketService.lastUpdateTime;

  // Auto cleanup on component unmount
  onUnmounted(() => {
    // Note: We don't disconnect here since socket might be used by other components
    // Only disconnect when the app is closed or explicitly called
  });

  return {
    // State
    connected,
    reconnecting,
    lastUpdateTime,

    // Methods
    connect: (url) => socketService.connect(url),
    disconnect: () => socketService.disconnect(),
    on: (event, callback) => socketService.on(event, callback),
    off: (event, callback) => socketService.off(event, callback),
    emit: (event, data) => socketService.emit(event, data),

    // Device subscriptions
    subscribeToDevice: (deviceId) => socketService.subscribeToDevice(deviceId),
    unsubscribeFromDevice: (deviceId) => socketService.unsubscribeFromDevice(deviceId),
    subscribeToDeviceStatus: (deviceCode) => socketService.subscribeToDeviceStatus(deviceCode),
    unsubscribeFromDeviceStatus: (deviceCode) => socketService.unsubscribeFromDeviceStatus(deviceCode),

    // Location subscriptions
    subscribeToLocation: (locationId) => socketService.subscribeToLocation(locationId),
    unsubscribeFromLocation: (locationId) => socketService.unsubscribeFromLocation(locationId),

    // Data requests
    requestFloodStatus: () => socketService.requestFloodStatus(),
    requestLocationDetails: (locationId) => socketService.requestLocationDetails(locationId),

    // Utilities
    isConnected: () => socketService.isConnected(),
    getSocketId: () => socketService.getSocketId(),
  };
}

// Export singleton for direct usage
export default socketService;
