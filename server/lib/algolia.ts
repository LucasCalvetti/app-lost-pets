import algoliasearch from "algoliasearch";
import "dotenv/config";

const client = algoliasearch(process.env.ALGOLIA_CLIENT, process.env.ALGOLIA_KEY);
const index = client.initIndex("pets");

function petDataToAlgoliaIndexData(petData, petId?: number) {
    const formatedPetData: any = {};

    if (petData.petName) {
        formatedPetData.petName = petData.petName;
    }
    if (petData.lat || petData.lng) {
        formatedPetData._geoloc = { lat: petData.lat, lng: petData.lng };
    }
    if (petId || petData.id) {
        formatedPetData.objectID = petId || petData.id;
    }

    return formatedPetData;
}

export async function createPetAlgolia(petData) {
    const formatedPetData = petDataToAlgoliaIndexData(petData);

    try {
        const createdPet = index.saveObject({
            objectID: formatedPetData.objectID,
            petName: formatedPetData.petName,
            _geoloc: formatedPetData._geoloc,
        });
        return createdPet as any;
    } catch (error) {
        console.error(error);
        return { error };
    }
}

export async function updatePetAlgolia(petData, petId: number) {
    const formatedPetData = petDataToAlgoliaIndexData(petData, petId);
    try {
        const updatedAlgoliaPet = await index.partialUpdateObject(formatedPetData);
        return updatedAlgoliaPet;
    } catch (error) {
        console.error(error);
        return { error };
    }
}

export async function deletePetAlgolia(petId: string) {
    try {
        const algoliaPetDeleted = await index.deleteObject(petId);
        return algoliaPetDeleted;
    } catch (error) {
        console.error(error);
    }
}

// Busca mascotas cerca de una lat y lng determinada, y manda los petId de las mismas
// Envia solo los petId para luego buscar en la database los datos de la misma
// ya que no queria guardar todos los datos de la mascota en algolia
// la otra opción era guardar todo y pedir todo
export async function searchPetsAround(lat, lng) {
    const { hits, nbHits } = await index.search("", {
        aroundLatLng: [lat, lng].join(","),

        aroundRadius: 10000, // 10 km
    });
    const IdsOfPetsAround = hits.map((pet) => {
        return { id: pet.objectID };
    });
    return { IdsOfPetsAround, nbHits };
}

export { index };
