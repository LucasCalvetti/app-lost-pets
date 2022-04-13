import Swal from "sweetalert2";

//const API_URL = "http://localhost:3004";
const API_URL = "https://pet-finder-app-apx.herokuapp.com";

const state = {
    data: {
        petData: {},
    },

    listeners: [],

    initState() {
        const cs = JSON.parse(localStorage.getItem("data")) || {
            user: {},
            petData: {},
        };
        this.setState(cs);
    },

    getState() {
        return this.data;
    },

    setState(newState) {
        this.data = newState;

        for (const cb of this.listeners) {
            cb();
        }
        localStorage.setItem("data", JSON.stringify(newState));
    },

    subscribe(cb: (any) => any) {
        this.listeners.push(cb);
    },

    async getPetsAround() {
        const { lat, lng } = this.getState()._geoloc;
        return await fetch(`${API_URL}/pets/around?lat=${lat}&lng=${lng}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        });
    },
    // Rehacer todo el proceso de signUp y logIn porque tengo que hacerlo basado en mis endpoints, y tmb todos los fetch tengo que modificar seguramente
    async createOrFindUser(userData: { fullName: string; email: string; password: string }) {
        const res = await (
            await fetch(API_URL + "/user", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ fullName: userData.fullName, email: userData.email, password: userData.password }),
            })
        ).json();

        if (!res.error) {
            const cs = this.getState();
            cs.user = res.user;
            cs.user.created = res.created;
            this.setState(cs);

            return await this.getToken(userData.email, userData.password);
        } else {
            return res.error;
        }
    },

    async getToken(email, password) {
        const cs = this.getState();
        const token = await (
            await fetch(API_URL + "/user/auth/token", {
                method: "POST",
                body: JSON.stringify({ email, password }),
                headers: {
                    "Content-Type": "application/json",
                },
            })
        ).json();

        if (token.access == true) {
            cs.user.token = token.token;
            this.setState(cs);
            return true;
        } else if (token.access == false) {
            return { error: "contraseña incorrecta." };
        }
    },

    async updateUser(data) {
        const cs = this.getState();

        const bodyToEndpoint = {
            fullName: data.name,
            password: data.password,
            email: cs.user.email,
        };

        const updated = await (
            await fetch(API_URL + "/user/profile", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `bearer ${cs.user.token}`,
                },
                body: JSON.stringify(bodyToEndpoint),
            })
        ).json();

        if (updated.usersUpdated.userUpdated.length === 1) {
            cs.user.fullName = updated.usersUpdated.user.fullName;
            this.setState(cs);

            return updated;
        } else if (updated.error || updated.usersUpdated.error || updated.authUpdated.error) {
            let error = updated.error;
            if (error == undefined) {
                error = updated.userUpdated.error;
            } else if (error == undefined) {
                error = updated.authUpdated.error;
            }
            return error;
        } else {
            return { error: "The user was not updated." };
        }
    },

    async checkMail(email: string) {
        return await (
            await fetch(API_URL + "/user/email?email=" + email, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            })
        ).json();
    },

    saveMail(email: string) {
        const cs = this.getState();
        cs.user = { email };
        this.setState(cs);
    },

    async sendReport(report) {
        const cs = this.getState();

        const res = await (
            await fetch(`${API_URL}/user/pet/report`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `bearer ${cs.user.token}`,
                },
                body: JSON.stringify({
                    fullName: report.fullName,
                    phoneNumber: report.phoneNumber,
                    description: report.description,
                    petId: report.petId,
                }),
            })
        ).json();

        return res;
    },

    async getReports() {
        const cs = this.getState();
        return await (
            await fetch(API_URL + `/me/report`, {
                method: "GET",
                headers: {
                    Authorization: `bearer ${cs.user.token}`,
                },
            })
        ).json();
    },

    async getMyPets() {
        const cs = this.getState();

        const userPets = await (
            await fetch(API_URL + `/user/pet`, {
                method: "GET",
                headers: {
                    Authorization: `bearer ${cs.user.token}`,
                },
            })
        ).json();

        if (userPets.error) {
            cs.myPets = "Este usuario todavía NO tiene pets reportadas";
            this.setState(cs);
        } else {
            cs.myPets = userPets;
            this.setState(cs);
        }

        return userPets;
    },

    async logOut() {
        const cs = this.getState();
        cs.user = {};
        this.setState(cs);
    },

    async getPetData() {
        const cs = this.getState();

        const petData = await (await fetch(`${API_URL}/user/pet/${cs.petData.id}`)).json();
        if (petData.error) {
            Swal.fire({
                icon: "error",
                title: `${petData.error}`,
            });
        } else {
            cs.petData = petData;
            this.setState(cs);
            return cs.petData;
        }
    },

    setPetData(petData) {
        const cs = this.getState();
        cs.petData = petData;
        this.setState(cs);
    },

    setPetGeoloc(geoloc: { lat: number; lng: number }) {
        const cs = this.getState();
        cs.petData.lat = geoloc.lat;
        cs.petData.lng = geoloc.lng;
        this.setState(cs);
    },

    setpetImg(petImg) {
        const cs = this.getState();
        cs.petImg = petImg;
        this.setState(cs);
    },

    // Agregar description y barrio
    async editPet({ petId, petName, location, description, petImg }) {
        const cs = this.getState();
        const lat = cs.petData.lat;
        const lng = cs.petData.lng;

        const bodyToEndpoint = {
            petName,
            petImg,
            lat,
            lng,
            location,
            description,
        };

        const petEdited = await (
            await fetch(API_URL + `/user/pet/${petId}`, {
                method: "PATCH",
                headers: {
                    Authorization: `bearer ${cs.user.token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(bodyToEndpoint),
            })
        ).json();

        // Reset petData
        cs.petData = {};
        this.setState(cs);

        return petEdited;
    },

    // Agregar description y barrio
    async createPet({ petName, location, description }) {
        const cs = this.getState();
        const lat = cs.petData.lat;
        const lng = cs.petData.lng;
        const petImg = cs.petImg;

        const newPet = await (
            await fetch(API_URL + `/user/pet`, {
                method: "POST",
                headers: {
                    Authorization: `bearer ${cs.user.token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    petName,
                    petImg,
                    lat,
                    lng,
                    description,
                    location,
                }),
            })
        ).json();

        return newPet;
    },

    async petFound(id) {
        const cs = this.getState();

        const petEdited = await (
            await fetch(API_URL + `/user/pet/${id}`, {
                method: "DELETE",
                headers: {
                    Authorization: `bearer ${cs.user.token}`,
                },
            })
        ).json();
        if (petEdited.deletedPet == 1 || petEdited.error) {
            cs.petData = {};
            this.setState(cs);
        }
        return petEdited;
    },
};

export { state };
