import { app_state, currentPageIndex, getHighlightColor, activeCustomLevel, maxHighlightLevels } from "../state/app_state.js";
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
            updateSpanBackground(span);
        }
    }); 

    UpdateHighlightButtonState(btn, level, currentPageIndex);
}

/* Custom highlight-ing */

export function HandleCustomHighlightSelection()
{
    const level = activeCustomLevel;
    const selection = window.getSelection();
    if (selection.isCollapsed || selection.rangeCount === 0) 
        return;

    const range = selection.getRangeAt(0);
    const activePage = document.querySelector(".active-page");
    const tokens = activePage.querySelectorAll(".token");
    const localIdxOffset = tokens[0].dataset.index;

    tokens.forEach(span => {
        if (range.intersectsNode(span)) {
            const idx = parseInt(span.dataset.index, 10) - localIdxOffset;

            if (app_state.toggleIndexForCustomHighlight(level, currentPageIndex, idx))
            {
                span.classList.remove(`highlight-${level}`);
                updateSpanBackground(span);
            }
            else
            {
                span.classList.add(`highlight-${level}`);
                updateSpanBackground(span);
            }
        }
    });
    
    app_state.activateLevelForPage(level, currentPageIndex);
    selection.removeAllRanges();
    UpdateHighlightButtonState(document.querySelector(`.highlight-level-${level}-btn`), level, currentPageIndex);
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
                    updateSpanBackground(span);
                }
            }); 
        });
    }
}

function updateSpanBackground(span) {
    const activeLevels = Array.from(span.classList)
        .filter(c => c.startsWith('highlight-'))
        .map(c => parseInt(c.split('-')[1]))
        .sort((a, b) => a - b);

    if (activeLevels.length === 0) {
        span.style.backgroundImage = 'none';
        span.style.backgroundSize = 'auto';
        return;
    }

    // Najveći level prvi -> nalazi se iza ostalih
    const backgrounds = [];
    const sizes = [];

    [...activeLevels]
        .sort((a, b) => b - a)
        .forEach(level => {
            const color = getHighlightColor(level);

            backgrounds.push(
                `linear-gradient(${color}, ${color})`
            );

            const height = 100 - (level-1) * 15;
            const width = 100 - (level * 2);

            sizes.push(`${width}% ${height}%`);
        });

    span.style.backgroundImage = backgrounds.join(', ');
    span.style.backgroundSize = sizes.join(', ');
    span.style.backgroundPosition = backgrounds
        .map(() => 'center')
        .join(', ');
    span.style.backgroundRepeat = 'no-repeat';
}

export function CreateHighlightStyles()
{
    for(let i = 1; i <= maxHighlightLevels; i++)
    {
        const style = document.createElement('style');

        style.innerHTML = `
            .highlight-${i} {
                color: #000000;
            }
        `;

        document.head.appendChild(style);
    };
}