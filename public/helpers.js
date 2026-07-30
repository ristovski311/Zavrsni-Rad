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

export function showLoadingOverlay() {
    const overlay = document.createElement("div");
    overlay.className = "overlay";

    const star = document.createElement("div");
    overlay.appendChild(star);
    star.textContent = "✦";
    star.className = "star";

    document.body.appendChild(overlay);

    return () => overlay.remove();
}