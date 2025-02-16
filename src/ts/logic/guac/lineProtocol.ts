export const guacEncode = (opcode: string, ...args: string[]) =>
    [opcode,...args].map(a => a.length + '.' + a).join(',') + ';';

const CharPeriod = 46;
const Char0 = 48;
const Char9 = 57;
const CharSemi = 59;
const Whitespace = [" ", "\n","\r","\t"].map(a => a.charCodeAt(0))

export const guacDecode = (string: string) => {
    let i = 0;
    let cmds = [];
    let strings = [];
    let length = 0;
    while (i < string.length) {
        let char = string.charCodeAt(i);
        if (char == CharPeriod) {
            let endIdx = i+1+length;
            if (endIdx > string.length) throw new Error(i + ": String index overrun in length " + length);
            length = 0
            let str = string.substring(i+1,endIdx);
            strings.push(str);
            if (string.charCodeAt(endIdx) == CharSemi) {
                cmds.push(strings);
                strings = [];
            } 
            i = endIdx;
        } else if (char >= Char0 && char <= Char9) length = (length * 10) + (char - Char0);
        else if (Whitespace.includes(char)) {}
        else throw new Error(i + ": Unknown character " + String.fromCharCode(char));
        i++;
    }
    if (strings.length) cmds.push(strings);
    return cmds;
}