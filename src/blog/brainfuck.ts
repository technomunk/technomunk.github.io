import { tokenize } from '../script/lib/interpreter/code'
import { BrainfuckUI } from '../script/lib/interpreter/ui'
import './blog.sass'

for (const codeElement of document.querySelectorAll("code")) {
    if (codeElement.classList.contains("interactive")) {
        new BrainfuckUI(codeElement)
    } else if (codeElement.textContent) {
        codeElement.innerHTML = tokenize(codeElement.textContent, "brainfuck")
    }
}
