// composables/useDeviceSocket.js
import { ref, onMounted, onUnmounted } from 'vue';
import { useSocket } from './useSocket.js';

export function useDeviceSocket() {
  const socket = useSocket();

  // Reactive state
  const sensorData = ref({});
  const deviceStatuses = ref(new Map());
  const connectedDevices = ref([]);
  const recentSensorUpdates = ref([]);

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
      console.log('💓 Device heartbeat:', data);

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

      // Update connected devices list
      if (data.devices && Array.isArray(data.devices)) {
        connectedDevices.value = data.devices;

        // Update individual device statuses
        data.devices.forEach(device => {
          updateDeviceStatus(device.code, {
            id: device.id,
            name: device.description,
            status: device.status,
            lastSeen: new Date(device.lastSeen)
          });
        });
      }
    });

    // Device check result handler
    const deviceCheckCleanup = socket.on('device-check-result', (data) => {
      console.log('✅ Device check result:', data);
    });

    // Device check error handler
    const deviceCheckErrorCleanup = socket.on('device-check-error', (data) => {
      console.error('❌ Device check error:', data);
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
      deviceCheckErrorCleanup
    );
  };

  // Update device status
  const updateDeviceStatus = (deviceCode, updates) => {
    const currentStatus = deviceStatuses.value.get(deviceCode) || {};
    deviceStatuses.value.set(deviceCode, {
      ...currentStatus,
      ...updates,
      deviceCode
    });
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
    return socket.subscribeToDevice(deviceId);
  };

  // Unsubscribe from specific device
  const unsubscribeFromDevice = (deviceId) => {
    return socket.unsubscribeFromDevice(deviceId);
  };

  // Subscribe to device status
  const subscribeToDeviceStatus = (deviceCode) => {
    return socket.subscribeToDeviceStatus(deviceCode);
  };

  // Unsubscribe from device status
  const unsubscribeFromDeviceStatus = (deviceCode) => {
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

  // Initialize device monitoring
  const initialize = () => {
    // Connect socket if not already connected
    if (!socket.isConnected()) {
      socket.connect();
    }

    // Setup device-specific listeners
    initializeDeviceListeners();

    // Request device status when connected
    if (socket.isConnected()) {
      // Device status is automatically sent on connection
    } else {
      // Wait for connection
      const connectCleanup = socket.on('connect', () => {
        // Device status summary will be automatically sent
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

    // Methods
    subscribeToDevice,
    unsubscribeFromDevice,
    subscribeToDeviceStatus,
    unsubscribeFromDeviceStatus,
    getDeviceStatus,
    getAllDeviceStatuses,
    isDeviceOnline,
    clearRecentUpdates,

    // Utilities
    isConnected: socket.isConnected,
    getSocketId: socket.getSocketId,
  };
}
