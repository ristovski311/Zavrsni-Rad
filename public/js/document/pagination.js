

// Funkcija koja sluzi za paginaciju html dokumenta.
// Cilj je da se na papiru A4 formata (na stranici) prikazu
// Elementi postojeceg html dokumenta bez overflow-a
export function PaginateContent(sourceContainer) {
    const pages = [];
    let currentPageContent = document.createElement("div");
    currentPageContent.classList.add("page-content");

    // Privremeni "papir" wrapper, isti kao pravi, koristi se samo za merenje
    const measuringPaper = document.createElement("div");
    measuringPaper.classList.add("paper");
    measuringPaper.style.position = "absolute";
    measuringPaper.style.visibility = "hidden";
    measuringPaper.style.display = "block"; // .paper ima display:none dok nije .active-page
    document.body.appendChild(measuringPaper);

    const blocks = Array.from(sourceContainer.children);

    for (const block of blocks) {
        currentPageContent.appendChild(block);

        measuringPaper.appendChild(currentPageContent);
        const overflowing = currentPageContent.scrollHeight > currentPageContent.clientHeight;
        measuringPaper.removeChild(currentPageContent);

        if (overflowing) {
            currentPageContent.removeChild(block);
            pages.push(currentPageContent);

            currentPageContent = document.createElement("div"); //Kreiramo sledecu stranicu
            currentPageContent.classList.add("page-content");
            currentPageContent.appendChild(block);
        }
    }
    pages.push(currentPageContent);

    document.body.removeChild(measuringPaper); // ocisti privremenu stranicu za merenje
    return pages;
}