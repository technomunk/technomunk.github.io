import { error, lines } from "../util"

type Token = {
    tag: "comment" | "label" | "keyword" | "var" | "val" | "ref"
    value: string
}
type TokenizedLine = Array<string | Token>

export class CodeBlock {
    readonly element: HTMLElement
    protected code: Array<HTMLElement> = []
    protected labels: Map<string, number> = new Map()

    protected highlightedLine: number = 0

    constructor(element: HTMLElement) {
        this.element = element
        const textLines = lines(element.textContent!)
        element.innerHTML = ""
        for (const line of textLines) {
            const tokenizedLine = tokenizeLine(line)
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

    composeLineElement(text: TokenizedLine): HTMLElement {
        const element = document.createElement("span")
        element.classList.add("code-line")
        element.innerHTML = text.map(t => span(t)).join("") + "\n"
        return element
    }
}

export function tokenize(text: string): string {
    return lines(text)
        .map(l => tokenizeLine(l).map(t => span(t)).join(""))
        .join("\n")
}

function tokenizeLine(line: string): TokenizedLine {
    if (line.match(/^.+:$/)) {
        return [{ tag: "label", value: line.slice(0, -1) }, ":"]
    }
    const commentStart = line.search(";")
    let comment = ""
    if (commentStart != -1) {
        comment = line.slice(commentStart)
        line = line.slice(0, commentStart)
    }

    const result: TokenizedLine = []
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

const TAGS: Map<string, "keyword" | "var"> = new Map([
    ["mov", "keyword"],
    ["inc", "keyword"],
    ["mul", "keyword"],
    ["cmp", "keyword"],
    ["jb", "keyword"],
    ["ret", "keyword"],
    ["eax", "var"],
    ["ecx", "var"],
    ["edi", "var"],
])

function determineTag(word: string): "keyword" | "var" | "val" | "ref" {
    const tag = TAGS.get(word)
    if (tag != undefined) {
        return tag
    }
    if (Number.isNaN(parseInt(word))) {
        return "ref"
    }
    return "val"
}

function span(token: string | Token): string {
    if (typeof token === "string") {
        return token
    }
    return `<span class="${token.tag}">${token.value}</span>`
}

function isLabel(line: TokenizedLine): line is [Token, string] {
    return line.length > 1 && typeof line[0] !== "string" && line[0].tag == "label"
}

function isExecutableCode(line: TokenizedLine): boolean {
    return line.findIndex(t => typeof t !== "string" && t.tag != "comment") != -1
}
