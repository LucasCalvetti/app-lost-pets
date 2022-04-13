import { Dropzone } from "dropzone";
import { state } from "../state";

export async function dropzonedImg(pic, buttonImg) {
    let petImg;

    const myDropzone = new Dropzone(pic, {
        url: "/falsa",
        autoProcessQueue: false,

        clickable: true,
        clickeableElements: buttonImg,

        thumbnail: function (file, petImg) {
            pic.setAttribute("src", petImg); // Le pongo la petImg en el atributo src de la imagen que le mando a dropzonedImg() desde pet-data.ts
        },

        init: function () {
            buttonImg.addEventListener("buttonClicked", (e) => {
                this.processQueue();
            });
        },
    });

    myDropzone.on("thumbnail", function (file) {
        petImg = file.dataURL;
        state.setpetImg(petImg);
    });

    return petImg;
}
