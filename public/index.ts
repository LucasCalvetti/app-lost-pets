// Components
import "./components/header";
import "./components/pet-card";
import "./components/button";
import "./components/loader";

// Pages
import "./pages/home";
import "./pages/login";
import "./pages/user-data";
import "./pages/user-pets";
import "./pages/pet-data";

// Router
import "./router";

// State
import { state } from "./state";

function main() {
    state.initState();
}

main();
