import { app_state, currentPageIndex, pageContainer } from "../state/app_state.js";
import { DrawElement, ShowLoadingOverlay } from "../misc/helpers.js";
import { Highlight } from "./highlighting.js";

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
            const formLevelInput = DrawElement(formLevelLblContainer, "input", ["form-level-input"]);
            formLevelInput.type = "text";
            formLevelInput.disabled = true;
            formLevelInput.value = newLevelCount;
            
            const formTypeLblContainer = DrawElement(modalForm, "div", ["modal-form-group-container"])
            const formTypeLbl = DrawElement(formTypeLblContainer, "label", ["form-type-lbl"], "Type");
            const formTypeRadioAI = DrawElement(formTypeLblContainer, "input", ["form-type-radio"]);
            const formTypeRadioAILbl = DrawElement(formTypeLblContainer, "label", ["form-type-lbl"], "AI");
            const formTypeRadioCustom = DrawElement(formTypeLblContainer, "input", ["form-type-radio"]);
            const formTypeRadioCustomLbl = DrawElement(formTypeLblContainer, "label", ["form-type-lbl"], "Custom");
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
            
            const formPercentContainer = DrawElement(modalForm, "div", ["modal-form-group-container", "modal-form-percent-container"])
            const formPercentLbl = DrawElement(formPercentContainer, "label", ["form-percent-lbl"], "% of text");
            const formPercentInput = DrawElement(formPercentContainer, "input", ["form-percent-input"]);
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

    let levelInfoContainer = DrawElement(levelButton, "div", ["level-info-container"])
    let levelInfoHeader = DrawElement(levelInfoContainer, "p", ["level-info-header"], `LVL ${level}`)
    let infoTypeText = `${type.toUpperCase()}`
    if(type === "ai")
        infoTypeText += ` [${percent}%]`;
    let levelInfoType = DrawElement(levelInfoContainer, "p", ["level-info-type"], infoTypeText)
    if(type === "custom")
    {
        let levelCustomEditBtn = DrawElement(btnContainer, "button", ["highlight-edit-btn", `highlight-edit-${level}-btn`], "✎");
    }
    return levelButton
} 

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

    // if (levelHighlights[cacheKey] === undefined) {
    //     button.classList.add("highlight-unhighlighted"); // jos nije racunato za ovu stranicu
    // } else if (levelActive[cacheKey]) {
    //     button.classList.add("highlight-active");         // izracunato I trenutno prikazano
    // } else {
    //     button.classList.add("highlight-inactive");       // izracunato, ali trenutno skriveno
    // }
}

export function RefreshAllButtonStates(container)
{
    const highlightBtns = container.querySelectorAll(".highlight-level-btn");
    highlightBtns.forEach((btn, i) => {
        const level = Number(btn.dataset.level);
        UpdateHighlightButtonState(btn, level, currentPageIndex);
    });

    //TODO za custom dugmad takodje
    //UpdateHighlightButtonState(document.querySelector(".level-custom"), `${currentPageIndex}-custom`);
}