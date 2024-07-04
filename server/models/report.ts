import { Model, DataTypes } from "sequelize";
import { sequelize } from "./conn";

export class Report extends Model {}

Report.init(
  {
    fullName: DataTypes.STRING,
    phoneNumber: DataTypes.BIGINT,
    description: DataTypes.STRING,
  },
  { sequelize, modelName: "report" }
);
