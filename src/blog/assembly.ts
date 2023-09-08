import hljs from 'highlight.js/lib/core'
import x86asm from 'highlight.js/lib/languages/x86asm'

import { InterpreterUI } from '../script/lib/interpreter/interpreter'
import { CodeBlock, tokenize } from '../script/lib/interpreter/code'
import './blog.css'

// hljs.registerLanguage('x86asm', x86asm)
// hljs.highlightAll()

for (const interactive of document.querySelectorAll("code.interactive")) {
    new InterpreterUI(interactive as HTMLElement)
    console.log(interactive)
}

// for (const nonInteractive of document.querySelectorAll("code:not(.interactive)")) {
//     if (nonInteractive.textContent) {
//         console.log(tokenize(nonInteractive.textContent))
//     }
// }
