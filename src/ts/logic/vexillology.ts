export const REGIONAL_INDICATORS = {
    A: "1f1e6",
    B: "1f1e7",
    C: "1f1e8",
    D: "1f1e9",
    E: "1f1ea",
    F: "1f1eb",
    G: "1f1ec",
    H: "1f1ed",
    I: "1f1ee",
    J: "1f1ef",
    K: "1f1f0",
    L: "1f1f1",
    M: "1f1f2",
    N: "1f1f3",
    O: "1f1f4",
    P: "1f1f5",
    Q: "1f1f6",
    R: "1f1f7",
    S: "1f1f8",
    T: "1f1f9",
    U: "1f1fa",
    V: "1f1fb",
    W: "1f1fc",
    X: "1f1fd",
    Y: "1f1fe",
    Z: "1f1ff"    
} as Record<string,string>;

export const GetFlagUrl = (code: string) => {
    let points = code.split('').map(c => REGIONAL_INDICATORS[c]).join('-')
    return `https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/${points}.svg`
}