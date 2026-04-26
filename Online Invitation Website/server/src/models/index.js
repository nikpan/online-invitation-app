const sequelize = require('../config/database');
const User = require('./User');
const Event = require('./Event');
const Guest = require('./Guest');
const EventUpdate = require('./EventUpdate');

// Associations
User.hasMany(Event, { foreignKey: 'host_id', as: 'events' });
Event.belongsTo(User, { foreignKey: 'host_id', as: 'host' });

Event.hasMany(Guest, { foreignKey: 'event_id', as: 'guests' });
Guest.belongsTo(Event, { foreignKey: 'event_id', as: 'event' });

Event.hasMany(EventUpdate, { foreignKey: 'event_id', as: 'updates' });
EventUpdate.belongsTo(Event, { foreignKey: 'event_id', as: 'event' });

module.exports = {
  sequelize,
  User,
  Event,
  Guest,
  EventUpdate,
};
