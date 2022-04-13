import { Router } from "@vaadin/router";
import { state } from "../state";
import * as map from "lodash/map";

class UserPets extends HTMLElement {
    async connectedCallback() {
        const { token } = state.getState().user;

        if (token) {
            const userPets = await state.getMyPets();
            if (userPets) {
                userPets.length > 0 ? this.render(userPets) : this.render();
            } else {
                this.render();
            }
        } else {
            Router.go("/login");
        }
    }

    addListener(container?) {
        map(container, (pet) => {
            pet.addEventListener("click", async (e) => {
                const id = pet.getAttribute("petId");
                state.setPetData({ id: parseInt(id) });
                Router.go("/pet-data");
            });
        });
    }

    render(pets?) {
        this.innerHTML = pets
            ? `
      
      <div>
      <custom-header> </custom-header>
      
      <h1 class="title">Mis mascotas reportadas</h1>
      <div class="sub-container">
        ${
            !pets
                ? `<h1 class="title">AUN NO REPORTASTE MASCOTAS PERDIDAS</h1>`
                : map(pets, (pet) => {
                      return `<x-pet-card img=${pet.petImg} petId=${pet.id} petName="${pet.petName}" description="${pet.description}" loc="${pet.location}" > ${pet.petName} </x-pet-card>
                
                <custom-button class="report-pet" type="btn btn-outline-success" petId=${pet.id} > Editar información sobre ${pet.petName} </custom-button>
                `;
                  }).join("")
        }
      </div>
      </div>
    `
            : `
      <custom-header> </custom-header>
      <div class="main-container">
       <h1 class="title">Mis mascotas reportadas</h1>
       <p class="subtitle">Aun no reportaste mascotas perdidas</p>
  
      </div>
    `;

        this.addListener(this.querySelectorAll(".report-pet"));
    }
}
customElements.define("x-user-pets-page", UserPets);
