import { User, Auth } from "../models";
import * as crypto from "crypto";
import * as jwt from "jsonwebtoken";

function validateEmail(email: string) {
    return email.match(/^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/);
    return false;
}

function getSHA256OfString(text: string) {
    return crypto.createHash("sha256").update(text).digest("hex");
}

//busca si un mail(que viene del req.body) esta relacionado a un usuario existente o no
export async function verifyIfUserExists(email: string) {
    if (validateEmail(email) == false) {
        throw "Error: invalid email format.";
    }
    const userFound = await User.findOne({ where: { email: email } });
    if (userFound) {
        return true;
    } else {
        return false;
    }
}

//creación de usuario en la DB
export async function createUser(email: string, fullName: string, password: string) {
    if (validateEmail(email) == false) {
        throw "Error: invalid email format.";
    }
    try {
        //Busco el usuario, si no existe lo creo, y "created" pasa a ser "true"
        const [user, created] = await User.findOrCreate({
            where: { email: email },
            defaults: {
                email,
                fullName,
            },
        });
        if (created) {
            //si se creo el usuario, le creo la instancia en Auth
            await Auth.create({
                email,
                password: getSHA256OfString(password),
                user_id: user.get("id"),
            });
            return { user, created, message: "User succesfully created." };
        }
        return { user, created, message: "User already exists." };
    } catch (e) {
        console.log(e);
        return e;
    }
}
export async function getUserProfile(userId: number) {
    if (!userId) {
        const error = "Missing userId data";
        return { error };
    }

    try {
        const userProfile = await User.findByPk(userId);

        return userProfile;
    } catch (err) {
        console.error({ err });
        return { err };
    }
}

export async function updateUserProfile(userId: number, email: string, fullName: string, password: string) {
    if (validateEmail(email) == false) {
        const error = "Error: invalid email format.";

        return { error };
    }

    try {
        const userUpdated = await User.update(
            { fullName, email: email },
            {
                where: {
                    id: userId,
                },
            }
        );

        const user = await User.findByPk(userId);

        return { userUpdated, user };
    } catch (error) {
        console.error(error);
        return { error };
    }
}
