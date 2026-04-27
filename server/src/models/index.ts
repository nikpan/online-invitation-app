import sequelize from '../config/database';
import { User } from './User';
import { Event } from './Event';
import { Guest } from './Guest';
import { EventUpdate } from './EventUpdate';

// Associations
User.hasMany(Event, { foreignKey: 'host_id', as: 'events' });
Event.belongsTo(User, { foreignKey: 'host_id', as: 'host' });

Event.hasMany(Guest, { foreignKey: 'event_id', as: 'guests' });
Guest.belongsTo(Event, { foreignKey: 'event_id', as: 'event' });

Event.hasMany(EventUpdate, { foreignKey: 'event_id', as: 'updates' });
EventUpdate.belongsTo(Event, { foreignKey: 'event_id', as: 'event' });

export { sequelize, User, Event, Guest, EventUpdate };
