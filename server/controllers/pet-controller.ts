import { cloudinary } from "../lib/cloundinary";
import { Pet } from "../models";
import { User } from "../models";

export async function createPet(dataPet, user_id: number) {
    const { petName, petImg, lat, lng, location, description } = dataPet;
    const img = await cloudinary.uploader.upload(petImg, {
        resource_type: "image",
        discard_original_filename: true,
        width: 1000,
    });
    const imgUrl = img.secure_url;

    const [pet, petCreated] = await Pet.findOrCreate({
        // To make sure that the user do not post more than one Pet with the same data
        where: {
            petName,
            lat,
            lng,
            location,
            userId: user_id,
        },

        defaults: {
            petName,
            petImg: imgUrl,
            lat,
            lng,
            location,
            description,
            userId: user_id,
            found: false,
        },
    });

    return { pet, petCreated };
}

export async function updatePet(dataToUpdate: {}, user_id: number, petId: number) {
    try {
        const updatedPet = await Pet.update(dataToUpdate, { where: { userId: user_id, id: petId } });
        return updatedPet;
    } catch (error) {
        console.log(error);
        return { error };
    }
}

export async function allUserPets(user_id: number) {
    try {
        const allPets = await Pet.findAll({ where: { userId: user_id } });
        return allPets;
    } catch (error) {
        console.log(error);
        return { error };
    }
}

export async function getPetById(petId: number) {
    try {
        const pet = await Pet.findByPk(petId);
        if (pet == null) {
            throw "error: pet or petId requested does not exist, or has already been deleted. Check if petId is correct";
        } else {
            return pet;
        }
    } catch (error) {
        return { error };
    }
}

export async function getPetAndOwner(petId: number) {
    const petAndOwner = await Pet.findByPk(petId, { include: [User] });
    return petAndOwner;
}

export async function deletePet(petId: number, userId: number) {
    const response = await Pet.destroy({ where: { id: petId, userId } });
    return response;
}
