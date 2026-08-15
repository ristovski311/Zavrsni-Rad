export class HighlightLevel 
{
    constructor(level, type, percent)
    {
        this.level = level;
        this.type = type;
        this.percent = percent;
        this.pages = []
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

    toJSON()
    {
        return {
            level: this.level,
            type: this.type,
            percent: this.percent,
            pages: this.pages
        }
    }

    static fromJSON(json_obj)
    {
        const level = new HighlightLevel(json_obj.level, json_obj.type, json_obj.percent);
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