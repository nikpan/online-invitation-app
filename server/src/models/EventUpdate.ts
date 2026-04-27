import {
  DataTypes,
  Model,
  type InferAttributes,
  type InferCreationAttributes,
  type CreationOptional,
} from 'sequelize';
import sequelize from '../config/database';

export class EventUpdate extends Model<
  InferAttributes<EventUpdate>,
  InferCreationAttributes<EventUpdate>
> {
  declare id: CreationOptional<string>;
  declare event_id: string;
  declare content: string;
  declare send_email: CreationOptional<boolean>;
  declare created_at: CreationOptional<Date>;
}

EventUpdate.init(
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
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    send_email: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    created_at: {
      type: DataTypes.DATE,
    },
  },
  {
    sequelize,
    tableName: 'event_updates',
    modelName: 'EventUpdate',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
  },
);

export default EventUpdate;
