import { activeCustomLevel, app_state, currentPageIndex, getHighlightColor, isCustomHighlightActive, maxHighlightLevels, pageContainer,setActiveCustomLevel } from "../state/app_state.js";
import { DrawElement, ShowLoadingOverlay, ShowHighlightOverlay } from "../misc/helpers.js";
import { Highlight, ToggleHighlightVisibility,HandleCustomHighlightSelection } from "./highlighting.js";
import { OpenInformationModal } from "../document/utility.js";

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
            if(app_state.getCurrentLevelCount() === maxHighlightLevels)
            {
                await OpenInformationModal(container, "Maximum number of levels reached!" ,"We currently support only 6 levels of highlights.");
                return;
            }
            else
            {
                const res = await OpenCreateLevelModal(container);
                if(res)
                    RenderLevelButtons(highlightLevelsContainer);
                if(highlightLevelsContainer.classList.contains("no-height"))
                    expandLevelsBtn.click();
            }
        }
    })
    if(app_state)
        RenderLevelButtons(highlightLevelsContainer);
}

function OpenCreateLevelModal()
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
                modalForm.querySelector(".modal-ai-modifications-container").style.display = "flex";
            })

            formTypeRadioCustom.type = "radio";
            formTypeRadioCustom.id = "highlightTypeCustom";
            formTypeRadioCustom.name = "highlightType"
            formTypeRadioCustom.value = "Custom"
            formTypeRadioCustom.addEventListener("change", () => {
                modalForm.querySelector(".modal-ai-modifications-container").style.display = "none";
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
            
            const aiHighlightModificationsContainer = DrawElement(modalForm, "div", ["modal-form-group-container", "modal-ai-modifications-container"]) 

            const highlightAreaContainer = DrawElement(aiHighlightModificationsContainer, "div", ["modal-form-group-container", "modal-form-highlight-area-container"])
            const formHighlightAreaLbl = DrawElement(highlightAreaContainer, "label", ["form-highlight-area-lbl"], "Highlight area");
            const highlightAreaSelect = DrawElement(highlightAreaContainer, "select", ["form-highlight-area-select"]);

            // Highlight preko cele stranice
            const wholePageOption = DrawElement(highlightAreaSelect,"option", [], "Whole page");
            wholePageOption.value = 0;

            // Highlight samo preko vec highlight-ovanih delova nekog od levela
            for (let level = 1; level <= app_state.getCurrentLevelCount(); level++) {
                const option = DrawElement(highlightAreaSelect, "option",[],`Level ${level}`);
                option.value = level;
            }
            
            const formPercentContainer = DrawElement(aiHighlightModificationsContainer, "div", ["modal-form-group-container", "modal-form-percent-container"])
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
                app_state.addLevel(newLevelCount, formTypeRadioAI.checked ? "ai" : "custom", formTypeRadioAI.checked ? formPercentInput.value : null, parseInt(highlightAreaSelect.value))
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
    const clr = getHighlightColor(level);
    btnContainer.style.backgroundColor = clr;

    let levelTypeIcon = DrawElement(btnContainer, "p", ["highlight-level-type-icon"], type === "ai" ? "AI" : "CUSTOM")

    let levelBtnGroup = DrawElement(btnContainer, "div", ["highlight-btn-holder"]);
    let levelButton = DrawElement(levelBtnGroup, "button", ["highlight-level-btn", `higlight-type-${type}`, `highlight-level-${level}-btn`, "highlight-unhighlighted"]);
    levelButton.dataset.level = level;
    if(type === "ai")
    {
        levelButton.addEventListener("click", async (e) => {
            const hideOverlay = ShowHighlightOverlay();
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
    if(type === "ai")
    {
        const lvl = app_state.getLevel(level);
        let lvlHighlightArea = "";
        if(lvl)
            lvlHighlightArea = lvl.getHighlightArea();
        if(lvlHighlightArea == 0)
            lvlHighlightArea = "Page";
        else
            lvlHighlightArea = `LVL ${lvlHighlightArea}`;
        let infoTypeText = `${percent}% of ${lvlHighlightArea}`;
        let levelInfoType = DrawElement(levelInfoContainer, "p", ["level-info-type"], infoTypeText)
    }
    if(type === "custom")
    {
        let levelCustomEditBtn = DrawElement(levelBtnGroup, "button", ["highlight-edit-btn", `highlight-edit-${level}-btn`], "✎");
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