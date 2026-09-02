export class HighlightLevel 
{
    constructor(level, type, percent, highlightArea)
    {
        this.level = level;
        this.type = type;
        this.highlightArea = highlightArea;
        this.percent = percent;
        this.pages = []
    }

    getHighlightArea()
    {
        return this.highlightArea;
    }

    getPageIndices(pageId)
    {
        const page = this.pages.find(p => p.page_id === pageId);
        return page ? page.indices : null;
    }

    setPageIndices(pageId, indices)
    {
        const page = this.pages.find(p => p.page_id === pageId);
        if(!page)
        {
            this.pages.push({
                page_id: pageId,
                indices: indices
            })
        }
        else
            page.indices = indices;
    }

    isIndexInIndices(pageId, index)
    {
        const page = this.pages.find(p => p.page_id === pageId);
        if(!page)
        {
            return null;
        }
        else if(page.indices.includes(index))
            return true;
        else
            return false;
    }

    addIndexToIndices(pageId, index)
    {
        const page = this.pages.find(p => p.page_id === pageId);
        if(!page)
        {
            this.pages.push({
                page_id: pageId,
                indices: [index]
            });
        }
        else
            page.indices.push(index);
    }

    removeIndexFromIndices(pageId, index)
    {
        const page = this.pages.find(p => p.page_id === pageId);
        if(!page)
        {
            return;
        }
        else
        {
            const id = page.indices.indexOf(index);
            page.indices.splice(id, 1);
        }
    }

    toJSON()
    {
        return {
            level: this.level,
            type: this.type,
            highlightArea: this.highlightArea,
            percent: this.percent,
            pages: this.pages
        }
    }

    static fromJSON(json_obj)
    {
        const level = new HighlightLevel(json_obj.level, json_obj.type, json_obj.percent, json_obj.highlightArea);
        level.pages = json_obj.pages;
        return level;
    }
}

/*

primer JSON levela:

{
    "level": 1,
    "type": "ai",
    "percent": 50,
    "pages": [
        {
            page_id: 0,
            indices: [1, 2, 3]
        },
        {
            page_id: 1,
            indices: [2, 4, 6]
        }
    ]
}

*/