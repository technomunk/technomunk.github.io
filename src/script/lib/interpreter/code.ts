import { error, lines } from "../util"

type Tag = "comment" | "label" | "keyword" | "var" | "val" | "ref"
type Token = {
    tag: Tag
    value: string
}
type TokenSeq = Array<string | Token>

const TOKENIZERS = {
    "asm": tokenizeAsm,
    "brainfuck": tokenizeBrainfuck,
}
const ASM_TAGS: Map<string, "keyword" | "var"> = new Map([
    ["mov", "keyword"],
    ["inc", "keyword"],
    ["mul", "keyword"],
    ["cmp", "keyword"],
    ["jb", "keyword"],
    ["ret", "keyword"],
    ["ax", "var"],
    ["cx", "var"],
    ["di", "var"],
])
const BRAINFUCK_TAGS: Map<string, Tag> = new Map([
    ["+", "keyword"],
    ["-", "keyword"],
    [">", "keyword"],
    ["<", "keyword"],
    [".", "ref"],
    [",", "ref"],
    ["[", "label"],
    ["]", "label"],
])


export class CodeBlock {
    readonly element: HTMLElement
    protected code: Array<HTMLElement> = []
    protected labels: Map<string, number> = new Map()
    protected _vars: Set<string> = new Set()

    protected highlightedLine: number = 0

    constructor(element: HTMLElement) {
        this.element = element
        const textLines = lines(element.textContent!)
        element.innerHTML = ""
        for (const line of textLines) {
            const tokenizedLine = tokenizeAsmLine(line)
            for (const name of getTokens(tokenizedLine, "var")) {
                this._vars.add(name)
            }
            const lineElement = this.composeLineElement(tokenizedLine)
            element.appendChild(lineElement)
            if (isLabel(tokenizedLine)) {
                this.labels.set(tokenizedLine[0].value, this.code.length)
                continue
            }
            if (isExecutableCode(tokenizedLine)) {
                this.code.push(lineElement)
            }
        }
    }

    get vars(): Iterable<string> {
        return this._vars
    }

    getLine(n: number): string {
        return this.code[n].innerText.trim()
    }

    deref(label: string): number {
        return this.labels.get(label) ?? error(`Unknown label: "${label}"`)
    }

    highlightLine(n: number) {
        this.code[this.highlightedLine].classList.remove("highlight")
        this.code[n].classList.add("highlight")
        this.highlightedLine = n
    }

    composeLineElement(text: TokenSeq): HTMLElement {
        const element = document.createElement("span")
        element.classList.add("code-line")
        element.innerHTML = text.map(t => span(t)).join("") + "\n"
        return element
    }
}

export function tokenize(text: string, language: "asm" | "brainfuck"): string {
    return TOKENIZERS[language](text)
}

function tokenizeAsm(text: string): string {
    return lines(text)
        .map(l => tokenizeAsmLine(l).map(t => span(t)).join(""))
        .join("\n")
}

function tokenizeBrainfuck(text: string): string {
    return lines(text)
        .map(l => tokenizeBrainfuckLine(l).map(t => span(t)).join(""))
        .join("\n")
}

function tokenizeAsmLine(line: string): TokenSeq {
    if (line.match(/^.+:$/)) {
        return [{ tag: "label", value: line.slice(0, -1) }, ":"]
    }
    const commentStart = line.search(";")
    let comment = ""
    if (commentStart != -1) {
        comment = line.slice(commentStart)
        line = line.slice(0, commentStart)
    }

    const result: TokenSeq = []
    let lastEnd = 0
    for (const [start, end] of words(line)) {
        if (lastEnd < start) {
            result.push(line.slice(lastEnd, start))
        }
        lastEnd = end
        const word = line.slice(start, end)
        result.push({ tag: determineTag(word), value: word })
    }
    if (comment.length) {
        result.push({ tag: "comment", value: comment })
    }

    return result
}

function tokenizeBrainfuckLine(line: string): TokenSeq {
    const result: TokenSeq = []
    let start = 0
    let end = 0
    for (; end < line.length; ++end) {
        const tag = BRAINFUCK_TAGS.get(line[end])
        if (tag != undefined) {
            if (start != end) {
                result.push(commentOrWhitespace(line.substring(start, end)))
            }
            result.push({ tag, value: line[end] })
            start = end + 1
            continue
        }
    }
    if (end != start) {
        result.push(commentOrWhitespace(line.substring(start)))
    }
    return result
}

function* words(line: string): Generator<[number, number]> {
    let start = 0
    for (let i = 0; i < line.length; ++i) {
        if ([" ", ","].indexOf(line.charAt(i)) != -1) {
            if (start < i) {
                yield [start, i]
            }
            start = i + 1
            continue
        }
    }
    if (start != line.length) {
        yield [start, line.length]
    }
}

function determineTag(word: string): "keyword" | "var" | "val" | "ref" {
    const tag = ASM_TAGS.get(word)
    if (tag != undefined) {
        return tag
    }
    if (Number.isNaN(parseInt(word))) {
        return "ref"
    }
    return "val"
}

function commentOrWhitespace(text: string): Token | string {
    if (text.match(/^\s*$/) == null) {
        return { tag: "comment", value: text }
    }
    return text
}

function span(token: string | Token): string {
    if (typeof token === "string") {
        return token
    }
    return `<span class="${token.tag}">${token.value}</span>`
}

function isToken(t: string | Token): t is Token {
    return typeof t !== "string"
}

function isLabel(line: TokenSeq): line is [Token, string] {
    return line.length > 1 && isToken(line[0]) && line[0].tag == "label"
}

function isExecutableCode(line: TokenSeq): boolean {
    return line.findIndex(t => isToken(t) && t.tag != "comment") != -1
}

function getTokens(line: TokenSeq, tag: Tag): string[] {
    return line
        .filter(isToken)
        .filter(t => t.tag == tag)
        .map(t => t.value)
}
