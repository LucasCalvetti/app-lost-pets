import { Sequelize } from "sequelize";
import "dotenv/config";

// export const sequelize = new Sequelize({
//     dialect: "postgres",
//     username: process.env.POSTGRES_USERNAME,
//     password: process.env.POSTGRES_PASSWORD,
//     database: process.env.POSTGRES_DATABASE,
//     port: 5432,
//     host: process.env.POSTGRES_HOST,
//     ssl: true, //para que se conecte de forma segura
//     // esto es necesario para que corra correctamente
//     dialectOptions: {
//         ssl: {
//             require: true,
//             rejectUnauthorized: false,
//         },
//     },
// });

// export const sequelize = new Sequelize(`postgres://${process.env.POSTGRES_USERNAME}:${process.env.POSTGRES_PASSWORD}@${process.env.POSTGRES_HOST}.com/${process.env.POSTGRES_DATABASE}`);

export const sequelize = new Sequelize(`postgres://${process.env.POSTGRES_USERNAME}:${process.env.POSTGRES_PASSWORD}@${process.env.POSTGRES_HOST}.com/${process.env.POSTGRES_DATABASE}`, {
  dialect: "postgres",
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  },
});
