import { DrawElement, GetFileExtension, ShowLoadingOverlay, ShowYesNoDialog } from "../misc/helpers.js";
import { app_state, createState, loadState, saveState, allPages, currentPageIndex, setAllPages, setCurrentPageIndex, setPageContainer } from "../state/app_state.js";
import { TokenizeDOM } from "../document/tokenization.js";
import { PaginateContent } from "../document/pagination.js";
import { RenderPages, ShowPage } from "./page_rendering.js";
import { DrawLevelsFAB, RenderLevelButtons } from "./levels.js";
import { Highlight, RenderHighlights } from "./highlighting.js";
import { UpdateHighlightButtonState, RefreshAllButtonStates } from "./levels.js";

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

    // Opcije container - u header-u
    const optionsContainer = DrawElement(headerContainer, "div", ["options-container"]);
    const optionsToolbar = DrawElement(optionsContainer, "div", ["options-toolbar"])
    
    // Zoom
    const zoomContainer = DrawElement(optionsToolbar, "div", ["zoom-container"])
    const zoomHeader = DrawElement(zoomContainer, "h3", ["zoom-header"], "Zoom: ");
    const zoomValue = DrawElement(zoomHeader, "span", ["zoom-value"], "100%");
    DrawElement(optionsContainer, "hr");
    
    // File input i ucitavanje prethodnog stanja
    const fileInputContainer = DrawElement(optionsToolbar, "div", ["file-input-container"]);
    const fileInput = DrawElement(fileInputContainer, "input", ["file-input"]);
    fileInput.type = "file";
    fileInput.accept = ".md, .html, .htm";
    fileInput.id = "file-upload";
    const fileInputLbl = DrawElement(fileInputContainer, "label", ["file-input-lbl"], "Open a file")
    fileInputLbl.setAttribute("for", "file-upload");
    
    const fileStateInput = DrawElement(fileInputContainer, "input", ["file-input"]);
    fileStateInput.type = "file";
    fileStateInput.accept = ".hljson";
    fileStateInput.id = "file-state-upload";
    const fileStateLoaderLbl = DrawElement(fileInputContainer, "label", ["file-input-lbl", "file-state-loader-btn", "hidden"], "Load progress")
    fileStateLoaderLbl.setAttribute("for", "file-state-upload");

    const fileStateSaveLbl = DrawElement(fileInputContainer, "label", ["file-input-lbl", "file-state-save-btn", "hidden"], "Save progress")
    fileStateSaveLbl.addEventListener("click", () => {
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
    
    prevBtn.addEventListener("click", () => {
        if (currentPageIndex > 0) {
            ShowPage(pageRendererContainer, currentPageIndex - 1);
            pageIndicator.textContent = `${currentPageIndex + 1} / ${allPages.length}`;
            RefreshAllButtonStates(mainContainer);
        }
    });
    nextBtn.addEventListener("click", () => {
        if (currentPageIndex < allPages.length - 1) {
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
    document.addEventListener("wheel", e=> {
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
        const file = fileInput.files[0];
        if (!file) 
            return;

        const extension = GetFileExtension(file.name);

        const fileName = file.name;

        if (extension === "md" || extension === "html") 
        {
            // Cuvanje prethodnog stanja
            if(app_state)
            {
                const decision = await ShowYesNoDialog("Do you want to save the current state?", "Yes", "No")
                if(decision)
                    saveState();
            }
            
            // Naziv file-a
            fileNameHeader.textContent = fileName;
            await DrawLevelsFAB(mainContainer);

            // Dugmici za stanja
            const stateLoaderLbl = mainContainer.querySelector(".file-state-loader-btn");
            if(stateLoaderLbl.classList.contains("hidden"))
                stateLoaderLbl.classList.toggle("hidden");

            const stateSaveBtn = mainContainer.querySelector(".file-state-save-btn");
            if(stateSaveBtn.classList.contains("hidden"))
                stateSaveBtn.classList.toggle("hidden");
            
            // Parsiranje ucitanog file-a u html ako je .md
            let rawHTML;
            if(extension === "md")
                rawHTML = marked.parse(await file.text())
            else
                rawHTML = await file.text();
            
            const parser = new DOMParser();
            const doc = parser.parseFromString(rawHTML, "text/html");
            const articleElement = doc.querySelector("#mw-content-text") || doc.body;
            articleElement.querySelectorAll("script, style, noscript").forEach(el => el.remove());
            
            // Tokenizacija html dokumenta dobijenog parsiranjem .md
            const tempContainer = document.createElement("div");
            tempContainer.innerHTML = articleElement.innerHTML;
            TokenizeDOM(tempContainer); //-Rezultat je 
            
            // Rezultat je lista 
            const pages = PaginateContent(tempContainer);

            //Kreiranje novog stanja
            createState(fileName, pages.length)

            //Rendering stranica
            RenderPages(pageContainer, pages);
            pageIndicator.textContent = `1 / ${pages.length}`
        } 
        else
        {
            alert("Unsupported file type selected!");
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
            console.log(app_state);

            DrawLevelsFAB(mainContainer);
            RenderHighlights(pageContainer);
        }
        else
        {
            alert("Unsupported file type selected!");
        }

    });


    // Level buttons handler // depricated

    const highlightBtns = document.querySelectorAll(".highlight-btn");
    for(let i = 0; i < highlightBtns.length; i++)
    {
        highlightBtns[i].addEventListener("click", async(e) => {
            const hideOverlay = ShowLoadingOverlay();

            try{
                await Hightlight(pageContainer, 10*(highlightBtns.length-i), i+1, highlightBtns[i]);
            }
            catch(e)
            {
                console.log(`Error highlighting:\n ${e.message()}`)
            }
            finally{
                hideOverlay();
            }
        });
    }
}

function ToggleCustomHighlight()
{
    customHighlightOn = !customHighlightOn;

    const activePage = document.querySelector(".active-page");
    const tokens = activePage.querySelectorAll(".token");

    tokens.forEach(t => {
        t.classList.toggle("token-highlight-mode", customHighlightOn);
    });

    if(customHighlightOn)
    {
        activePage.addEventListener("mouseup", HandleCustomHighlightSelection);
    }
    else
    {
        activePage.removeEventListener("mouseup", HandleCustomHighlightSelection);
        window.getSelection().removeAllRanges();
    }
}

function HandleCustomHighlightSelection()
{
    const selection = window.getSelection();
    if (selection.isCollapsed || selection.rangeCount === 0) 
        return;

    const range = selection.getRangeAt(0);
    const activePage = document.querySelector(".active-page");
    const tokens = activePage.querySelectorAll(".token");

    const cacheKey = `${currentPageIndex}-custom`;
    if (!levelHighlights[cacheKey]) levelHighlights[cacheKey] = new Set();

    tokens.forEach(span => {
        if (range.intersectsNode(span)) {
            const idx = parseInt(span.dataset.index, 10);

            if (levelHighlights[cacheKey].has(idx)) {
                levelHighlights[cacheKey].delete(idx);
                span.classList.remove("highlight-custom");
            } else {
                levelHighlights[cacheKey].add(idx);
                span.classList.add("highlight-custom");
            }

        }
    });
    
    levelActive[cacheKey] = true;
    selection.removeAllRanges();
    UpdateHighlightButtonState(document.querySelector(".level-custom"), cacheKey);
}

function ToggleCustomHighlightVisibility(pageContainer, button)
{
    const cacheKey = `${currentPageIndex}-custom`;

    if (levelHighlights[cacheKey] === undefined || levelHighlights[cacheKey].size === 0) {
        return;
    }

    levelActive[cacheKey] = !levelActive[cacheKey];
    const isActive = levelActive[cacheKey];
    const indexSet = levelHighlights[cacheKey];

    const activePaper = pageContainer.querySelectorAll(".paper")[currentPageIndex];
    const pageContentElement = activePaper.querySelector(".page-content");
    const pageTokens = pageContentElement.querySelectorAll(".token");

    pageTokens.forEach(span => {
        const idx = parseInt(span.dataset.index, 10);
        if (indexSet.has(idx)) {
            span.classList.toggle("highlight-custom", isActive);
        }
    });

    UpdateHighlightButtonState(button, cacheKey);
}

