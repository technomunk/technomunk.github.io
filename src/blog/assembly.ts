import hljs from 'highlight.js/lib/core'
import x86asm from 'highlight.js/lib/languages/x86asm'

import './blog.css'

hljs.registerLanguage('x86asm', x86asm)
hljs.highlightAll()
