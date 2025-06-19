// composables/useFloodSocket.js
import { ref, onMounted, onUnmounted } from 'vue';
import { useSocket } from './useSocket.js';

export function useFloodSocket() {
  const socket = useSocket();

  // Reactive state
  const floodLocations = ref([]);
  const floodSummary = ref(null);
  const recentlyUpdatedLocations = ref([]);
  const loading = ref(true);

  // Event handlers cleanup functions
  const cleanupFunctions = [];

  // Initialize flood-specific socket listeners
  const initializeFloodListeners = () => {
    // Location status changed handler
    const locationStatusCleanup = socket.on('location_status_changed', (data) => {
      console.log('📍 Location status changed:', data);

      const {
        locationId,
        locationName,
        previousStatus,
        newStatus,
        waterLevel,
        rainfall,
        timestamp
      } = data;

      handleLocationStatusChange(locationId, {
        currentStatus: newStatus,
        currentWaterLevel: waterLevel,
        currentRainfall: rainfall,
        lastUpdate: timestamp
      });

      // Show visual feedback
      showLocationUpdate(locationId);

      // Show browser notification
      showBrowserNotification(locationName, previousStatus, newStatus);

      console.log(`✅ Updated ${locationName}: ${previousStatus} → ${newStatus}`);
    });

    // Flood warnings updated handler
    const floodWarningsCleanup = socket.on('flood_warnings_updated', (data) => {
      console.log('🌊 Flood warnings updated:', data);

      if (data.warnings && Array.isArray(data.warnings)) {
        floodLocations.value = data.warnings;
        socket.lastUpdateTime.value = formatLastUpdate(data.timestamp);
      }
    });

    // Flood summary updated handler
    const floodSummaryCleanup = socket.on('flood_summary_updated', (data) => {
      console.log('📊 Flood summary updated:', data);

      if (data.summary) {
        floodSummary.value = data.summary;
        socket.lastUpdateTime.value = formatLastUpdate(data.timestamp);
      }
    });

    // Initial flood status response
    const floodStatusCleanup = socket.on('flood-status-response', (data) => {
      console.log('📊 Initial flood status received:', data);

      if (data.warnings && Array.isArray(data.warnings)) {
        floodLocations.value = data.warnings;
      }

      if (data.summary) {
        floodSummary.value = data.summary;
      }

      socket.lastUpdateTime.value = formatLastUpdate(data.timestamp);
      loading.value = false;
    });

    // Error handlers
    const locationErrorCleanup = socket.on('location_processing_error', (data) => {
      console.error('❌ Location processing error:', data);
    });

    // Store cleanup functions
    cleanupFunctions.push(
      locationStatusCleanup,
      floodWarningsCleanup,
      floodSummaryCleanup,
      floodStatusCleanup,
      locationErrorCleanup
    );
  };

  // Handle location status change
  const handleLocationStatusChange = (locationId, updates) => {
    const locationIndex = floodLocations.value.findIndex(loc => loc.id === locationId);

    if (locationIndex !== -1) {
      // Update existing location
      floodLocations.value[locationIndex] = {
        ...floodLocations.value[locationIndex],
        ...updates
      };
    } else {
      // Location not found, refresh the list
      console.log(`📍 Location ${locationId} not found, requesting fresh data...`);
      socket.requestFloodStatus();
    }
  };

  // Show visual feedback for updated location
  const showLocationUpdate = (locationId) => {
    if (!recentlyUpdatedLocations.value.includes(locationId)) {
      recentlyUpdatedLocations.value.push(locationId);

      // Remove highlight after 3 seconds
      setTimeout(() => {
        const index = recentlyUpdatedLocations.value.indexOf(locationId);
        if (index > -1) {
          recentlyUpdatedLocations.value.splice(index, 1);
        }
      }, 3000);
    }
  };

  // Show browser notification
  const showBrowserNotification = (locationName, previousStatus, newStatus) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      // Only show notification for critical status changes
      if (['BAHAYA', 'SIAGA'].includes(newStatus)) {
        const severity = newStatus === 'BAHAYA' ? '🚨 Darurat' :
                       newStatus === 'SIAGA' ? '⚠️ Penting' :
                       newStatus === 'WASPADA' ? '⚠️ Peringatan' : 'ℹ️ Info';

        new Notification(`${severity}: Status Banjir Berubah`, {
          body: `${locationName}: ${previousStatus} → ${newStatus}`,
          icon: '/favicon.ico',
          tag: `location-${locationName}`,
          requireInteraction: newStatus === 'BAHAYA', // Requires user interaction for danger
        });
      }
    }
  };

  // Request notification permission
  const requestNotificationPermission = () => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        console.log('📢 Notification permission:', permission);
      });
    }
  };

  // Subscribe to location updates
  const subscribeToLocation = (locationId) => {
    return socket.subscribeToLocation(locationId);
  };

  // Unsubscribe from location updates
  const unsubscribeFromLocation = (locationId) => {
    return socket.unsubscribeFromLocation(locationId);
  };

  // Refresh flood data
  const refreshFloodData = () => {
    loading.value = true;
    socket.requestFloodStatus();
  };

  // Format last update time
  const formatLastUpdate = (lastUpdate) => {
    if (!lastUpdate) return 'Tidak ada data';

    const now = new Date();
    const updateTime = new Date(lastUpdate);
    const diffMinutes = Math.floor((now - updateTime) / (1000 * 60));

    if (diffMinutes < 1) return 'Baru saja';
    if (diffMinutes < 60) return `${diffMinutes} menit lalu`;

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} jam lalu`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} hari lalu`;
  };

  // Initialize connection and listeners
  const initialize = () => {
    // Connect socket if not already connected
    if (!socket.isConnected()) {
      socket.connect();
    }

    // Setup flood-specific listeners
    initializeFloodListeners();

    // Request notification permission
    requestNotificationPermission();

    // Request initial flood status when connected
    if (socket.isConnected()) {
      socket.requestFloodStatus();
    } else {
      // Wait for connection then request
      const connectCleanup = socket.on('connect', () => {
        socket.requestFloodStatus();
        connectCleanup(); // Remove this listener after first connection
      });
    }
  };

  // Cleanup function
  const cleanup = () => {
    // Remove all flood-specific listeners
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
    floodLocations,
    floodSummary,
    recentlyUpdatedLocations,
    loading,
    connected: socket.connected,
    reconnecting: socket.reconnecting,
    lastUpdateTime: socket.lastUpdateTime,

    // Methods
    subscribeToLocation,
    unsubscribeFromLocation,
    refreshFloodData,
    requestNotificationPermission,

    // Utilities
    formatLastUpdate,
    isConnected: socket.isConnected,
    getSocketId: socket.getSocketId,
  };
}
