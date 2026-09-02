

// Funkcija koja sluzi za paginaciju html dokumenta.
// Cilj je da se na papiru A4 formata (na stranici) prikazu
// Elementi postojeceg html dokumenta bez overflow-a

export async function PaginateContent(sourceContainer) {
    const pages = [];
    let currentPage = document.createElement("div");
    currentPage.classList.add("page-content");

    const measuringPaper = document.createElement("div");
    measuringPaper.classList.add("paper");
    measuringPaper.style.position = "absolute";
    measuringPaper.style.visibility = "hidden";
    measuringPaper.style.display = "block";
    document.body.appendChild(measuringPaper);

    function overflows(el) {
        measuringPaper.appendChild(el);
        const result = el.scrollHeight > el.clientHeight;
        measuringPaper.removeChild(el);
        return result;
    }

    function newPage() {
        pages.push(currentPage);
        currentPage = document.createElement("div");
        currentPage.classList.add("page-content");
    }

    // Elementi koje NE otvaramo dalje - tretiramo ih kao "list" sadržaja
    const ATOMIC_TAGS = ["P","H1","H2","H3","H4","H5","H6","IMG","PRE","TABLE","UL","OL","BLOCKQUOTE","FIGURE"];

    function isAtomic(el) {
        return ATOMIC_TAGS.includes(el.tagName) || el.children.length === 0;
    }

    function placeBlock(block) {
        currentPage.appendChild(block);
        if (!overflows(currentPage)) return; // stao je, gotovo

        currentPage.removeChild(block);
        const pageWasEmpty = currentPage.children.length === 0;

        if (!pageWasEmpty) {
            newPage();
            placeBlock(block);
            return;
        }

        if (isAtomic(block)) {
            if (block.tagName === "IMG") {
                ScaleImageToFit(block, measuringPaper);
                currentPage.appendChild(block);
            } else {
                const chunks = SplitOversizedBlock(block, measuringPaper);
                chunks.forEach((chunk, i) => {
                    if (i > 0) newPage();
                    currentPage.appendChild(chunk);
                });
            }
        } else {
            const children = Array.from(block.children);
            for (const child of children) {
                placeBlock(child);
            }
        }
    }

    const topBlocks = Array.from(sourceContainer.children);
    for (const block of topBlocks) {
        placeBlock(block);
    }

    pages.push(currentPage);
    document.body.removeChild(measuringPaper);
    return pages;
}

function ScaleImageToFit(img, measuringPaper) {
    const testWrapper = document.createElement("div");
    testWrapper.classList.add("page-content");
    testWrapper.appendChild(img);
    measuringPaper.appendChild(testWrapper);

    const maxHeight = testWrapper.clientHeight;
    if (img.naturalHeight > 0 && img.naturalHeight > maxHeight) {
        img.style.maxHeight = `${maxHeight}px`;
        img.style.width = "auto";
    }

    measuringPaper.removeChild(testWrapper);
}

function SplitOversizedBlock(block, measuringPaper) {
    const tokens = Array.from(block.querySelectorAll(".token, br"));
    if (tokens.length === 0) return [block]; // nema šta da se deli (npr. prazan blok), vrati kako jeste

    const resultBlocks = [];
    let currentChunk = block.cloneNode(false);
    currentChunk.classList.add("page-content");

    for (const node of block.childNodes) {
        currentChunk.appendChild(node.cloneNode(true));
    }

    let workingBlock = block.cloneNode(false);
    let remainingChildren = Array.from(block.childNodes);

    while (remainingChildren.length > 0) {
        const pageChunk = block.cloneNode(false);
        pageChunk.classList.add("page-content");

        let addedAny = false;
        while (remainingChildren.length > 0) {
            const node = remainingChildren[0];
            pageChunk.appendChild(node);
            addedAny = true;

            measuringPaper.appendChild(pageChunk);
            const overflow = pageChunk.scrollHeight > pageChunk.clientHeight;
            measuringPaper.removeChild(pageChunk);

            if (overflow) {
                pageChunk.removeChild(node);
                remainingChildren = [node, ...remainingChildren.slice(1)];
                break;
            } else {
                remainingChildren.shift();
            }
        }

        pageChunk.classList.remove("page-content");
        resultBlocks.push(pageChunk);
        if (!addedAny) 
            break;
    }

    return resultBlocks;
}