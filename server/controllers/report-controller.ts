import { Report } from "../models";
import { getPetAndOwner } from "./pet-controller";

export async function createReport(fullName: string, phoneNumber: number, description: string, petId: number) {
    try {
        const petAndOwner: any = await getPetAndOwner(petId);
        const petAndOwnerUserId = petAndOwner.userId;
        const [reportRecord, reportCreated] = await Report.findOrCreate({
            where: { fullName, phoneNumber, description },
            defaults: {
                fullName,
                phoneNumber,
                description,
                petId,
                userId: petAndOwnerUserId,
            },
        });
        if (!reportCreated) {
            const error = "This report already exists";
            return { error };
        } else {
            return { reportRecord };
        }
    } catch (e) {
        console.log(e);
    }
}
export async function getAllPetReports(userId: number) {
    try {
        const allReports = await Report.findAll({ where: { userId } });
        return allReports;
    } catch (err) {
        console.log(err);
    }
}
