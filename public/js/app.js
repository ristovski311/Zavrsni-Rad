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
    
    const rootContainer = document.querySelector(".root");
    await DrawMainPage(rootContainer);
}

await RunApp();


