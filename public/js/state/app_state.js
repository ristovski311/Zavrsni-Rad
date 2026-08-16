import { HighlightManager } from "../model/highlight_manager.js";

export let app_state;
export let allPages = [];
export let currentPageIndex = 0;
export let pageContainer;

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