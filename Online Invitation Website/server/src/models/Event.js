const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Event = sequelize.define(
  'Event',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    host_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    slug: {
      type: DataTypes.STRING(200),
      allowNull: false,
      unique: true,
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    event_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    event_end_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    location_name: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    location_address: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    location_lat: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    location_lng: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    cover_image_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    theme: {
      type: DataTypes.ENUM('confetti', 'elegant', 'neon'),
      allowNull: false,
      defaultValue: 'confetti',
    },
    max_guests: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    is_public: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    rsvp_deadline: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('draft', 'published', 'closed', 'archived'),
      allowNull: false,
      defaultValue: 'draft',
    },
  },
  {
    tableName: 'events',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

module.exports = Event;
