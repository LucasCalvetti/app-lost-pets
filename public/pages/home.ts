import { Router } from "@vaadin/router";
import Swal from "sweetalert2";
import { state } from "../state";

class HomePage extends HTMLElement {
    connectedCallback() {
        this.render();
    }

    addListenerGeoloc() {
        const cs = state.getState();
        this.querySelector("custom-button").addEventListener("buttonClicked", (e) => {
            const loaderCont = this.querySelector(".loader-cont");
            loaderCont.setAttribute("style", "display: initial");
            loaderCont.innerHTML = `
        <custom-loader> </custom-loader>
    `;

            navigator.geolocation.getCurrentPosition(async (geo) => {
                const { latitude, longitude } = geo.coords;
                cs._geoloc = { lat: latitude, lng: longitude };
                state.setState(cs);
                const pets = await (await state.getPetsAround()).json();

                this.render(pets);
            });
        });
    }

    addListenerPetReport() {
        const cs = state.getState();

        const pets = document.querySelectorAll("x-pet-card");

        for (const pet of pets) {
            pet.addEventListener("report-pet", (e) => {
                this.reportPet({
                    id: pet.getAttribute("petId"),
                    name: pet.getAttribute("petName"),
                });
            });

            pet.addEventListener("info-pet", (e) => {
                state.setPetData({ id: Number(pet.getAttribute("petId")) });
                Router.go("/pet-data");
            });
        }
    }

    reportPet(pet) {
        const div = document.createElement("div");
        div.innerHTML = `
    <div class="exit button is-danger">X</div>
    <h2 class="title">Reportar info de ${pet.name}</h2>
    <form class="report-pet__form">
        <label class="report-pet__label">
            <span>TU NOMBRE</span>
            <input  class="report-pet__input input is-large" type="text" name="name" required>
        </label>
        <label class="report-pet__label">
            <span>TU TELEFONO</span>
            <input  class="report-pet__input input is-large" type="phone" name="tel" required>
        </label>
        <label class="report-pet__label">
            <span>¿DÓNDE LO VISTE?</span>
            <textarea class="report-pet__input textarea" name="description" required></textarea>
        </label>
        <custom-button type="btn btn-outline-success">Enviar reporte</custom-button>
        <span class="loader-cont"></span>
    </form>
    `;
        div.className = "report-this-pet";
        div.classList.add("report-this-pet");
        div.classList.add("has-background-grey-darker");
        div.classList.add("has-text-light");
        this.appendChild(div);
        const form: any = this.querySelector(".report-pet__form");

        div.querySelector(".exit").addEventListener("click", () => {
            div.remove();
        });

        form.querySelector("custom-button").addEventListener("buttonClicked", async (e: any) => {
            const loaderCont = this.querySelector(".loader-cont");
            loaderCont.setAttribute("style", "display: initial");
            loaderCont.innerHTML = `
            <custom-loader> </custom-loader>
        `;

            const report = {
                petId: pet.id,
                petName: pet.name,
                fullName: form.name.value,
                phoneNumber: form.tel.value,
                description: form.description.value,
            };

            try {
                const reportSent = await state.sendReport(report);

                if (reportSent.error) {
                    Swal.fire({
                        icon: "error",
                        text: `${reportSent.error}. ${report.fullName}, agredecemos la información que intenta brindar acerca de ${report.petName}, pero la misma ya ha sido reportada.`,
                    });
                } else {
                    Swal.fire({
                        icon: "success",
                        text: `${report.fullName}, muchas gracias por reportar información acerca de ${report.petName}. Se le envió un mail al dueñx con la información dada por usted, tal vez sea contactado al teléfono que brindó.`,
                    });
                    div.remove();
                }
            } catch (error) {
                console.error(error);
            }
        });
    }

    render(pets?) {
        if (!pets) {
            this.innerHTML = `
    <custom-header> </custom-header>
    <div class="main-container">
      <div class="main-container">
        <h1 class="title"> Mascotas perdidas cerca tuyo </h1>
        <p class="text"> Para ver las mascotas reportadas cerca tuyo necesitamos permiso para conocer tu ubicación. </p>
        
        <custom-button type="btn btn-outline-primary" >Dar mi ubicación</custom-button>
        <span class="loader-cont"></span>
      </div>
     </div>
    `;
            this.addListenerGeoloc();
        }
        if (pets) {
            const petsString = pets.petsAround
                .map((pet) => {
                    return `<x-pet-card img=${pet.petImg} petId=${pet.id} petName="${pet.petName}" description="${pet.description}" loc="${pet.location}" type="report" > ${pet.petName} </x-pet-card>`;
                })
                .join("");

            this.innerHTML = `
      <custom-header> </custom-header>
      <div>
      <div class="welcome main-container">
      <h1>Mascotas perdidas cerca tuyo: ${pets.hits}</h1>
      <div class="pets-container">
        ${petsString}
      </div>
      </div>
    </div>
    `;
            this.addListenerPetReport();
        }
    }
}

customElements.define("x-home-page", HomePage);
