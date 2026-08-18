import { app_state, currentPageIndex } from "../state/app_state.js";
import { UpdateHighlightButtonState } from "./levels.js";

export async function Highlight(pageContainer, percent, level, btn)
{
    const activePaper = pageContainer.querySelectorAll(".paper")[currentPageIndex];
    const pageContentElement = activePaper.querySelector(".page-content");
    const pageContentText = pageContentElement.textContent;

    try{
        // Moramo da proverimo da li je highlight tog levela
        // Za tu stranicu vec napravljen
        if(!app_state.isPageHighlightedForLevel(level, currentPageIndex))
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
            
            app_state.setPageIndicesForLevel(level, currentPageIndex, indices);
        }
        
        ToggleHighlightVisibility(pageContainer, level, btn)
    }
    catch(err)
    {
        alert(`Highlight failed! + ${err}`);
    }
}

export function ToggleHighlightVisibility(pageContainer, level, btn)
{
    const activePaper = pageContainer.querySelectorAll(".paper")[currentPageIndex];
    const pageContentElement = activePaper.querySelector(".page-content")
    app_state.toggleLevelForPage(level, currentPageIndex);
    const isActive = app_state.isLevelActiveForPage(level, currentPageIndex);
    const indexSet = new Set(app_state.getIndicesForPageAndLevel(level, currentPageIndex));

    const pageTokens = pageContentElement.querySelectorAll(".token");
    pageTokens.forEach((span, localIdx) => {
        if (indexSet.has(localIdx)) {
            span.classList.toggle(`highlight-${level}`, isActive);
        }
    }); 

    UpdateHighlightButtonState(btn, level, currentPageIndex);
}


export function RenderHighlights(pageContainer)
{
    for(let i = 0; i < app_state.pageCount; i++)
    {
        const activeLevels = app_state.getActiveLevelsForPage(i);
        // console.log(`Za stranicu ${i} aktivni su leveli:`);
        // console.log(`${activeLevels}`);
        const curPaper = pageContainer.querySelector(`.paper-${i}`)
        const pageContentElement = curPaper.querySelector(".page-content")
        activeLevels.forEach(l => {
            const indices = app_state.getIndicesForPageAndLevel(l, i)
            // console.log(`\tZa stranicu ${i} level ${l} indexi su:`);
            const indexSet = new Set(indices);
            // console.log(indexSet);
            const pageTokens = pageContentElement.querySelectorAll(".token");
            pageTokens.forEach((span, localIdx) => {
                if (indexSet.has(localIdx)) {
                    span.classList.toggle(`highlight-${l}`, true);
                }
            }); 
        });
    }
}
