import { DrawElement } from "../misc/helpers.js";
import { currentTheme, setCurrentTheme } from "../state/app_state.js";




// Fja koja pravi most izmedju lokalnih putanja slika u html file-u
// I onih iz webkitdirectory koji upload-ujemo
export function ResolveLocalResources(content, contentFile, files)
{
    const filesByPath = new Map();

    //Relativna putanja -> File
    for(const f of files)
    {
        filesByPath.set(f.webkitRelativePath, f);
    }

    const mainPath = contentFile.webkitRelativePath;
    const mainDirectory = mainPath.substring(0, mainPath.lastIndexOf("/") + 1);

    const objectURLs = [];

    const images = content.querySelectorAll("img");
    for(const img of images)
    {
        const src = img.getAttribute("src");
        if(!src)
            continue;

        // Udaljeni file-ovi
        if(
            src.startsWith("http://") ||
            src.startsWith("https://") ||
            src.startsWith("data:") ||
            src.startsWith("blob:")
        )
        {
            continue;
        }

        const fullPath = mainDirectory + src;
        const imageFile = filesByPath.get(fullPath);
        if(!imageFile)
        {
            console.log("Local resource not found: ", fullPath);
            continue;
        }

        const objectUrl = URL.createObjectURL(imageFile);
        img.src = objectUrl;
        objectURLs.push(objectUrl);
    }

    return objectURLs;
}

export function OpenThemeSelectModal(container)
{
    return new Promise(
        resolve => {
            const overlay = document.createElement("div");
            overlay.className = "overlay";
            
            const modalContainer = DrawElement(overlay, "div", ["modal-container"]);
            const modalTextContainer = DrawElement(modalContainer, "div", ["modal-text-container"]);
            const modalText = DrawElement(modalTextContainer, "h2", ["modal-text"], "Select a theme")
            
            const themeSelectorContainer = DrawElement(modalContainer, "div", ["theme-selector-container"]);
            
            const themes = ["Default", "Classic", "Purple", "Dark"];
            
            themes.forEach(theme => {
                const themeContainer = DrawElement(themeSelectorContainer, "div", ["theme-container"]);
                themeContainer.dataset.theme = theme.toLowerCase();
                themeContainer.classList.toggle("selected-theme-container", currentTheme === theme.toLowerCase());
                const themeHeader = DrawElement(themeContainer, "header", ["theme-header"], theme);
                const themeThumbnail = DrawElement(themeContainer, "div", ["theme-thumbnail"])
                // themeThumbnail.dataset.theme = theme.toLowerCase();
                const themeThumbnailHeader = DrawElement(themeThumbnail, "div", ["theme-thumbnail-header"]);
                const themeThumbnailToolbar = DrawElement(themeThumbnail, "div", ["theme-thumbnail-toolbar"]);
                const themeThumbnailPageContainer = DrawElement(themeThumbnail, "div", ["theme-thumbnail-page-container"]);
                const themeThumbnailPage = DrawElement(themeThumbnailPageContainer, "div", ["theme-thumbnail-page"]);

                themeContainer.addEventListener("click", () => {
                    ChangeTheme(theme.toLowerCase(), themeSelectorContainer);
                })
            });

            const modalBtnContainer = DrawElement(modalContainer, "div", ["modal-btn-container"]);
            const modalBtnCancel = DrawElement(modalBtnContainer, "button", ["modal-btn-cancel"], "Close");
        

            modalBtnCancel.addEventListener("click", () =>
            {
                overlay.remove();
                resolve();
            })

            document.body.appendChild(overlay);
        }
    )
}

function ChangeTheme(theme, modalContainer)
{
    document.documentElement.dataset.theme = theme;
    setCurrentTheme(theme);
    const containers = modalContainer.querySelectorAll(".theme-container");
    containers.forEach(container => {
        container.classList.toggle("selected-theme-container", currentTheme === container.dataset.theme)
    });
}


// Informacije o aplikaciji
export function OpenInformationModal(container, info)
{
    return new Promise(
        resolve => {
            const overlay = document.createElement("div");
            overlay.className = "overlay";
            
            const modalContainer = DrawElement(overlay, "div", ["modal-container"]);
            const modalTextContainer = DrawElement(modalContainer, "div", ["modal-text-container"]);
            const modalText = DrawElement(modalTextContainer, "h2", ["modal-text"], "About this application")

            const modalInfoText = DrawElement(modalContainer, "p", ["modal-info-text"], info)

            const modalBtnContainer = DrawElement(modalContainer, "div", ["modal-btn-container"]);
            const modalBtnCancel = DrawElement(modalBtnContainer, "button", ["modal-btn-cancel"], "Close");

            modalBtnCancel.addEventListener("click", () =>
            {
                overlay.remove();
                resolve();
            })

            document.body.appendChild(overlay);
        }
    )
}