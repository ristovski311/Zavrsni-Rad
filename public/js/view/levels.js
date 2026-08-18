import { activeCustomLevel, app_state, currentPageIndex, isCustomHighlightActive, pageContainer,setActiveCustomLevel } from "../state/app_state.js";
import { DrawElement, ShowLoadingOverlay } from "../misc/helpers.js";
import { Highlight, ToggleHighlightVisibility } from "./highlighting.js";

export async function DrawLevelsFAB(container)
{
    // Kreiranje novog nivoa highlight-a i lista postojecih nivoa
    const existingFAB = container.querySelector(".levels-fab-container");
    if(existingFAB)
        existingFAB.remove();

    const levelsFABContainer = DrawElement(container, "div", ["levels-fab-container"]);
    const createLevelBtn = DrawElement(levelsFABContainer, "button", ["create-level-btn"], "+ New level")
    const expandLevelsBtn = DrawElement(levelsFABContainer, "button", ["expand-levels-btn"])
    expandLevelsBtn.innerText = "⏶⏶⏶\nLevels";
    const highlightLevelsContainer = DrawElement(levelsFABContainer, "div", ["highlight-levels-container", "no-height"])
    expandLevelsBtn.addEventListener("click", () => {
        if(expandLevelsBtn.innerText === "⏶⏶⏶\nLevels")
            expandLevelsBtn.innerText = "Levels\n⏷⏷⏷"
        else
            expandLevelsBtn.innerText = "⏶⏶⏶\nLevels"
        highlightLevelsContainer.classList.toggle("no-height");
    })

    createLevelBtn.addEventListener("click", async () => {
        if(app_state)
        {
            const res = await OpenCreateLevelModal(container);
            if(res)
                RenderLevelButtons(highlightLevelsContainer);
            if(highlightLevelsContainer.classList.contains("no-height"))
                expandLevelsBtn.click();
        }
    })
    if(app_state)
        RenderLevelButtons(highlightLevelsContainer);
    // if(app_state)
    //     RenderLevelButtons(highlightLevelsContainer);

    // for(let i = 1; i <= 26; i++)
    // {
    //     const hightlightButton = DrawElement(highlightLevelsContainer, "button", ["highlight-btn", `level-${i}`, "highlight-unhighlighted"], `Level ${i}`)
    // }
    
    // const customHighlightBtn = DrawElement(highlightLevelsContainer, "button", ["highlight-btn-custom", `level-custom`, "highlight-unhighlighted"], `Custom`)
    // const customHighlightActiveBtn = DrawElement(highlightLevelsContainer, "button", ["highlight-btn-custom", `level-custom-active`, "highlight-custom-off"], `Off`)

    // customHighlightActiveBtn.addEventListener("click", () => {
    //     ToggleCustomHighlight();

    //     const turningOn = customHighlightOn;
    //     customHighlightActiveBtn.classList.toggle("highlight-custom-on", turningOn);
    //     customHighlightActiveBtn.classList.toggle("highlight-custom-off", !turningOn);
    //     customHighlightActiveBtn.textContent = turningOn ? "On" : "Off";      
    // });

    // customHighlightBtn.addEventListener("click", () => {
    //     ToggleCustomHighlightVisibility(pageContainer, customHighlightBtn);
    // })
}

function OpenCreateLevelModal(container)
{
    return new Promise(
        resolve => {
            const overlay = document.createElement("div");
            overlay.className = "overlay";
            
            const modalContainer = DrawElement(overlay, "div", ["modal-container"]);
            const modalTextContainer = DrawElement(modalContainer, "div", ["modal-text-container"]);
            const modalText = DrawElement(modalTextContainer, "h2", ["modal-text"], "Create new highlight level")
            
            const modalFormContainer = DrawElement(modalContainer, "div", ["modal-form-container"]);
            const modalForm = DrawElement(modalFormContainer, "form", ["modal-form"]);
            
            const newLevelCount = app_state.getCurrentLevelCount() + 1;

            const formLevelLblContainer = DrawElement(modalForm, "div", ["modal-form-group-container"])
            const formLevelLbl = DrawElement(formLevelLblContainer, "label", ["form-level-lbl"], "Level");
            const formLevelInput = DrawElement(formLevelLblContainer, "input", ["form-level-input", "modal-input"]);
            formLevelInput.type = "text";
            formLevelInput.disabled = true;
            formLevelInput.value = newLevelCount;
            
            const formTypeLblContainer = DrawElement(modalForm, "div", ["modal-form-group-container"])
            const formTypeLbl = DrawElement(formTypeLblContainer, "label", ["form-type-lbl"], "Type");
            
            const formTypeRadioAILbl = DrawElement(formTypeLblContainer, "label", ["custom-form-type-radio", "custom-form-type-radio-selected"], "AI");
            const formTypeRadioAI = DrawElement(formTypeRadioAILbl, "input", ["form-type-radio"]);
            
            const formTypeRadioCustomLbl = DrawElement(formTypeLblContainer, "label", ["custom-form-type-radio"], "Custom");
            const formTypeRadioCustom = DrawElement(formTypeRadioCustomLbl, "input", ["form-type-radio"]);
            
            formTypeRadioAI.type = "radio";
            formTypeRadioAI.id = "highlightTypeAI";
            formTypeRadioAI.name = "highlightType"
            formTypeRadioAI.value = "AI"
            formTypeRadioAI.checked = true;
            formTypeRadioAI.addEventListener("change", () => {
                modalForm.querySelector(".modal-form-percent-container").style.display = "flex";
            })

            formTypeRadioCustom.type = "radio";
            formTypeRadioCustom.id = "highlightTypeCustom";
            formTypeRadioCustom.name = "highlightType"
            formTypeRadioCustom.value = "Custom"
            formTypeRadioCustom.addEventListener("change", () => {
                modalForm.querySelector(".modal-form-percent-container").style.display = "none";
            })

            formTypeLblContainer.addEventListener("change", () => {
                formTypeLblContainer.querySelectorAll(".custom-form-type-radio").forEach(lbl => {
                    lbl.classList.remove("custom-form-type-radio-selected");
                });
                const checkedInput = formTypeLblContainer.querySelector("input[name='highlightType']:checked");
                if (checkedInput) {
                    checkedInput.parentElement.classList.add("custom-form-type-radio-selected");
                }
            })
            
            const formPercentContainer = DrawElement(modalForm, "div", ["modal-form-group-container", "modal-form-percent-container"])
            const formPercentLbl = DrawElement(formPercentContainer, "label", ["form-percent-lbl"], "% of text");
            const formPercentInput = DrawElement(formPercentContainer, "input", ["form-percent-input", "modal-input"]);
            formPercentInput.type = "number";
            formPercentInput.value = 50;
            formPercentInput.min = 1;
            formPercentInput.max = 100;

            const modalBtnContainer = DrawElement(modalContainer, "div", ["modal-btn-container"]);
            const modalBtnConfirm = DrawElement(modalBtnContainer, "button", ["modal-btn-confirm"], "Create");
            const modalBtnCancel = DrawElement(modalBtnContainer, "button", ["modal-btn-cancel"], "Cancel");
        

            modalBtnConfirm.addEventListener("click", () =>
            {
                app_state.addLevel(newLevelCount, formTypeRadioAI.checked ? "ai" : "custom", formTypeRadioAI.checked ? formPercentInput.value : null)
                
                overlay.remove();
                resolve(true);
            })
        
            modalBtnCancel.addEventListener("click", () =>
            {
                overlay.remove();
                resolve(false);
            })

            document.body.appendChild(overlay);
        }
    )
}

export function RenderLevelButtons(container)
{
    container.innerHTML = "";

    const levels = app_state.levels
    levels.forEach(l => {
        const btn = DrawLevelButton(container, l.level, l.type, l.percent);
        UpdateHighlightButtonState(btn, l.level, currentPageIndex)
    });
}

function DrawLevelButton(container, level, type, percent)
{
    let btnContainer = DrawElement(container, "div", ["highlight-level-btn-container"]);
    let levelButton = DrawElement(btnContainer, "button", ["highlight-level-btn", `higlight-type-${type}`, `highlight-level-${level}-btn`, "highlight-unhighlighted"]);
    levelButton.dataset.level = level;
    if(type === "ai")
    {
        levelButton.addEventListener("click", async (e) => {
            const hideOverlay = ShowLoadingOverlay();
            try{
                await Highlight(pageContainer, percent, level, levelButton);
            }
            finally
            {
                hideOverlay();
            }
        })
    }
    else
    {
        levelButton.addEventListener("click", async (e) => {
            ToggleHighlightVisibility(pageContainer, level, levelButton);
        })
    }

    let levelInfoContainer = DrawElement(levelButton, "div", ["level-info-container"])
    let levelInfoHeader = DrawElement(levelInfoContainer, "p", ["level-info-header"], `LVL ${level}`)
    let infoTypeText = `${type.toUpperCase()}`
    if(type === "ai")
        infoTypeText += ` [${percent}%]`;
    let levelInfoType = DrawElement(levelInfoContainer, "p", ["level-info-type"], infoTypeText)
    if(type === "custom")
    {
        let levelCustomEditBtn = DrawElement(btnContainer, "button", ["highlight-edit-btn", `highlight-edit-${level}-btn`], "✎");
        levelCustomEditBtn.dataset.level = level;
        levelCustomEditBtn.addEventListener("click", () => {
            ToggleCustomHighlight(level);
            RefreshAllEditButtonStates(container);
        });
    }
    return levelButton
} 

// Custom highlight obrada

export function ToggleCustomHighlight(level)
{
    setActiveCustomLevel(level);

    const activePage = document.querySelector(".active-page");
    const tokens = activePage.querySelectorAll(".token");

    tokens.forEach(t => {
        t.classList.toggle("token-highlight-mode", isCustomHighlightActive());
    });

    const res = isCustomHighlightActive();
    if(res)
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
    const level = activeCustomLevel;
    const selection = window.getSelection();
    if (selection.isCollapsed || selection.rangeCount === 0) 
        return;

    const range = selection.getRangeAt(0);
    const activePage = document.querySelector(".active-page");
    const tokens = activePage.querySelectorAll(".token");
    const localIdxOffset = tokens[0].dataset.index;

    // const cacheKey = `${currentPageIndex}-custom`;
    // if (!levelHighlights[cacheKey]) 
    //     levelHighlights[cacheKey] = new Set();

    tokens.forEach(span => {
        if (range.intersectsNode(span)) {
            const idx = parseInt(span.dataset.index, 10) - localIdxOffset;

            if (app_state.toggleIndexForCustomHighlight(level, currentPageIndex, idx))
                span.classList.remove(`highlight-${level}`);
            else
                span.classList.add(`highlight-${level}`);
        }
    });
    
    app_state.activateLevelForPage(level, currentPageIndex);
    selection.removeAllRanges();
    UpdateHighlightButtonState(document.querySelector(`.highlight-level-${level}-btn`), level, currentPageIndex);
}

// function ToggleCustomHighlightVisibility(pageContainer, button, level)
// {
//     app_state.toggleLevelForPage(level, currentPageIndex);
//         const isActive = app_state.isLevelActiveForPage(level, currentPageIndex);
//         const indexSet = new Set(app_state.getIndicesForPageAndLevel(level, currentPageIndex));

//         const pageTokens = pageContentElement.querySelectorAll(".token");
//         pageTokens.forEach((span, localIdx) => {
//             if (indexSet.has(localIdx)) {
//                 span.classList.toggle(`highlight-${level}`, isActive);
//             }
//         }); 

//     UpdateHighlightButtonState(button, level, currentPageIndex);
// }


// Update dugmica

export function UpdateHighlightButtonState(button, level, page)
{
    button.classList.remove("highlight-unhighlighted", "highlight-inactive", "highlight-active");
    
    const highlighted = app_state.isPageHighlightedForLevel(level, page)

    if(!highlighted)
       button.classList.add("highlight-unhighlighted"); 
    else
    {
        const active = app_state.isLevelActiveForPage(level, page);
        if(active)
            button.classList.add("highlight-active");
        else
            button.classList.add("highlight-inactive"); 
    }
}

export function RefreshAllButtonStates(container)
{
    const highlightBtns = container.querySelectorAll(".highlight-level-btn");
    highlightBtns.forEach((btn, i) => {
        const level = Number(btn.dataset.level);
        UpdateHighlightButtonState(btn, level, currentPageIndex);
    });
}

export function RefreshAllEditButtonStates(container)
{
    const highlightEditBtns = container.querySelectorAll(".highlight-edit-btn");
    highlightEditBtns.forEach((btn, i) => {
        const level = Number(btn.dataset.level);
        btn.classList.toggle("highlight-custom-on", activeCustomLevel === level);
    });
}