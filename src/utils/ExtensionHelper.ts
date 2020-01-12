var XRegExp = require('xregexp');

export function IsSourceFile(filename: string) : boolean {
    const regex1 = new XRegExp("(.*?).cpp");
    if (regex1.test(filename)){
            return true;
    }  
    else{
        return false;
    }
}

export function IsHeaderFile(filename: string) : boolean {
    const regex1 = new XRegExp("(.*?).h");
    if (regex1.test(filename)){
        return true;
    }  
    else {
        return false;
    }
}