import { Router } from "@vaadin/router";
import { state } from "../state";
import Swal from "sweetalert2";
import { debuglog } from "util";

class Login extends HTMLElement {
    connectedCallback() {
        this.render();
    }

    render() {
        this.innerHTML = `
    <custom-header> </custom-header>
    <div class="main-container">
        <form class="login">
        <h1>Ingresar</h1>
        <label>
        <span>EMAIL</span>
        <input type="email" name="email" required >
        </label>
        <custom-button type="btn btn-outline-primary"> Siguiente </custom-button>
        
        <span class="loader-cont">  </span>
        </form>
    </div>
    `;

        const form: any = this.querySelector(".login");
        form.querySelector("custom-button").addEventListener("buttonClicked", async (e) => {
            const email = form.email.value;
            const exist = await state.checkMail(email);

            const loaderCont = this.querySelector(".loader-cont");
            loaderCont.setAttribute("style", "display: flex");
            loaderCont.innerHTML = `
            <custom-loader> </custom-loader>
        `;

            try {
                if (exist == true) {
                    this.renderPass(email);
                }
                if (exist == false) {
                    state.saveMail(email);
                    Router.go("/user-data");
                }
            } catch (error) {
                console.error(error);
            }
        });

        form.addEventListener("submit", async (e) => {
            e.preventDefault();
            const email = form.email.value;
            const { exist } = await state.checkMail(email);

            const loaderCont = this.querySelector(".loader-cont");
            loaderCont.setAttribute("style", "display: flex");
            loaderCont.innerHTML = `
        <custom-loader> </custom-loader>
        `;

            try {
                if (exist.exist == true) {
                    this.renderPass(email);
                }
                if (exist.exist == false) {
                    state.saveMail(email);
                    Router.go("/user-data");
                }
            } catch (error) {
                console.error(error);
            }
        });
    }

    renderPass(email) {
        this.innerHTML = `
    <custom-header> </custom-header>
    <div class="main-container">  
    <form class="login">
        <h1>Ingresar</h1>
        <label>
        <span>CONTRASEÑA</span>
        <input type="password" name="password" required>
        </label>
        <custom-button type="btn btn-outline-primary"> Ingresar </custom-button>
        <span class="loader-cont">  </span>
    </form>
    </div>
    `;

        const form: any = this.querySelector(".login");
        form.querySelector("custom-button").addEventListener("buttonClicked", async (e: any) => {
            e.preventDefault();
            const userData = { email, password: form.password.value };

            const loaderCont = this.querySelector(".loader-cont");
            loaderCont.setAttribute("style", "display: flex");
            loaderCont.innerHTML = `
        <custom-loader> </custom-loader>
        `;

            const res = await state.createOrFindUser(userData as any);

            if (res.error) {
                loaderCont.setAttribute("style", "display: none");
                Swal.fire({
                    text: `La contraseña ingresada NO es correcta.`,
                });
            } else {
                Swal.fire({
                    icon: "success",
                    title: "Bienvenidx!",
                });
                Router.go("/user-data");
            }
        });

        form.addEventListener("submit", async (e: any) => {
            e.preventDefault();
            const userData = { email, password: form.password.value };

            const loaderCont = this.querySelector(".loader-cont");
            loaderCont.setAttribute("style", "display: flex");
            loaderCont.innerHTML = `
        <custom-loader> </custom-loader>
        `;

            const res = await state.createOrFindUser(userData as any);

            if (res.error) {
                Swal.fire({
                    text: `La contraseña ingresada NO es correcta.`,
                });
            } else {
                Swal.fire({
                    icon: "success",
                    title: "Bienvenidx!",
                });
                Router.go("/user-data");
            }
        });
    }
}
customElements.define("custom-login-page", Login);
