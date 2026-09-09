export function DrawElement(parent, type, classList = null, innerText = null)
{
    const element = document.createElement(type);
    
    if(innerText != null)
        element.innerText = innerText;
    if(classList != null)
        classList.forEach(c => {
            element.classList.add(c);
        });
    parent.appendChild(element);
    return element;
}

export function GetFileExtension(filename) {
    return filename.slice(filename.lastIndexOf(".") + 1).toLowerCase();
}

export function ShowHighlightOverlay() {
    const overlay = document.createElement("div");
    overlay.className = "overlay";

    const star = document.createElement("div");
    overlay.appendChild(star);
    star.textContent = "✦";
    star.className = "star";

    document.body.appendChild(overlay);

    return () => overlay.remove();
}

export function ShowLoadingOverlay() {
    const overlay = document.createElement("div");
    overlay.className = "overlay";

    const star = document.createElement("div");
    overlay.appendChild(star);
    star.textContent = "✎";
    star.className = "star";

    document.body.appendChild(overlay);

    return new Promise(resolve => {
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                resolve(() => overlay.remove());
            });
        });
    });
}

export function ShowYesNoDialog(text, yesText, noText) {
    return new Promise(
        resolve => {
            const overlay = document.createElement("div");
            overlay.className = "overlay";
        
            const dialogContainer = DrawElement(overlay, "div", ["dialog-container"]);
            const dialogTextContainer = DrawElement(dialogContainer, "div", ["dialog-text-container"]);
            const dialogText = DrawElement(dialogTextContainer, "h2", ["dialog-text"], text)
            const dialogBtnContainer = DrawElement(dialogContainer, "div", ["dialog-btn-container"]);
            const dialogBtnYes = DrawElement(dialogBtnContainer, "button", ["dialog-btn-yes"], yesText);
            const dialogBtnNo = DrawElement(dialogBtnContainer, "button", ["dialog-btn-no"], noText);
        
            dialogBtnYes.addEventListener("click", () =>
            {
                overlay.remove();
                resolve(true);
            })
        
            dialogBtnNo.addEventListener("click", () =>
            {
                overlay.remove();
                resolve(false);
            })

            document.body.appendChild(overlay);
        }
    )
   
}

export function ShowInfoDialog(text, yesText, noText) {
    return new Promise(
        resolve => {
            const overlay = document.createElement("div");
            overlay.className = "overlay";
        
            const dialogContainer = DrawElement(overlay, "div", ["dialog-container"]);
            const dialogTextContainer = DrawElement(dialogContainer, "div", ["dialog-text-container"]);
            const dialogText = DrawElement(dialogTextContainer, "h2", ["dialog-text"], text)
            const dialogBtnContainer = DrawElement(dialogContainer, "div", ["dialog-btn-container"]);
            const dialogBtnYes = DrawElement(dialogBtnContainer, "button", ["dialog-btn-yes"], yesText);
            const dialogBtnNo = DrawElement(dialogBtnContainer, "button", ["dialog-btn-no"], noText);
        
            dialogBtnYes.addEventListener("click", () =>
            {
                overlay.remove();
                resolve(true);
            })
        
            dialogBtnNo.addEventListener("click", () =>
            {
                overlay.remove();
                resolve(false);
            })

            document.body.appendChild(overlay);
        }
    )
   
}

export function AddShortcut(container, keys, callback)
{
    container.addEventListener("keydown", (event) => {
        if(
            event.ctrlKey === !!keys.ctrl &&
            event.shiftKey === !!keys.shift &&
            event.altKey === !!keys.alt &&
            event.key.toLowerCase() === keys.key.toLowerCase()
        )
        {
            event.preventDefault();
            callback();
        }
    })
}