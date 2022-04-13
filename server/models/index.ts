import { User } from "./user";
import { Auth } from "./auth";
import { Pet } from "./pet";
import { Report } from "./report";

User.hasMany(Pet);
Pet.belongsTo(User);
//---------------------------------------------------//
User.hasOne(Auth);
Auth.belongsTo(User);
//---------------------------------------------------//
Pet.hasMany(Report);
Report.belongsTo(Pet);
//---------------------------------------------------//
User.hasMany(Report);
Report.belongsTo(User);

export { User, Auth, Pet, Report };
