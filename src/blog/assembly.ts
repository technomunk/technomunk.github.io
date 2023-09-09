import { InterpreterUI } from '../script/lib/interpreter/ui'
import { tokenize } from '../script/lib/interpreter/code'
import './blog.css'

for (const codeElement of document.querySelectorAll("code")) {
    if (codeElement.classList.contains("interactive")) {
        new InterpreterUI(codeElement)
    } else if (codeElement.textContent) {
        codeElement.innerHTML = tokenize(codeElement.textContent)
    }
}
