import { HighlightLevel } from "./highlight_level.js"

export class HighlightManager
{
    constructor(numOfPages, fileName)
    {
        this.fileName = fileName
        this.levels = []
        this.pageCount = numOfPages
        this.activeLevelsByPage = {}
        for(let i = 0; i < numOfPages; i++)
        {
            this.activeLevelsByPage[i] = [];
        }
        
        /*
            Struktura:
            {//page-evi
               0: [lista levela koji su aktivni npr 1, 3, 4],
               1: [3, 4],
               ...
            }

        */
    }

    isPageHighlightedForLevel(level, page)
    {
        const lvl = this.levels.find(l => l.level == level);
        if(!lvl)
            return false;

        if(!lvl.getPageIndices(page))
            return false;
        else
        {
            return true;
        }
    }

    setPageIndicesForLevel(level, page, indices)
    {
        const lvl = this.levels.find(l => l.level === level);
        if(!lvl)
            return false;

        lvl.setPageIndices(page, indices);
    }

    getLevel(lvlNumber)
    {
        const lvl = this.levels.find(x => x.level === lvlNumber);
        return lvl;
    }

    getActiveLevelsForPage(page)
    {
        if(page in this.activeLevelsByPage)
            return this.activeLevelsByPage[page];
    }

    isLevelActiveForPage(level, page)
    {
        const lvl = this.levels.find(l => l.level == level);
        if(!lvl)
            return false;

        if(page in this.activeLevelsByPage)
        {
            const activeLevels = this.activeLevelsByPage[page];
            if(activeLevels.includes(level))
                return true;
        }
        return false;
    }

    activateLevelForPage(level,page)
    {
        const lvl = this.levels.find(l => l.level === level);
        if(!lvl)
            return;

        if(page in this.activeLevelsByPage)
        {
            const activeLevels = this.activeLevelsByPage[page];
            if(!activeLevels.includes(level))
                activeLevels.push(level);
        }
    }

    toggleLevelForPage(level, page)
    {
        const lvl = this.levels.find(l => l.level === level);
        if(!lvl)
            return;

        if(page in this.activeLevelsByPage)
        {
            const activeLevels = this.activeLevelsByPage[page];
            if(activeLevels.includes(level))
            {
                const index = activeLevels.indexOf(level);
                activeLevels.splice(index,1);
            }
            else
                activeLevels.push(level);
        }
    }

    getIndicesForPageAndLevel(level,page)
    {
        const lvl = this.levels.find(l => l.level === level);
        if(!lvl)
            return null;

        const curPage = lvl.pages.find(p => p.page_id === page)
        if(!curPage)
            return null;

        return curPage.indices;
    }

    addLevel(level, type, percent = null, highlightArea = 0)
    {
        if(!this.levels.some(l => l.level === level))       
        {
            this.levels.push(new HighlightLevel(level, type, percent, highlightArea));
        }
    }

    getCurrentLevelCount()
    {
        return this.levels.length;
    }

    removeTopLevel()
    {
        if(this.levels.length > 0)
        {
            const poppedLvl = this.levels.pop().level
            Object.keys(this.activeLevelsByPage).forEach(k => {
                this.activeLevelsByPage[k] = this.activeLevelsByPage[k].filter(x => x !== poppedLvl); 
            });
            
        }
    }

    removeLevel(level)
    {
        const id = this.levels.findIndex(l => l.level === level)
        if(id !== -1)
        {
            this.levels.splice(id,1)
            Object.keys(this.activeLevelsByPage).forEach(k => {
                this.activeLevelsByPage[k] = this.activeLevelsByPage[k].filter(x => x !== level); 
            });
        }
    }

    toggleIndexForCustomHighlight(level, page, index)
    {
        const lvl = this.levels.find(l => l.level === level);
        if(!lvl)
            return null;

        const isInIndices = lvl.isIndexInIndices(page, index);
        if(isInIndices)
            lvl.removeIndexFromIndices(page, index);
        else
            lvl.addIndexToIndices(page,index);
        return isInIndices;
    }

    toJSON()
    {
        return {
            fileName: this.fileName,
            levels: this.levels,
            pageCount: this.pageCount,
            activeLevelsByPage: this.activeLevelsByPage
        }
    }

    static fromJSON(json_obj)
    {
        const manager = new HighlightManager(
            json_obj.pageCount, json_obj.fileName
        );

        manager.levels = json_obj.levels.map(
            l => HighlightLevel.fromJSON(l)
        );

        manager.activeLevelsByPage = json_obj.activeLevelsByPage;

        return manager;
    }
}

/*

primer JSON manager-a:

{
    "fileName": "name.html",
    "levels": [
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
        },
        {
            "level": 2,
            "type": "custom",
            "percent": null,
            "pages": [
                {
                    page_id: 0,
                    indices: [1, 2, 3]
                },
                {
                    page_id: 1,
                    indices: [2, 4, 6]
                },
                {
                    page_id: 3,
                    indices: [2, 4]
                }
            ]
        }
    ],
    pageCount: 4,
    activeLevelsByPage:
    {
        0: [1, 2],
        1: [4],
        ...
    }
}

*/