import { User, Auth } from "../models";
import * as crypto from "crypto";
import * as jwt from "jsonwebtoken";
import "dotenv/config";

function getSHA256OfString(text: string) {
    return crypto.createHash("sha256").update(text).digest("hex");
}

//signIn
export async function signIn(email: string, password: string) {
    const passwordHashed = getSHA256OfString(password);
    const auth = await Auth.findOne({
        where: { email, password: passwordHashed },
    });

    const token = jwt.sign({ id: auth.get("user_id") }, process.env.SECRET_TEXT);
    if (auth) {
        return token;
    } else {
        throw { error: "Email o Contraseña incorrecto" };
    }
}

export async function updateUserAuth(userId: number, password: string, email?: string) {
    if (!userId || !password) {
        const error = "Missing userId or password";
        return { error };
    }

    try {
        const passwordHashed = crypto.createHash("sha256").update(password).digest("hex");

        const userUpdated = await Auth.update(
            { password: passwordHashed, email },
            {
                where: {
                    id: userId,
                },
            }
        );

        return { userUpdated };
    } catch (error) {
        console.error(error);
        return { error };
    }
}
