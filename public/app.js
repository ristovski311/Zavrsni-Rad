import { DrawMainPage } from "./main_page.js";

async function RunApp()
{
    console.log("Hello world!");
    
    const rootContainer = document.querySelector(".root");
    await DrawMainPage(rootContainer);
}

await RunApp();


