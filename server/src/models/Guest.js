const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Guest = sequelize.define(
  'Guest',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    event_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    phone: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    rsvp_status: {
      type: DataTypes.ENUM('pending', 'attending', 'declined', 'maybe'),
      allowNull: false,
      defaultValue: 'pending',
    },
    adult_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    kid_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    edit_token: {
      type: DataTypes.STRING(128),
      allowNull: false,
      unique: true,
    },
    rsvp_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    reminded_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: 'guests',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
  }
);

module.exports = Guest;
