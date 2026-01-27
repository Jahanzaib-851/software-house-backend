// backend/src/constants/status.js
const STATUS = {
  // Asset related statuses
  AVAILABLE: 'available',
  ASSIGNED: 'assigned',
  MAINTENANCE: 'maintenance',
  RETIRED: 'retired',

  // General/User related statuses
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  SUSPENDED: 'suspended',

  // ✅ ADD THESE FOR NOTIFICATIONS
  UNREAD: 'unread',
  READ: 'read',
  ARCHIVED: 'archived'
};

export default STATUS;