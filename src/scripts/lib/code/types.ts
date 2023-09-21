export type Lang = "asm" | "bnfk"

export type Tag = "comment" | "label" | "keyword" | "var" | "val" | "ref" | "scope"
export const TAGS: Array<Tag> = ["comment", "label", "keyword", "var", "val", "ref", "scope"]

export type Token = {
    tag: Tag
    value: string
    hint?: string
}
