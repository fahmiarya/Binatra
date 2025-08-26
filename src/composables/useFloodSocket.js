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
  const notifications = ref([]);
  const currentLocationStatus = ref(null)
  const unreadCount = ref(0);

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
        depth,
        rainfall,
        timestamp
      } = data;

      handleLocationStatusChange(locationId, {
        currentStatus: newStatus,
        currentWaterLevel: depth,
        currentRainfall: rainfall,
        lastUpdate: timestamp
      });

      // Show visual feedback
      showLocationUpdate(locationId);

      // Show browser notification
      showBrowserNotification(locationName, previousStatus, newStatus);

      console.log(`✅ Updated ${locationName}: ${previousStatus} → ${newStatus}`);
    });

    const newLocationStatusHistory = socket.on('location_status_history_created', (newData) => {
      currentLocationStatus.value = newData;
      console.log("lokasi terbaru dari socket : ", currentLocationStatus.value)
    })

    // NEW: Main notification handler
    const newNotificationCleanup = socket.on('new-notification', (notification) => {
      console.log('🔔 New notification received:', notification);

      addNotification(notification);

      // Show browser notification based on type and severity
      if (['location_status_change', 'new_flood_location'].includes(notification.type)) {
        showAdvancedBrowserNotification(notification);
      }
    });

    // NEW: Location-specific notification handler
    const locationNotificationCleanup = socket.on('notification-location-*', (notification) => {
      console.log('📍 Location-specific notification:', notification);
      addNotification(notification);
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
      newNotificationCleanup,
      locationNotificationCleanup,
      newLocationStatusHistory,
      floodWarningsCleanup,
      floodSummaryCleanup,
      floodStatusCleanup,
      locationErrorCleanup
    );
  };

  // NEW: Add notification to list
  const addNotification = (notification) => {
    // Add to beginning of array (newest first)
    notifications.value.unshift({
      ...notification,
      isRead: false,
      receivedAt: new Date().toISOString()
    });

    // Increment unread count
    unreadCount.value += 1;

    // Keep only last 50 notifications
    if (notifications.value.length > 50) {
      notifications.value = notifications.value.slice(0, 50);
    }

    console.log(`📥 Added notification: ${notification.title}`);
  };

  // NEW: Mark notification as read
  const markAsRead = (notificationId) => {
    const notification = notifications.value.find(n => n.id === notificationId);
    if (notification && !notification.isRead) {
      notification.isRead = true;
      unreadCount.value = Math.max(0, unreadCount.value - 1);
    }
  };

  // NEW: Mark all notifications as read
  const markAllAsRead = () => {
    notifications.value.forEach(notification => {
      notification.isRead = true;
    });
    unreadCount.value = 0;
  };

  // NEW: Clear all notifications
  const clearAllNotifications = () => {
    notifications.value = [];
    unreadCount.value = 0;
  };

  // NEW: Get notifications by type
  const getNotificationsByType = (type) => {
    return notifications.value.filter(n => n.type === type);
  };

  // NEW: Get unread notifications
  const getUnreadNotifications = () => {
    return notifications.value.filter(n => !n.isRead);
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

  // Show browser notification (legacy)
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

  // NEW: Advanced browser notification handler
  const showAdvancedBrowserNotification = (notification) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      const shouldShowBrowserNotification =
        notification.severity === 'high' ||
        ['new_flood_location', 'location_status_change'].includes(notification.type);

      if (shouldShowBrowserNotification) {
        const iconMap = {
          'new_flood_location': '🌊',
          'location_status_change': '⚠️',
          'device_status_change': '📡',
          'new_device': '🆕'
        };

        const icon = iconMap[notification.type] || '🔔';

        new Notification(`${icon} ${notification.title}`, {
          body: `${notification.location} ${notification.timeframe}`,
          icon: '/favicon.ico',
          tag: `${notification.type}-${notification.id}`,
          requireInteraction: notification.severity === 'high',
          data: notification // Store notification data
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
    // Subscribe to location notifications
    socket.emit('subscribe-location-notifications', locationId);
    return socket.subscribeToLocation(locationId);
  };

  // Unsubscribe from location updates
  const unsubscribeFromLocation = (locationId) => {
    socket.emit('unsubscribe-location-notifications', locationId);
    return socket.unsubscribeFromLocation(locationId);
  };

  // NEW: Subscribe to all notifications
  const subscribeToNotifications = () => {
    socket.emit('subscribe-notifications');
    console.log('🔔 Subscribed to all notifications');
  };

  // NEW: Unsubscribe from all notifications
  const unsubscribeFromNotifications = () => {
    socket.emit('unsubscribe-notifications');
    console.log('🔕 Unsubscribed from all notifications');
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

    // Subscribe to notifications
    subscribeToNotifications();

    // Request notification permission
    requestNotificationPermission();

    // Request initial flood status when connected
    if (socket.isConnected()) {
      socket.requestFloodStatus();
    } else {
      // Wait for connection then request
      const connectCleanup = socket.on('connect', () => {
        socket.requestFloodStatus();
        subscribeToNotifications(); // Re-subscribe on reconnect
        connectCleanup(); // Remove this listener after first connection
      });
    }
  };

  // Cleanup function
  const cleanup = () => {
    // Unsubscribe from notifications
    unsubscribeFromNotifications();

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
    currentLocationStatus,

    // NEW: Notification state
    notifications,
    unreadCount,

    // Methods
    subscribeToLocation,
    unsubscribeFromLocation,
    refreshFloodData,
    requestNotificationPermission,

    // NEW: Notification methods
    markAsRead,
    markAllAsRead,
    clearAllNotifications,
    getNotificationsByType,
    getUnreadNotifications,
    subscribeToNotifications,
    unsubscribeFromNotifications,

    // Utilities
    formatLastUpdate,
    isConnected: socket.isConnected,
    getSocketId: socket.getSocketId,
  };
}
