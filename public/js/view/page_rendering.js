import {setAllPages, setCurrentPageIndex, currentPageIndex, allPages} from '../state/app_state.js'
import { DrawElement } from '../misc/helpers.js';

export function RenderPages(pageViewer, pages) {
    document.querySelector(".page-nav-container").classList.remove("hidden");
    
    pageViewer.innerHTML = "";
    setAllPages(pages);
    setCurrentPageIndex(0);
    
    pages.forEach((pageContent, i) => {
        const paper = document.createElement("div");
        paper.classList.add("paper");
        paper.classList.add(`paper-${i}`);
        if (i === 0) 
            paper.classList.add("active-page");
        paper.appendChild(pageContent);
        pageViewer.appendChild(paper);
    });
}

export function ShowPage(pageViewer, index) {
    if(index < 0 || index > allPages.length)
        return false;
    const papers = pageViewer.querySelectorAll(".paper");
    papers.forEach(p => p.classList.remove("active-page"));
    papers[index].classList.add("active-page");
    setCurrentPageIndex(index);
    return true;
}

export function OpenPageSelectionModal(container, pageViewer)
    {
        return new Promise(
            resolve => {
                const overlay = document.createElement("div");
                overlay.className = "overlay";
                
                const modalContainer = DrawElement(overlay, "div", ["modal-container"]);
                const modalTextContainer = DrawElement(modalContainer, "div", ["modal-text-container"]);
                const modalText = DrawElement(modalTextContainer, "h2", ["modal-text"], "Go to page")
                
                const modalPageInputContainer = DrawElement(modalContainer, "div", ["modal-form-group-container"])
                const modalPageInputLbl = DrawElement(modalPageInputContainer, "label", ["form-page-number-lbl"], "Page number:");
                const modalPageInput = DrawElement(modalPageInputContainer, "input", ["form-page-number-input", "modal-input"]);
                modalPageInput.type = "number";
                modalPageInput.value = currentPageIndex + 1;

                const modalBtnContainer = DrawElement(modalContainer, "div", ["modal-btn-container"]);
                const modalBtnConfirm = DrawElement(modalBtnContainer, "button", ["modal-btn-confirm"], "Confirm");
                const modalBtnCancel = DrawElement(modalBtnContainer, "button", ["modal-btn-cancel"], "Cancel");
            
                modalBtnConfirm.addEventListener("click", () =>
                {
                    const res = ShowPage(pageViewer, Number(modalPageInput.value) - 1);
                    overlay.remove();
                    resolve(res);
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