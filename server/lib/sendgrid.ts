import * as sgMail from "@sendgrid/mail";

sgMail.setApiKey(process.env.SENDGRID_API_KEY);
export async function sendEmail(petOwnerEmail: string, phoneNumber: number, petName: string, reportDescription: string) {
    const msg = {
        to: petOwnerEmail,
        from: "lic.calvo099@gmail.com",
        subject: `Nuevo reporte de tu mascota perdida: ${petName}`,
        text: `Nuevo reporte de tu mascota perdida ${petName}. Alguien informó lo siguiente: " ${reportDescription} ". Podés ponerte en contacto con él/ella a través del siguiente teléfono: ${phoneNumber} `,
        html: `Nuevo reporte de tu mascota perdida ${petName}. Alguien informó lo siguiente: " ${reportDescription} ". Podés ponerte en contacto con él/ella a través del siguiente teléfono: ${phoneNumber} `,
    };
    try {
        const sentEmail = await sgMail.send(msg);
        const sendgridEmail = `Email sent to: ${petOwnerEmail}`;
        return { sendgridEmail, sentEmail };
    } catch (e) {
        console.log(e);
        return { e };
    }
}
