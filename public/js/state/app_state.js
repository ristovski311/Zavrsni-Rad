import { HighlightManager } from "../model/highlight_manager.js";
import { CreateHighlightColorsForLevels } from "../view/highlighting.js";

export let app_state;
export let allPages = [];
export let currentPageIndex = 0;
export let pageContainer;
export let currentObjectURLs = [];
export let activeCustomLevel = null;
export let currentTheme = localStorage.getItem("theme") ?? "default";
export let testNumQ = 4;
export let testNumA = 3;
export let highlightColors = {};
loadCurrentTheme();    
CreateHighlightColorsForLevels();
console.log(highlightColors);

export function setHighlightColor(level, color)
{
    highlightColors[level] = color;
}

export function getHighlightColor(level)
{
    return highlightColors[level];
}

export function isCustomHighlightActive()
{
    return activeCustomLevel;
}

export function setActiveCustomLevel(level)
{
    if(activeCustomLevel === level)
        activeCustomLevel = null;
    else
        activeCustomLevel = level;
}

export function setCurrentTheme(theme)
{
    currentTheme = theme;
    localStorage.setItem("theme", theme); 
}

export function loadCurrentTheme()
{
    document.documentElement.dataset.theme = currentTheme;
}

export function setCurrentObjectURLs(urls)
{
    currentObjectURLs = urls;
}

export function revokeCurrentObjectURLs()
{
    for(const url of currentObjectURLs)
        URL.revokeObjectURL(url);

    currentObjectURLs = [];
}

export function setPageContainer(container)
{
    pageContainer = container;
}

export function setAllPages(pages)
{
    allPages = pages;
}

export function setCurrentPageIndex(index)
{
    currentPageIndex = index;
}

export function createState(filename, pageCount)
{
    app_state = new HighlightManager(pageCount, filename);
}

export function loadState(json_obj)
{
    app_state = HighlightManager.fromJSON(json_obj);
}

export function saveState()
{
    if(!app_state)
        return;

    const json_obj = JSON.stringify(app_state, null, 2);
    const blob = new Blob([json_obj], {
        type: "application/json"
    });

    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `${app_state.fileName}.hljson`;

    a.click();

    URL.revokeObjectURL(url);
}
