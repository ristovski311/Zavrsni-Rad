import { DrawElement, GetFileExtension, ShowYesNoDialog, AddShortcut, ShowLoadingOverlay } from "../misc/helpers.js";
import { app_state, createState, loadState, saveState, allPages, currentPageIndex, setPageContainer, setCurrentObjectURLs, revokeCurrentObjectURLs, activeCustomLevel } from "../state/app_state.js";
import { TokenizeDOM } from "../document/tokenization.js";
import { PaginateContent } from "../document/pagination.js";
import { OpenPageSelectionModal, RenderPages, ShowPage } from "./page_rendering.js";
import { DrawLevelsFAB, ToggleCustomHighlight } from "./levels.js";
import { RenderHighlights } from "./highlighting.js";
import { RefreshAllButtonStates,RefreshAllEditButtonStates } from "./levels.js";
import { OpenInformationModal, OpenThemeSelectModal, ResolveLocalResources } from "../document/utility.js";
import { OpenTestingModal } from "../testing/test.js";

let customHighlightOn = false;

export async function DrawMainPage(container)
{
    //Header i glavni container
    const mainContainer = DrawElement(container, "div", ["main-container"]);

    //Header container
    const headerContainer = DrawElement(mainContainer, "div", ["header-container"]);
    const mainHeaderContainer = DrawElement(headerContainer, "div", ["main-header-container"]);
    const mainHeader = DrawElement(mainHeaderContainer, "h1", ["main-header", "header"], "Highlighter");
    const subHeader = DrawElement(mainHeader, "span", ["sub-header", "header"], "prototype");

    // Options toolbar - u header-u
    const optionsContainer = DrawElement(headerContainer, "div", ["options-container"]);
    const optionsToolbar = DrawElement(optionsContainer, "div", ["options-toolbar"])
    
    // Customization container
    const customizationContainer = DrawElement(optionsToolbar, "div", ["customization-container"])
    
    // Testing - sakrivena opcija dok se ne pritisne shortcut SHIFT + T
    const testButton = DrawElement(customizationContainer, "button", ["testing-button", "toolbar-element", "hidden"], "Test your knowledge");
    testButton.addEventListener("click", () => {
        OpenTestingModal(mainContainer);
    });

    //Shortcut SHIFT + T
    // AddShortcut(document, {shift: true, key: "t"}, () => {
    //     if(app_state)
    //         testButton.classList.remove("hidden");
    // });

    // About app
    const aboutButton = DrawElement(customizationContainer, "button", ["about-button", "toolbar-element"], "About app");
    aboutButton.addEventListener("click", () => {
        const aboutText = `
                            Highlighter
                            
                            Creator: Nikola Ristovski [index: 19347]
                            Reason behind: Bachelor's thesis (Capstone Project)
                            Place: Faculty of Electronic Engineering, University of Nis
                            Date: July - September 2026.
                            Mentors: Ivan Milentijevic, Oliver Vojinovic
                        `
        OpenInformationModal(mainContainer, aboutText);
    });


    // Zoom
    const zoomHeader = DrawElement(customizationContainer, "label", ["zoom-header", "toolbar-element"], "Zoom: ");
    const zoomValue = DrawElement(zoomHeader, "span", ["zoom-value"], "100%");
    DrawElement(optionsContainer, "hr"); 

    // Theme
    const themeButton = DrawElement(customizationContainer, "button", ["theme-button", "toolbar-element"], "Theme");
    themeButton.addEventListener("click", () => {
        OpenThemeSelectModal(mainContainer);
    });
    
    // File input i ucitavanje prethodnog stanja
    const fileInputContainer = DrawElement(optionsToolbar, "div", ["file-input-container"]);
    const fileInput = DrawElement(fileInputContainer, "input", ["file-input"]);
    fileInput.type = "file";
    fileInput.webkitdirectory = true;
    fileInput.directory = true;
    fileInput.multiple = true;
    fileInput.id = "file-upload";
    const fileInputLbl = DrawElement(fileInputContainer, "label", ["file-input-lbl", "toolbar-element"], "Open a file")
    fileInputLbl.setAttribute("for", "file-upload");
    
    const fileStateInput = DrawElement(fileInputContainer, "input", ["file-input"]);
    fileStateInput.type = "file";
    fileStateInput.accept = ".hljson";
    fileStateInput.id = "file-state-upload";
    const fileStateLoaderLbl = DrawElement(fileInputContainer, "label", ["file-input-lbl", "file-state-loader-btn", "toolbar-element", "hidden"], "Load progress")
    fileStateLoaderLbl.setAttribute("for", "file-state-upload");

    const fileStateSaveLbl = DrawElement(fileInputContainer, "label", ["file-input-lbl", "file-state-save-btn", "toolbar-element", "hidden"], "Save progress")
    fileStateSaveLbl.addEventListener("click", async () => {
        const decision = await ShowYesNoDialog("Do you want to save the current state?", "Yes", "No")
                if(decision)
                    saveState();
    })

    // Prikaz naziva trenutno otvorenog fajl-a

    const fileNameContainer = DrawElement(headerContainer, "div", ["file-name-container"]);
    const fileNameHeader = DrawElement(fileNameContainer, "h2", ["file-name-header"], app_state ? app_state.fileName : "No file opened.");
    

    // Container za page

    const pageViewContainer = DrawElement(mainContainer, "div", ["page-view-container"]);
    
    // Prev/next page buttons
    
    const pageNavContainer = DrawElement(pageViewContainer, "div", ["page-nav-container", "hidden"]);
    const prevBtn = DrawElement(pageNavContainer, "button", ["nav-btn"], "◀");
    const pageIndicator = DrawElement(pageNavContainer, "span", ["page-indicator"], "1 / 1");
    const nextBtn = DrawElement(pageNavContainer, "button", ["nav-btn"], "▶");

    pageIndicator.addEventListener("click", async () => {
        const res = await OpenPageSelectionModal(mainContainer, pageViewContainer);
        if(res)
        {
            pageIndicator.textContent = `${currentPageIndex + 1} / ${allPages.length}`;
            RefreshAllButtonStates(mainContainer);
        }

    })
    prevBtn.addEventListener("click", () => {
        if (currentPageIndex > 0) {
            ToggleCustomHighlight(activeCustomLevel);
            RefreshAllEditButtonStates(mainContainer);
            ShowPage(pageRendererContainer, currentPageIndex - 1);
            pageIndicator.textContent = `${currentPageIndex + 1} / ${allPages.length}`;
            RefreshAllButtonStates(mainContainer);
        }
    });
    nextBtn.addEventListener("click", () => {
        if (currentPageIndex < allPages.length - 1) {
            ToggleCustomHighlight(activeCustomLevel);
            RefreshAllEditButtonStates(mainContainer);
            ShowPage(pageRendererContainer, currentPageIndex + 1);
            pageIndicator.textContent = `${currentPageIndex + 1} / ${allPages.length}`;
            RefreshAllButtonStates(mainContainer);
        }
    });
    DrawElement(pageViewContainer, "hr");
    
    
    // Sam prikaz papira
    
    const pageRendererContainer = DrawElement(pageViewContainer, "div", ["container", "page-renderer-container"]);
    const pageContainer = DrawElement(pageRendererContainer, "div", ["container", "page-container"]); 
    setPageContainer(pageContainer);    
    const pageWelcomePaper = DrawElement(pageContainer, "div", ["paper", "active-page"]);
    const pageWelcomeContentContainer = DrawElement(pageWelcomePaper, "div", ["page-content"])
    const pageLogoImg = DrawElement(pageWelcomeContentContainer, "img", ["page-welcome-logo"]);
    pageLogoImg.src = "../assets/images/logo.png"
    pageLogoImg.alt = "Logo image."
    const pageWelcomeHeaderMain = DrawElement(pageWelcomeContentContainer, "h1", ["page-welcome-main-header"], "Try opening a file!")
    const pageWelcomeHeaderSub = DrawElement(pageWelcomeContentContainer, "h2", ["page-welcome-sub-header"], "You can open one using 'Open a file' button in the toolbar.")
    
    let paperZoom = 1;
    document.addEventListener("wheel", e => {
        if(!e.ctrlKey)
            return;

        e.preventDefault();

        paperZoom += e.deltaY > 0 ? -0.07 : 0.07;
        paperZoom = Math.max(0.25, Math.min(2, paperZoom));

        pageContainer.style.transform = `scale(${paperZoom})`;

        zoomValue.innerText = `${(paperZoom*100).toFixed(0)}%`;
    }, {passive: false});
    

    // File input handler za odabir doc-a i state-a

    fileInput.addEventListener("change", async () => {
        let hideOverlay;

        try
        {

            const files = Array.from(fileInput.files);
            if(files.length === 0)
                return;
    
            const contentFile = files.find(f => {
                const extension = GetFileExtension(f.name);
                return extension === "htm" || extension === "html" || extension === "md";
            });
    
            const stateFile = files.find(f => {
                const extension = GetFileExtension(f.name);
                return extension === "hljson";
            });
            
            if(!contentFile)
            {
                alert("No HTML or MD file found!");
                return;
            }
            
            const extension = GetFileExtension(contentFile.name);
            const fileName = contentFile.name;
            if (extension === "md" || extension === "html" || extension === "htm") 
            {
                // Cuvanje prethodnog stanja
                if(app_state)
                {
                    const decision = await ShowYesNoDialog("Do you want to save the current state?", "Yes", "No")
                    if(decision)
                        saveState();
                }
                
                hideOverlay = await ShowLoadingOverlay();

                revokeCurrentObjectURLs();
    
                // Parsiranje ucitanog file-a u html ako je .md
                let rawHTML;
                if(extension === "md")
                    rawHTML = marked.parse(await contentFile.text())
                else
                    rawHTML = await contentFile.text();
                
                const parser = new DOMParser();
                const doc = parser.parseFromString(rawHTML, "text/html");
                
                //Resavanje lokalnih image-a
                const urls = ResolveLocalResources(doc, contentFile, files);
                setCurrentObjectURLs(urls);
    
                // const articleElement = doc.querySelector("#mw-content-text") || doc.body;
                const articleElement = doc.querySelector("#mw-content-text")
                                    || doc.querySelector("article")
                                    || doc.querySelector("main")
                                    || doc.querySelector(".entry-content")
                                    || doc.querySelector(".post-content")
                                    || doc.querySelector("#content")
                                    || doc.body;
                articleElement.querySelectorAll("script, style, noscript").forEach(el => el.remove());
                
                // Tokenizacija html dokumenta dobijenog parsiranjem .md
                const tempContainer = document.createElement("div");
                tempContainer.innerHTML = articleElement.innerHTML;
                TokenizeDOM(tempContainer);
                
                // Rezultat je lista 
                const pages = await PaginateContent(tempContainer);
                
                //Kreiranje novog stanja
                createState(fileName, pages.length)
                
                //Rendering stranica
                await RenderPages(pageContainer, pages);
                pageIndicator.textContent = `1 / ${pages.length}`
                
                // Dugmici za stanja
                const stateLoaderLbl = mainContainer.querySelector(".file-state-loader-btn");
                if(stateLoaderLbl.classList.contains("hidden"))
                    stateLoaderLbl.classList.toggle("hidden");
                
                const stateSaveBtn = mainContainer.querySelector(".file-state-save-btn");
                if(stateSaveBtn.classList.contains("hidden"))
                    stateSaveBtn.classList.toggle("hidden");
    
                if(testButton.classList.contains("hidden"))
                    testButton.classList.remove("hidden");
                
                // Naziv file-a
                fileNameHeader.textContent = fileName;
                await DrawLevelsFAB(mainContainer);
    
                //Load prethodnog stanja ako ga je bilo u direktorijumu
                if(stateFile)
                {
                    const fileText = await stateFile.text();
                    const jsonObj = JSON.parse(fileText);
                    loadState(jsonObj);
                    DrawLevelsFAB(mainContainer);
                    RenderHighlights(pageContainer);
                }
            } 
            else
            {
                alert("Unsupported file type selected!");
            }
        }
        finally
        {
            if(hideOverlay)
                hideOverlay();
        }
    });

    fileStateInput.addEventListener("change", async () => {
        const file = fileStateInput.files[0];
        if(!file)
            return;

        const extension = GetFileExtension(file.name);
        if(extension === "hljson")
        {
            const fileText = await file.text();
            const jsonObj = JSON.parse(fileText);
            loadState(jsonObj);
            DrawLevelsFAB(mainContainer);
            RenderHighlights(pageContainer);
        }
        else
        {
            alert("Unsupported file type selected!");
        }
    });
}