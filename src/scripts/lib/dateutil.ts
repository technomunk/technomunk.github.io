export function dateCompare(a?: Date | string, b?: Date | string): number {
    a = (a == undefined) ? new Date() : new Date(a)
    b = (b == undefined) ? new Date() : new Date(b)
    return a.getTime() - b.getTime()
}
