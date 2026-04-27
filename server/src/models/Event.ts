import {
  DataTypes,
  Model,
  type InferAttributes,
  type InferCreationAttributes,
  type CreationOptional,
} from 'sequelize';
import sequelize from '../config/database';

export type EventTheme = 'confetti' | 'elegant' | 'neon';
export type EventStatus = 'draft' | 'published' | 'closed' | 'archived';

export class Event extends Model<InferAttributes<Event>, InferCreationAttributes<Event>> {
  declare id: CreationOptional<string>;
  declare host_id: string;
  declare slug: string;
  declare title: string;
  declare description: string | null;
  declare event_date: Date;
  declare event_end_date: Date | null;
  declare location_name: string | null;
  declare location_address: string | null;
  declare location_lat: number | null;
  declare location_lng: number | null;
  declare cover_image_url: string | null;
  declare theme: CreationOptional<EventTheme>;
  declare max_guests: number | null;
  declare is_public: CreationOptional<boolean>;
  declare rsvp_deadline: Date | null;
  declare status: CreationOptional<EventStatus>;
  declare created_at: CreationOptional<Date>;
  declare updated_at: CreationOptional<Date>;
}

Event.init(
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
    created_at: {
      type: DataTypes.DATE,
    },
    updated_at: {
      type: DataTypes.DATE,
    },
  },
  {
    sequelize,
    tableName: 'events',
    modelName: 'Event',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
);

export default Event;
