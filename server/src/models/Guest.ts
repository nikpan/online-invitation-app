import {
  DataTypes,
  Model,
  type InferAttributes,
  type InferCreationAttributes,
  type CreationOptional,
} from 'sequelize';
import sequelize from '../config/database';

export type RsvpStatus = 'pending' | 'attending' | 'declined' | 'maybe';

export class Guest extends Model<InferAttributes<Guest>, InferCreationAttributes<Guest>> {
  declare id: CreationOptional<string>;
  declare event_id: string;
  declare name: string;
  declare email: string | null;
  declare phone: string | null;
  declare rsvp_status: CreationOptional<RsvpStatus>;
  declare adult_count: CreationOptional<number>;
  declare kid_count: CreationOptional<number>;
  declare edit_token: string;
  declare rsvp_at: Date | null;
  declare message: string | null;
  declare reminded_at: Date | null;
  declare created_at: CreationOptional<Date>;
}

Guest.init(
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
    created_at: {
      type: DataTypes.DATE,
    },
  },
  {
    sequelize,
    tableName: 'guests',
    modelName: 'Guest',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
  },
);

export default Guest;
