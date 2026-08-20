import { loadCurrentTheme } from "./state/app_state.js";
import { DrawMainPage } from "./view/main_page.js";

async function RunApp()
{
    console.log(
        `
            Zavrsni rad
            -----------
            Autor: Ristovski Nikola
            Broj indeksa: 19347
            Mentor: Ivan Milentijevic & Oliver Vojinovic
            Godina: 2026.
            Mesto: Elektronski fakultet, Univerzitet u Nisu
            ------------------------------------------------
        `
    );
    
    // Kako bismo izbegli gubitak progress-a
    window.addEventListener("beforeunload", (e) => {
        e.preventDefault();
        e.returnValue = "";
    });

    const rootContainer = document.querySelector(".root");
    await DrawMainPage(rootContainer);
}

await RunApp();


