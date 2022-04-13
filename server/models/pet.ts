import { Model, DataTypes } from "sequelize";
import { sequelize } from "./conn";

export class Pet extends Model {}

Pet.init(
    {
        petName: DataTypes.STRING,
        lat: DataTypes.FLOAT,
        lng: DataTypes.FLOAT,
        petImg: DataTypes.STRING,
        location: DataTypes.STRING,
        found: DataTypes.BOOLEAN,
        description: DataTypes.STRING,
    },
    { sequelize, modelName: "pet" }
);
