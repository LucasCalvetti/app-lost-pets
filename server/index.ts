import * as express from "express";
import * as path from "path";
import { createUser, verifyIfUserExists, getUserProfile, updateUserProfile } from "./controllers/user-controller";
import { signIn, updateUserAuth } from "./controllers/auth-controller";
import { createPet, updatePet, allUserPets, getPetAndOwner, deletePet, getPetById } from "./controllers/pet-controller";
import { createReport, getAllPetReports } from "./controllers/report-controller";
import * as jwt from "jsonwebtoken";
import "dotenv/config";
import * as cors from "cors";
import { sendEmail } from "./lib/sendgrid";
import { createPetAlgolia, updatePetAlgolia, deletePetAlgolia, searchPetsAround, index } from "./lib/algolia";

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: false, parameterLimit: 50000 }));

const port = process.env.PORT || 3004;

//authMiddleware se encarga de verificar el token si es real o no, para acceder a los servicios de cuenta de del user

function authMiddleware(req, res, next) {
    const token = req.headers.authorization.split(" ")[1];
    try {
        const data = jwt.verify(token, process.env.SECRET_TEXT);
        req._user = data;
        next();
    } catch (e) {
        res.status(401).json({ error: "Account unauthorized." });
    }
}

//Este enpoint postea un usuario nuevo en la DB
app.post("/user", async (req, res) => {
    const { email, fullName, password } = req.body;
    try {
        const newUserId = await createUser(email, fullName, password);
        res.status(200).json(newUserId);
    } catch (error) {
        console.log(error);
        res.status(400).send({ error });
    }
});
//Este endpoint checkea si un mail existe o no en la DB, si no tira error, devuelve booleano
app.get("/user/email", async (req, res) => {
    try {
        const { email }: any = req.query;
        const response = await verifyIfUserExists(email);
        res.status(200).json(response);
    } catch (e) {
        res.status(400).send(e);
    }
});

//crea un token para un user, que se verificara posteriormente en cada proceso dentro de los datos del user
app.post("/user/auth/token", async (req, res) => {
    try {
        const { email, password } = req.body;
        const token = await signIn(email, password);
        res.status(200).json({ token, access: true });
    } catch (error) {
        error.access = false;
        res.status(401).send(error);
    }
});

app.get("/user/profile", authMiddleware, async (req: any, res) => {
    const { id } = req._user;

    try {
        const userProfile = await getUserProfile(id);

        res.status(200).json(userProfile);
    } catch (err) {
        res.status(400).json({ err });
    }
});

app.patch("/user/profile", authMiddleware, async (req: any, res) => {
    const { id } = req._user;
    if (!req.body.email || !req.body.fullName) {
        res.status(400).send({ error: "Missing email or fullName in body." });
    }
    const { email, fullName, password } = req.body;
    try {
        const usersUpdated = await updateUserProfile(id, email, fullName, password);

        // Actualizar contraseña en Table Auth
        if (req.body.password) {
            const authUpdated = await updateUserAuth(id, req.body.password, req.body.email);

            return res.status(200).json({ usersUpdated, authUpdated, userWhoWasUpdated: id });
        }

        res.status(200).json({ usersUpdated, userWhoWasUpdated: id });
    } catch (error) {
        res.status(400).json({ error });
    }
});

app.post("/user/pet", authMiddleware, async (req: any, res) => {
    try {
        const user_id = req._user.id;
        if (req.body.petName && req.body.petImg && req.body.lng && req.body.lat && req.body.location && req.body.description) {
            const newPet: any = await createPet(req.body, user_id);

            if (newPet.petCreated == true) {
                const newPetInAlgolia = await createPetAlgolia(newPet.pet.dataValues);

                if (newPetInAlgolia.error) {
                    res.status(500).json(newPetInAlgolia.error);
                }
            }
            res.json({ newPet });
        } else {
            res.status(400).json({ error: "Missing data in body." });
        }
    } catch (e) {
        console.log(e);
        res.status(500).json({ error: e });
    }
});

app.get("/user/pet", authMiddleware, async (req: any, res) => {
    try {
        const user_id = req._user.id;
        const allMyPets = await allUserPets(user_id);
        res.status(200).json(allMyPets);
    } catch (e) {
        console.log(e);
    }
});

app.get("/user/pet/:petId", async (req: any, res) => {
    const petId: number = req.params.petId;
    const petSearched: any = await getPetById(petId);
    if (petSearched.error) {
        res.status(400).send(petSearched);
    }
    res.status(200).json(petSearched);
});

app.patch("/user/pet/:petId", authMiddleware, async (req: any, res) => {
    const userId: number = req._user.id;
    const petId: number = req.params.petId;
    try {
        const updatedPet = await updatePet(req.body, userId, petId);
        const updatedAlgoliaPet = await updatePetAlgolia(req.body, petId);
        res.status(200).send({ updatedPet, updatedAlgoliaPet, message: "Changes submitted successfully" });
    } catch (e) {
        console.log(e);
    }
});

app.post("/user/pet/report", async (req, res) => {
    try {
        if (req.body.fullName && req.body.phoneNumber && req.body.description && req.body.petId) {
            const { fullName, phoneNumber, description, petId } = req.body;
            const newReport = await createReport(fullName, phoneNumber, description, petId);
            if (newReport.error) {
                return res.status(200).json({ error: newReport.error });
            } else {
                const petAndOwner: any = await getPetAndOwner(petId);
                const { email } = petAndOwner.user;
                const { petName } = petAndOwner;
                try {
                    const respuesta = await sendEmail(email, phoneNumber, petName, description);
                    res.status(200).json(respuesta);
                } catch (e) {
                    res.json(e);
                }
            }
        } else {
            res.status(400).json({ error: "Missing data in body." });
        }
    } catch (e) {
        console.log(e);
    }
});
// sirve para traer todos los reportes de otros usuarios a las mascotas perdidas de un usuario logueado
app.get("/user/report", authMiddleware, async (req: any, res) => {
    try {
        const userId: number = req._user.id;
        const allReports = await getAllPetReports(userId);
        res.status(200).json(allReports);
    } catch (e) {
        console.log(e);
    }
});

//borra la mascota de la base de datos, y de algolia
app.delete("/user/pet/:petId", authMiddleware, async (req: any, res) => {
    const userId: number = req._user.id;
    const petId: number = req.params.petId;
    const deletedPet = await deletePet(petId, userId);
    if (deletedPet == 1) {
        const petIdString = petId.toString();
        await deletePetAlgolia(petIdString);
        res.status(200).json({ message: "Pet deleted successfully", deletedPet });
    } else {
        res.status(500).send({ error: "Pet does not exist or cannot be deleted." });
    }
});

app.get("/pets/around", async (req, res) => {
    const { lat, lng } = req.query;
    if (!lat || !lng) {
        return res.status(400).json({
            message: "Missing data values for: lat and lng",
        });
    }
    try {
        const idOfPetsAroundAndNumberOfHits: any = await searchPetsAround(lat, lng);
        var petsAround = [];
        for (const id of idOfPetsAroundAndNumberOfHits.IdsOfPetsAround) {
            var pet = await getPetById(id.id);
            petsAround.push(pet);
        }
        res.status(200).json({ hits: idOfPetsAroundAndNumberOfHits.nbHits, petsAround });
    } catch (error) {
        res.status(400).json({ error });
    }
});

//------------------------------------------------------------------------------------//
const dir = process.env.NODE_ENV === "development" ? "../dist" : "../../dist";

const staticDirPath = path.resolve(__dirname, dir);

app.use(express.static(staticDirPath));

app.get("*", function (req, res) {
    res.sendFile(staticDirPath + "/index.html");
});

app.listen(port, () => {
    console.log("server running in port: ", port);
});
