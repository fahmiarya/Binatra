// composables/useDeviceSocket.js
import { ref, onMounted, onUnmounted } from 'vue';
import { useSocket } from './useSocket.js';

export function useDeviceSocket() {
  const socket = useSocket();

  // Reactive state
  const sensorData = ref({});
  const deviceStatuses = ref(new Map());
  const connectedDevices = ref(null);
  const recentSensorUpdates = ref([]);
  const deviceNotifications = ref([]);
  const deviceNotificationData = ref(null)

  // Event handlers cleanup functions
  const cleanupFunctions = [];

  // Initialize device-specific socket listeners
  const initializeDeviceListeners = () => {
    // General sensor data handler
    const sensorDataCleanup = socket.on('sensor-data', (data) => {
      console.log('📊 Sensor data received:', data);

      sensorData.value = data;

      // Add to recent updates
      addToRecentUpdates(data);

      // Update device status
      if (data.deviceCode) {
        updateDeviceStatus(data.deviceCode, {
          lastSeen: new Date(),
          status: 'online',
          lastData: data
        });
      }
    });

    // Device-specific sensor data handler
    const deviceSensorCleanup = socket.on('sensor-data-*', (data) => {
      console.log(`📊 Device-specific sensor data:`, data);
      // Handle device-specific data if needed
    });

    // Sensor data saved confirmation
    const sensorSavedCleanup = socket.on('sensor-data-saved', (data) => {
      console.log('💾 Sensor data saved to database:', data);
    });

    // Sensor data error handler
    const sensorErrorCleanup = socket.on('sensor-data-error', (data) => {
      console.error('❌ Sensor data error:', data);
    });

    // Device heartbeat handler
    const heartbeatCleanup = socket.on('device_heartbeat', (data) => {

      if (data.deviceCode) {
        updateDeviceStatus(data.deviceCode, {
          lastSeen: new Date(),
          status: 'online',
          heartbeat: data
        });
      }
    });

    // Device heartbeat error handler
    const heartbeatErrorCleanup = socket.on('device_heartbeat_error', (data) => {
      console.error('❌ Device heartbeat error:', data);
    });

    // Device status summary handler
    const statusSummaryCleanup = socket.on('device_status_summary', (data) => {
      console.log('📈 Device status summary:', data);

      connectedDevices.value = data.connected;
    });

    // Device check result handler
    const deviceCheckCleanup = socket.on('device-check-result', (data) => {
      console.log('✅ Device check result:', data);
    });

    // Device check error handler
    const deviceCheckErrorCleanup = socket.on('device-check-error', (data) => {
      console.error('❌ Device check error:', data);
    });

    // NEW: Device notification handlers
    const deviceNotificationCleanup = socket.on('new-notification', (notification) => {
      // Filter device-related notifications
      if (['device_status_change', 'new_device'].includes(notification.type)) {
        console.log('📱 Device notification received:', notification.data);
        deviceNotificationData.value = notification.data;
        addDeviceNotification(notification);

        // Show browser notification for device status changes
        showDeviceBrowserNotification(notification);
      }
    });

    // NEW: Device-specific notification handler
    const specificDeviceNotificationCleanup = socket.on('notification-device-*', (notification) => {
      console.log('📱 Device-specific notification:', notification);
      addDeviceNotification(notification);
    });

    // Store cleanup functions
    cleanupFunctions.push(
      sensorDataCleanup,
      deviceSensorCleanup,
      sensorSavedCleanup,
      sensorErrorCleanup,
      heartbeatCleanup,
      heartbeatErrorCleanup,
      statusSummaryCleanup,
      deviceCheckCleanup,
      deviceCheckErrorCleanup,
      deviceNotificationCleanup,
      specificDeviceNotificationCleanup
    );
  };

  const addDeviceNotification = (notification) => {
    deviceNotifications.value.unshift({
      ...notification,
      isRead: false,
      receivedAt: new Date().toISOString()
    });

    // Keep only last 20 device notifications
    if (deviceNotifications.value.length > 20) {
      deviceNotifications.value = deviceNotifications.value.slice(0, 20);
    }

    console.log(`📥 Added device notification: ${notification.title}`);
  };

  // NEW: Show browser notification for device changes
  const showDeviceBrowserNotification = (notification) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      const shouldShow = notification.type === 'device_status_change' &&
                        (notification.newStatus === 'DISCONNECTED' || notification.newStatus === 'CONNECTED');

      if (shouldShow) {
        const icon = notification.newStatus === 'CONNECTED' ? '🟢' : '🔴';
        const statusText = notification.newStatus === 'CONNECTED' ? 'Terhubung' : 'Terputus';

        new Notification(`${icon} Device ${statusText}`, {
          body: `${notification.deviceCode} - ${notification.location}`,
          icon: '/favicon.ico',
          tag: `device-${notification.deviceCode}`,
          requireInteraction: notification.newStatus === 'DISCONNECTED' // Require interaction for disconnection
        });
      }
    }
  };

  // NEW: Mark device notification as read
  const markDeviceNotificationAsRead = (notificationId) => {
    const notification = deviceNotifications.value.find(n => n.id === notificationId);
    if (notification && !notification.isRead) {
      notification.isRead = true;
    }
  };

  // NEW: Get unread device notifications
  const getUnreadDeviceNotifications = () => {
    return deviceNotifications.value.filter(n => !n.isRead);
  };

  // NEW: Clear device notifications
  const clearDeviceNotifications = () => {
    deviceNotifications.value = [];
  };

  // Update device status
  const updateDeviceStatus = (deviceCode, updates) => {
    const currentStatus = deviceStatuses.value.get(deviceCode) || {};
    const newStatus = {
      ...currentStatus,
      ...updates,
      deviceCode
    };

    deviceStatuses.value.set(deviceCode, newStatus);

    // Check for status change and create local notification if needed
    if (currentStatus.status && currentStatus.status !== updates.status) {
      console.log(`📱 Device ${deviceCode} status changed: ${currentStatus.status} → ${updates.status}`);
    }
  };

  // Add to recent sensor updates
  const addToRecentUpdates = (data) => {
    recentSensorUpdates.value.unshift({
      ...data,
      id: Date.now() + Math.random(),
      timestamp: new Date()
    });

    // Keep only last 10 updates
    if (recentSensorUpdates.value.length > 10) {
      recentSensorUpdates.value = recentSensorUpdates.value.slice(0, 10);
    }
  };

  // Subscribe to specific device
  const subscribeToDevice = (deviceId) => {
    // Also subscribe to device notifications
    socket.emit('subscribe-device-notifications', deviceId);
    return socket.subscribeToDevice(deviceId);
  };

  // Unsubscribe from specific device
  const unsubscribeFromDevice = (deviceId) => {
    socket.emit('unsubscribe-device-notifications', deviceId);
    return socket.unsubscribeFromDevice(deviceId);
  };

  // Subscribe to device status
  const subscribeToDeviceStatus = (deviceCode) => {
    socket.emit('subscribe-device-notifications', deviceCode);
    return socket.subscribeToDeviceStatus(deviceCode);
  };

  // Unsubscribe from device status
  const unsubscribeFromDeviceStatus = (deviceCode) => {
    socket.emit('unsubscribe-device-notifications', deviceCode);
    return socket.unsubscribeFromDeviceStatus(deviceCode);
  };

  // Get device status by code
  const getDeviceStatus = (deviceCode) => {
    return deviceStatuses.value.get(deviceCode) || null;
  };

  // Get all device statuses as array
  const getAllDeviceStatuses = () => {
    return Array.from(deviceStatuses.value.values());
  };

  // Check if device is online
  const isDeviceOnline = (deviceCode) => {
    const device = deviceStatuses.value.get(deviceCode);
    if (!device || !device.lastSeen) return false;

    const now = new Date();
    const lastSeen = new Date(device.lastSeen);
    const diffMinutes = (now - lastSeen) / (1000 * 60);

    // Consider device offline if no activity for more than 5 minutes
    return diffMinutes < 5;
  };

  // Clear recent updates
  const clearRecentUpdates = () => {
    recentSensorUpdates.value = [];
  };

  // NEW: Subscribe to all device notifications
  const subscribeToAllDeviceNotifications = () => {
    socket.emit('subscribe-notifications');
    console.log('🔔 Subscribed to all device notifications');
  };

  // Initialize device monitoring
  const initialize = () => {
    // Connect socket if not already connected
    if (!socket.isConnected()) {
      socket.connect();
    }

    // Setup device-specific listeners
    initializeDeviceListeners();

    // Subscribe to device notifications
    subscribeToAllDeviceNotifications();

    // Request device status when connected
    if (socket.isConnected()) {
      // Device status is automatically sent on connection
    } else {
      // Wait for connection
      const connectCleanup = socket.on('connect', () => {
        // Device status summary will be automatically sent
        subscribeToAllDeviceNotifications(); // Re-subscribe on reconnect
        connectCleanup();
      });
    }
  };

  // Cleanup function
  const cleanup = () => {
    cleanupFunctions.forEach(cleanup => {
      if (typeof cleanup === 'function') {
        cleanup();
      }
    });
    cleanupFunctions.length = 0;
  };

  // Auto-initialize on mount and cleanup on unmount
  onMounted(() => {
    initialize();
  });

  onUnmounted(() => {
    cleanup();
  });

  return {
    // State
    sensorData,
    deviceStatuses,
    connectedDevices,
    recentSensorUpdates,
    connected: socket.connected,
    reconnecting: socket.reconnecting,
    lastUpdateTime: socket.lastUpdateTime,

    // NEW: Device notification state
    deviceNotifications,
    deviceNotificationData,

    // Methods
    subscribeToDevice,
    unsubscribeFromDevice,
    subscribeToDeviceStatus,
    unsubscribeFromDeviceStatus,
    getDeviceStatus,
    getAllDeviceStatuses,
    isDeviceOnline,
    clearRecentUpdates,

    markDeviceNotificationAsRead,
    getUnreadDeviceNotifications,
    clearDeviceNotifications,
    subscribeToAllDeviceNotifications,

    // Utilities
    isConnected: socket.isConnected,
    getSocketId: socket.getSocketId,
  };
}
