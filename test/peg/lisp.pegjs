operator = [\-\+\*\/\%\<\>]
identifier = [a-zA-Z_][\w]*
integer = digits:[0-9]+ { return parseInt(digits.join("")) }

expression
    = '(' operator expression* ')'
    / identifier
    / integer
