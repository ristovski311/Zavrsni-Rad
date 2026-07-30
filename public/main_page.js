import { DrawElement, GetFileExtension, showLoadingOverlay } from "./helpers.js";

// Informacije
let currentText = "";
let levelHighlights = {};
let levelActive = {};    
let fileName = "No file opened."

let customHighlightOn = false;

function resetInfo()
{
    currentText = "";
    levelHighlights = {};
    levelActive = {};
}

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

    const zoomContainer = DrawElement(optionsToolbar, "div", ["zoom-container"])
    const zoomHeader = DrawElement(zoomContainer, "h3", ["zoom-header"], "Zoom: ");
    const zoomValue = DrawElement(zoomHeader, "span", ["zoom-value"], "100%");
    DrawElement(optionsContainer, "hr");
    

    // File input
    
    const fileInputContainer = DrawElement(optionsToolbar, "div", ["file-input-container"]);

    const fileInput = DrawElement(fileInputContainer, "input", ["file-input"]);
    fileInput.type = "file";
    fileInput.accept = ".md, .html, .htm";
    fileInput.id = "file-upload";
    const fileInputLbl = DrawElement(fileInputContainer, "label", ["file-input-lbl"], "Select a file")
    fileInputLbl.setAttribute("for", "file-upload");


    // Buttons za levele

    const levelsContainer = DrawElement(optionsToolbar, "div", ["levels-container"]);
    
    const customHighlightBtn = DrawElement(levelsContainer, "button", ["highlight-btn-custom", `level-custom`, "highlight-unhighlighted"], `Custom`)
    const customHighlightActiveBtn = DrawElement(levelsContainer, "button", ["highlight-btn-custom", `level-custom-active`, "highlight-custom-off"], `Off`)

    customHighlightActiveBtn.addEventListener("click", () => {
        ToggleCustomHighlight();

        const turningOn = customHighlightOn;
        customHighlightActiveBtn.classList.toggle("highlight-custom-on", turningOn);
        customHighlightActiveBtn.classList.toggle("highlight-custom-off", !turningOn);
        customHighlightActiveBtn.textContent = turningOn ? "On" : "Off";      
    });

    customHighlightBtn.addEventListener("click", () => {
        ToggleCustomHighlightVisibility(pageContainer, customHighlightBtn);
    })
    
    for(let i = 1; i <= 6; i++)
    {
        const hightlightButton = DrawElement(levelsContainer, "button", ["highlight-btn", `level-${i}`, "highlight-unhighlighted"], `Level ${i}`)
    }


    // Prikaz naziva trenutno otvorenog fajl-a

    const fileNameContainer = DrawElement(headerContainer, "div", ["file-name-container"]);
    const fileNameHeader = DrawElement(fileNameContainer, "h5", ["file-name-header"], fileName);


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
            RefreshAllButtonStates();
        }
    });
    nextBtn.addEventListener("click", () => {
        if (currentPageIndex < allPages.length - 1) {
            ShowPage(pageRendererContainer, currentPageIndex + 1);
            pageIndicator.textContent = `${currentPageIndex + 1} / ${allPages.length}`;
            RefreshAllButtonStates();
        }
    });
    DrawElement(pageViewContainer, "hr");
 

    // Sam prikaz papira

    const pageRendererContainer = DrawElement(pageViewContainer, "div", ["container", "page-renderer-container"]);
    const pageContainer = DrawElement(pageRendererContainer, "div", ["container", "page-container"]); 
    
    let paperZoom = 1;
    document.addEventListener("wheel", e=>{
        if(!e.ctrlKey)
            return;

        e.preventDefault();

        paperZoom += e.deltaY > 0 ? -0.07 : 0.07;
        paperZoom = Math.max(0.25, Math.min(2, paperZoom));

        pageContainer.style.transform = `scale(${paperZoom})`;

        zoomValue.innerText = `${(paperZoom*100).toFixed(0)}%`;
    }, {passive: false});
    
    const pageText = DrawElement(pageContainer, "p", ["page-text"]);
    

    // File input handler za odabir doc-a
    
    fileInput.addEventListener("change", async () => {
        const file = fileInput.files[0];
        if (!file) return;

        const extension = GetFileExtension(file.name);

        resetInfo();
        fileName = file.name;

        if (extension === "md") 
        {
            const rawHTML = marked.parse(await file.text())
            const parser = new DOMParser();
            const doc = parser.parseFromString(rawHTML, "text/html");
            const articleElement = doc.querySelector("#mw-content-text") || doc.body;
            articleElement.querySelectorAll("script, style, noscript").forEach(el => el.remove());

            const tempContainer = document.createElement("div");
            tempContainer.innerHTML = articleElement.innerHTML;
            TokenizeDOM(tempContainer);

            const pages = PaginateContent(tempContainer);
            RenderPages(pageContainer, pages);
            pageIndicator.textContent = `1 / ${pages.length}`

            fileNameHeader.textContent = fileName;
        } 
        else if (extension == "html")
        {
            const rawHTML = await file.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(rawHTML, "text/html");
            const articleElement = doc.querySelector("#mw-content-text") || doc.body;
            articleElement.querySelectorAll("script, style, noscript").forEach(el => el.remove());

            const tempContainer = document.createElement("div");
            tempContainer.innerHTML = articleElement.innerHTML;
            TokenizeDOM(tempContainer);

            const pages = PaginateContent(tempContainer);
            RenderPages(pageContainer, pages);
            pageIndicator.textContent = `1 / ${pages.length}`
            
            fileNameHeader.textContent = fileName;
        }
        else
        {
            pageText.innerText = `Unsupported file type: .${extension}`;
        }
    });


    // Level buttons handler

    const highlightBtns = document.querySelectorAll(".highlight-btn");
    for(let i = 0; i < highlightBtns.length; i++)
    {
        highlightBtns[i].addEventListener("click", async(e) => {
            const hideOverlay = showLoadingOverlay();

            try{
                await Hightlight(pageContainer, 10*(highlightBtns.length-i), i+1, highlightBtns[i]);
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

function UpdateHighlightButtonState(button, cacheKey)
{
    button.classList.remove("highlight-unhighlighted", "highlight-inactive", "highlight-active");

    if (levelHighlights[cacheKey] === undefined) {
        button.classList.add("highlight-unhighlighted"); // jos nije racunato za ovu stranicu
    } else if (levelActive[cacheKey]) {
        button.classList.add("highlight-active");         // izracunato I trenutno prikazano
    } else {
        button.classList.add("highlight-inactive");       // izracunato, ali trenutno skriveno
    }
}

function RefreshAllButtonStates()
{
    const highlightBtns = document.querySelectorAll(".highlight-btn");
    highlightBtns.forEach((btn, i) => {
        const level = i + 1;
        UpdateHighlightButtonState(btn, `${currentPageIndex}-${level}`);
    });

    UpdateHighlightButtonState(document.querySelector(".level-custom"), `${currentPageIndex}-custom`);
}


function TokenizeText(container, text)
{
    container.innerHTML = "";
    const parts = text.split(/(\s+)/);
    let index = 0;
    for(const part of parts)
    {
        if(part == "")
            continue;
        if(/^\s+$/.test(part))
        {
            const span = DrawElement(container, "span", ["token"], part);
            span.dataset.index = index;
        }
        else
        {
            const span = DrawElement(container, "span", ["token"], part);
            span.dataset.index = index;
            index++;
        }
    }
}

function TokenizeDOM(container)
{
    let index = 0;

    function walk(node)
    {
        const children = Array.from(node.childNodes);
        for(const child of children)
        {
            if(child.nodeType === Node.TEXT_NODE)
            {
                const text = child.textContent;
                if(text.trim() === "")
                    continue;

                const parts = text.split(/(\s+)/);
                const fragment = document.createDocumentFragment();

                for(const part of parts)
                {
                    if(part === "")
                        continue;
                    if(/^\s+$/.test(part))
                        fragment.appendChild(document.createTextNode(part));
                    else
                    {
                        const span = document.createElement("span");
                        span.classList.add("token");
                        span.dataset.index = index;
                        span.textContent = part;
                        fragment.appendChild(span);
                        index++;
                    }
                }
                child.replaceWith(fragment);
            }
            else if(child.nodeType === Node.ELEMENT_NODE)
            {
                if(child.tagName !== "IMG" && child.tagName != "BR")
                {
                    walk(child);
                }
            }
        }
    }

    walk(container);
}

function PaginateContent(sourceContainer) {
    const pages = [];
    let currentPage = document.createElement("div");
    currentPage.classList.add("page-content");

    // Privremeni "papir" wrapper, isti kao pravi, koristi se samo za merenje
    const measuringPaper = document.createElement("div");
    measuringPaper.classList.add("paper");
    measuringPaper.style.position = "absolute";
    measuringPaper.style.visibility = "hidden";
    measuringPaper.style.display = "block"; // .paper inače ima display:none dok nije .active-page
    document.body.appendChild(measuringPaper);

    const blocks = Array.from(sourceContainer.children);

    for (const block of blocks) {
        currentPage.appendChild(block);

        measuringPaper.appendChild(currentPage);
        const overflowing = currentPage.scrollHeight > currentPage.clientHeight;
        measuringPaper.removeChild(currentPage);

        if (overflowing) {
            currentPage.removeChild(block);
            pages.push(currentPage);

            currentPage = document.createElement("div");
            currentPage.classList.add("page-content");
            currentPage.appendChild(block);
        }
    }
    pages.push(currentPage);

    document.body.removeChild(measuringPaper); // očisti privremeni element
    return pages;
}

let allPages = [];
let currentPageIndex = 0;

function RenderPages(pageViewer, pages) {
    document.querySelector(".page-nav-container").classList.remove("hidden");
    
    pageViewer.innerHTML = "";
    allPages = pages;
    currentPageIndex = 0;

    pages.forEach((pageContent, i) => {
        const paper = document.createElement("div");
        paper.classList.add("paper");
        if (i === 0) 
            paper.classList.add("active-page");
        paper.appendChild(pageContent);
        pageViewer.appendChild(paper);
    });
}

function ShowPage(pageViewer, index) {
    const papers = pageViewer.querySelectorAll(".paper");
    papers.forEach(p => p.classList.remove("active-page"));
    papers[index].classList.add("active-page");
    currentPageIndex = index;
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

async function Hightlight(pageContainer, percent, level, btn)
{
    const activePaper = pageContainer.querySelectorAll(".paper")[currentPageIndex];
    const pageContentElement = activePaper.querySelector(".page-content");
    const pageContentText = pageContentElement.textContent;

    const cacheKey = `${currentPageIndex}-${level}`;

    try{
        if(levelHighlights[cacheKey] === undefined)
        {
            const response = await fetch("/api/highlight", {
                method : "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({text: pageContentText, percent})
            });
    
            if(!response.ok)
            {
                const err = await response.json();
                alert(`Response is not ok!: ${err.error}`);
                return;
            }
    
            const { indices } = await response.json();
            const indexSet = new Set(indices);

            levelHighlights[cacheKey] = new Set(indices);
        }
        
        levelActive[cacheKey] = !levelActive[cacheKey];
        const isActive = levelActive[cacheKey];
        const indexSet = levelHighlights[cacheKey];

        const pageTokens = pageContentElement.querySelectorAll(".token");
        pageTokens.forEach((span, localIdx) => {
            if (indexSet.has(localIdx)) {
                span.classList.toggle(`highlight-${level}`, isActive);
            }
        }); 

        UpdateHighlightButtonState(btn, cacheKey);
    }
    catch(err)
    {
        alert(`Highlight failed! + ${err.error}`);
    }
}

