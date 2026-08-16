import {setAllPages, setCurrentPageIndex} from '../state/app_state.js'

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
    const papers = pageViewer.querySelectorAll(".paper");
    papers.forEach(p => p.classList.remove("active-page"));
    papers[index].classList.add("active-page");
    setCurrentPageIndex(index);
}