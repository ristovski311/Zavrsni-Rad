import { activeCustomLevel, app_state, currentPageIndex, getHighlightColor, isCustomHighlightActive, pageContainer,setActiveCustomLevel, setHighlightColor } from "../state/app_state.js";
import { DrawElement, ShowLoadingOverlay } from "../misc/helpers.js";
import { Highlight, ToggleHighlightVisibility,HandleCustomHighlightSelection } from "./highlighting.js";

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

/* Slider-i - kasnije implementirati

            const colorPickerContainer = DrawElement(modalContainer, "div", ["color-picker-container"]);
            const slidersContainer = DrawElement(colorPickerContainer, "div", ["color-sliders-container"]);
            const previewContainer = DrawElement(colorPickerContainer, "div", ["color-preview-container"], "lorem impsum");

            const hue = CreateColorSlider("H", 0, 360, 180);
            const saturation = CreateColorSlider("S", 0, 100, 70);
            const lightness = CreateColorSlider("L", 0, 100, 70);

            slidersContainer.appendChild(hue.container);
            slidersContainer.appendChild(saturation.container);
            slidersContainer.appendChild(lightness.container);

            function UpdatePreview() {
                const h = hue.slider.value;
                const s = saturation.slider.value;
                const l = lightness.slider.value;

                const color = `hsl(${h}, ${s}%, ${l}%)`;

                previewContainer.style.backgroundColor = color;

                hue.labelElement.textContent = `H: ${h}`;
                saturation.labelElement.textContent = `S: ${s}%`;
                lightness.labelElement.textContent = `L: ${l}%`;
            }

            hue.slider.addEventListener("input", UpdatePreview);
            saturation.slider.addEventListener("input", UpdatePreview);
            lightness.slider.addEventListener("input", UpdatePreview);

            UpdatePreview();

function CreateColorSlider(label, min, max, value) {

    const container = document.createElement("div");
    container.className = "color-slider";

    const labelElement = document.createElement("label");
    labelElement.textContent = `${label}: ${value}`;

    const slider = document.createElement("input");
    slider.type = "range";
    slider.min = min;
    slider.max = max;
    slider.value = value;

    container.appendChild(labelElement);
    container.appendChild(slider);

    return {
        container,
        slider,
        labelElement
    };
} */

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
    console.log(clr)
    btnContainer.style.backgroundColor = clr;
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