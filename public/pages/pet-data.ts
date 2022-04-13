import { Router } from "@vaadin/router";
import { state } from "../state";
import { mapping } from "../utils/mapbox";
import { dropzonedImg } from "../utils/dropzone";
import Swal from "sweetalert2";
const missingImg = require("url:../images/no-img.png");

class PetData extends HTMLElement {
    async connectedCallback() {
        const { token } = state.getState().user;

        if (!token) {
            return Router.go("/login");
        }

        const { petData } = state.getState();

        if (petData.id) {
            await state.getPetData();

            const { petData } = state.getState();

            this.render(petData);
        } else {
            this.render();
        }
    }

    // Page para Editar o Reportar Pet - Ver Figma
    render(pet?) {
        const type = pet ? "Editar" : "Reportar";

        this.innerHTML = `
      <div>
      <custom-header> </custom-header>
      <form class="pet-data form card">
        <h1 class="title"> ${type} mascota perdida</h1>
        <div class="sub-container">
        
                <label class="label">
                <span>NOMBRE</span>
                <input type="text" name="name" class="is-success" required />
                </label>
                <label class="label">
                <span> DESCRIPCIÓN: </span>
                <input type="text" name="description" class="is-success" />
                </label>
                
                <label class="label" id="img">
                  <img class="imgUrlPet pet-card__img" name="imgURL" src=${missingImg} crossorigin="anonymous">
                  <br />
                  <p class="subtitle"> Imagen hasta 60kB. Haga click arriba para seleccionar la imagen. </p>
                  <p class="subtitle"> Si su imagen es más pesada, asegúrese de achicarla, de otro modo el reporte NO se realizará. Hágalo en segundos con <a href="https://www.achicarimagenes.com.ar/" target="_blank"> esta web </a></p>    
                  <custom-button type="btn btn-outline-success buttonCentered" id="buttonImg"> Agregar/Modificar foto</custom-button>
                </label>
  
        </div>
        <label class="label sub-container">
            <span>UBICACION</span>
            <p class="subtitle">BUSCÁ UN PUNTO DE REFERENCIA PARA REPORTAR A TU MASCOTA. PUEDE SER UNA DIRECCIÓN, UN BARRIO O UNA CIUDAD</p>
            <p class="subtitle">LUEGO MUEVE EL MARCADOR DEL MAPA SI QUIERES MÁS EXACTITUD EN LA UBICACIÓN</p>
            <div id="map" style="width: 335px; height: 335px"></div>
            <input type="text" name="geoloc" class="search-geoloc" required>
            <span class="loader-cont"> </span>
            
            <custom-button class="submit" type="btn btn-outline-success buttonCentered">${type}</custom-button>
            
            <custom-button type="btn btn-outline-danger buttonCentered" class=${pet ? "finded" : "cancel"}>${pet ? "Reportar como encontrado" : "Cancelar"}</custom-button>
        </label>
      </form>
    </div>
    `;
        const pic = this.querySelector(".imgUrlPet");
        const petDataForm: any = this.querySelector(".form");
        const buttonImg = this.querySelector("#buttonImg");
        if (pet) {
            petDataForm.name.value = pet.petName;
            pic.setAttribute("src", pet.petImg);
            petDataForm.geoloc.value = pet.location;
            petDataForm.description.value = pet.description;
        }

        //inicializa el mapa
        pet ? mapping([pet.lng, pet.lat]) : mapping();

        //inicializa dropzone
        dropzonedImg(pic, buttonImg);

        this.querySelector(".submit").addEventListener("buttonClicked", async (e) => {
            const petDataForm: any = this.querySelector(".form");

            const loaderCont = this.querySelector(".loader-cont");
            loaderCont.setAttribute("style", "display: flex; margin-bottom: 40px");
            loaderCont.innerHTML = `
        <custom-loader> </custom-loader>
        `;

            if (type == "Editar") {
                // Edita la mascota
                const res = await state.editPet({
                    petId: pet.id,
                    petName: petDataForm.name.value,
                    location: petDataForm.geoloc.value,
                    description: petDataForm.description.value,
                    petImg: pet.petImg,
                });

                if (res.updatedAlgoliaPet.error || res.updatedPet.error) {
                    loaderCont.setAttribute("style", "display: none");
                    Swal.fire({
                        title: res.petUpdated.error || res.algoliaPetUpdated.error,
                    });
                } else {
                    loaderCont.setAttribute("style", "display: none");
                    Swal.fire({ icon: "success", title: res.message });
                }
            }

            if (type == "Reportar") {
                // Crea la mascota
                const res = await state.createPet({
                    petName: petDataForm.name.value,
                    location: petDataForm.geoloc.value,
                    description: petDataForm.description.value,
                });

                if (res.newPet.petCreated === false) {
                    loaderCont.setAttribute("style", "display: none");
                    Swal.fire({
                        title: "Este reporte ya existe. Asegúrese de completar los campos correctamente.",
                    });
                } else {
                    loaderCont.setAttribute("style", "display: none");
                    Swal.fire({
                        icon: "success",
                        title: "Su mascota ha sido reportada correctamente. Este atento a su casilla de correo, inclusive al spam, ya que por allí le llegarán los reportes de su mascota.",
                    });
                }
            }
        });

        this.querySelector(".cancel")?.addEventListener("buttonClicked", (e) => {
            //limpiar formulario
            const petDataForm: any = this.querySelector(".form");
            petDataForm.reset();
        });

        this.querySelector(".finded")?.addEventListener("buttonClicked", async (e) => {
            //enviar al servidor que se encontró a la pet
            const res = await state.petFound(pet.id);

            const loaderCont = this.querySelector(".loader-cont");
            loaderCont.setAttribute("style", "display: flex; margin-bottom: 40px");
            loaderCont.innerHTML = `
        <custom-loader> </custom-loader>
        `;

            if (res.message) {
                loaderCont.setAttribute("style", "display: none");
                Swal.fire({
                    icon: "success",
                    title: "Usted ha encontrado a su mascota, ¡Felicitaciones!",
                });
                setTimeout(() => {
                    Router.go("/");
                }, 2000);
            } else {
                loaderCont.setAttribute("style", "display: none");
                Swal.fire({
                    icon: "error",
                    title: res.error,
                });
            }

            const petDataForm: any = this.querySelector(".form");
            state.data.petData = {};
            petDataForm.reset();
        });
    }
}
customElements.define("x-pet-data-page", PetData);
