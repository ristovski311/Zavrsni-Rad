

// Rekurzivna funkcija koja prolazi kroz html DOM ucitanog file-a
// i cilja da od njega kreira tokenizovani html DOM pri cemu je tekstualni
// deo DOM-a pretvoren u mnostvo span-ova koji se samostalno mogu highlight-ovati 
export function TokenizeDOM(container)
{
    let index = 0;

    function walk(node)
    {
        const children = Array.from(node.childNodes);
        for(const child of children)
        {
            if(child.nodeType === Node.TEXT_NODE) //Samo tekstualne elemente delimo na tokene
            {
                const text = child.textContent;
                if(text.trim() === "")
                    continue;

                const parts = text.split(/(\s+)/);
                const fragment = document.createDocumentFragment();

                for(const part of parts)
                {
                    if(part === "")
                        continue;
                    
                    if(/^\s+$/.test(part)) //Whitespace znakovi samo se nadovezu : alternativa je da se i oni highlight-uju uz najblizi span bez prekida
                        fragment.appendChild(document.createTextNode(part));
                    else
                    {
                        const span = document.createElement("span");
                        span.classList.add("token");
                        span.dataset.index = index;
                        span.textContent = part;
                        span.draggable = false;
                        fragment.appendChild(span);
                        index++;
                    }
                }
                child.replaceWith(fragment);
            }
            else if(child.nodeType === Node.ELEMENT_NODE) //Ako nije txt element, rekurzivno ga obradimo, osim ako je slika ili break
            {
                if(child.tagName !== "IMG" && child.tagName != "BR")
                {
                    walk(child);
                }
            }
        }
    }

    walk(container);
}

// | DEPRICATED | Slicna f-ja - koristi se za tokenizaciju .txt fajlova, koriscena je u pocetnom razvoju
function TokenizeText(container, text)
{
    container.innerHTML = "";
    const parts = text.split(/(\s+)/);
    let index = 0;
    for(const part of parts)
    {
        if(part == "")
            continue;
        if(/^\s+$/.test(part))
        {
            const span = DrawElement(container, "span", ["token"], part);
            span.dataset.index = index;
        }
        else
        {
            const span = DrawElement(container, "span", ["token"], part);
            span.dataset.index = index;
            index++;
        }
    }
}