export interface SyntaxRule {
  pattern: RegExp;
  className: string;
}

export interface Token {
  text: string;
  type: string | null;
}

export interface LanguageRules {
  [key: string]: SyntaxRule;
}
export interface SyntaxRules {
  [key: string]: LanguageRules;
}

export const syntaxRules: SyntaxRules = {
  typescript: {
    keywords: {
      pattern:
        /\b(function|const|let|var|if|else|for|while|return|class|interface|type|import|export|from|async|await|extends|implements|namespace|enum|declare|abstract|static|public|private|protected|readonly|new|this|super|typeof|instanceof|in|of|as|is|null|undefined|void|never|any|unknown|boolean|string|number|bigint|symbol|object)\b/g,
      className: 'keyword',
    },
    builtins: {
      pattern:
        /\b(Array|Object|String|Number|Boolean|Date|RegExp|Map|Set|Promise|Symbol|BigInt|Function|Error|JSON|Math|console|window|document|process|global|module|exports|require)\b/g,
      className: 'builtin',
    },
    strings: {
      pattern: /(["'`])(?:(?=(\\?))\2.)*?\1/g,
      className: 'string',
    },
    comments: {
      pattern: /\/\/.*$/gm,
      className: 'comment',
    },
    multilineComments: {
      pattern: /\/\*[\s\S]*?\*\//g,
      className: 'comment',
    },
    numbers: {
      pattern: /\b\d+\.?\d*\b/g,
      className: 'number',
    },
    literals: {
      pattern: /\b(true|false)\b/g,
      className: 'literal',
    },
    decorators: {
      pattern: /@\w+/g,
      className: 'decorator',
    },
  },
  javascript: {
    keywords: {
      pattern:
        /\b(function|const|let|var|if|else|for|while|do|switch|case|default|break|continue|return|try|catch|finally|throw|class|extends|import|export|from|async|await|new|this|super|typeof|instanceof|in|of|null|undefined|void|delete|yield)\b/g,
      className: 'keyword',
    },
    builtins: {
      pattern:
        /\b(Array|Object|String|Number|Boolean|Date|RegExp|Map|Set|Promise|Symbol|BigInt|Function|Error|JSON|Math|console|window|document|process|global|module|exports|require)\b/g,
      className: 'builtin',
    },
    strings: {
      pattern: /(["'`])(?:(?=(\\?))\2.)*?\1/g,
      className: 'string',
    },
    comments: {
      pattern: /\/\/.*$/gm,
      className: 'comment',
    },
    multilineComments: {
      pattern: /\/\*[\s\S]*?\*\//g,
      className: 'comment',
    },
    numbers: {
      pattern: /\b\d+\.?\d*\b/g,
      className: 'number',
    },
    literals: {
      pattern: /\b(true|false)\b/g,
      className: 'literal',
    },
  },
  python: {
    keywords: {
      pattern:
        /\b(and|as|assert|async|await|break|class|continue|def|del|elif|else|except|False|finally|for|from|global|if|import|in|is|lambda|None|nonlocal|not|or|pass|raise|return|True|try|while|with|yield)\b/g,
      className: 'keyword',
    },
    builtins: {
      pattern:
        /\b(abs|all|any|ascii|bin|bool|bytes|callable|chr|classmethod|compile|complex|delattr|dict|dir|divmod|enumerate|eval|exec|filter|float|format|frozenset|getattr|globals|hasattr|hash|help|hex|id|input|int|isinstance|issubclass|iter|len|list|locals|map|max|memoryview|min|next|object|oct|open|ord|pow|print|property|range|repr|reversed|round|set|setattr|slice|sorted|staticmethod|str|sum|super|tuple|type|vars|zip)\b/g,
      className: 'builtin',
    },
    strings: {
      pattern: /(["'])(?:(?=(\\?))\2.)*?\1/g,
      className: 'string',
    },
    comments: {
      pattern: /#.*$/gm,
      className: 'comment',
    },
    numbers: {
      pattern: /\b\d+\.?\d*\b/g,
      className: 'number',
    },
    literals: {
      pattern: /\b(True|False|None)\b/g,
      className: 'literal',
    },
  },
  java: {
    keywords: {
      pattern:
        /\b(abstract|assert|boolean|break|byte|case|catch|char|class|const|continue|default|do|double|else|enum|extends|final|finally|float|for|if|goto|implements|import|instanceof|int|interface|long|native|new|package|private|protected|public|return|short|static|strictfp|super|switch|synchronized|this|throw|throws|transient|try|void|volatile|while)\b/g,
      className: 'keyword',
    },
    types: {
      pattern:
        /\b(String|Integer|Double|Float|Boolean|Long|Short|Byte|Character|Object|Class|System|Math|Thread|Exception|RuntimeException)\b/g,
      className: 'type',
    },
    strings: {
      pattern: /(["'])(?:(?=(\\?))\2.)*?\1/g,
      className: 'string',
    },
    comments: {
      pattern: /\/\/.*$/gm,
      className: 'comment',
    },
    multilineComments: {
      pattern: /\/\*[\s\S]*?\*\//g,
      className: 'comment',
    },
    numbers: {
      pattern: /\b\d+\.?\d*[fFdDlL]?\b/g,
      className: 'number',
    },
    literals: {
      pattern: /\b(true|false|null)\b/g,
      className: 'literal',
    },
  },
  dart: {
    keywords: {
      pattern:
        /\b(abstract|as|assert|async|await|break|case|catch|class|const|continue|covariant|default|deferred|do|dynamic|else|enum|export|extends|extension|external|factory|false|final|finally|for|Function|get|hide|if|implements|import|in|interface|is|late|library|mixin|new|null|on|operator|part|required|rethrow|return|set|show|static|super|switch|sync|this|throw|true|try|typedef|var|void|while|with|yield)\b/g,
      className: 'keyword',
    },
    types: {
      pattern:
        /\b(int|double|String|bool|List|Map|Set|dynamic|Object|num|void|Future|Stream|Iterable|Never)\b/g,
      className: 'type',
    },
    strings: {
      pattern: /(["'])(?:(?=(\\?))\2.)*?\1/g,
      className: 'string',
    },
    comments: {
      pattern: /\/\/.*$/gm,
      className: 'comment',
    },
    multilineComments: {
      pattern: /\/\*[\s\S]*?\*\//g,
      className: 'comment',
    },
    numbers: {
      pattern: /\b\d+\.?\d*\b/g,
      className: 'number',
    },
    literals: {
      pattern: /\b(true|false|null)\b/g,
      className: 'literal',
    },
  },
  cpp: {
    keywords: {
      pattern:
        /\b(alignas|alignof|and|and_eq|asm|auto|bitand|bitor|bool|break|case|catch|char|char8_t|char16_t|char32_t|class|compl|concept|const|consteval|constexpr|constinit|const_cast|continue|co_await|co_return|co_yield|decltype|default|delete|do|double|dynamic_cast|else|enum|explicit|export|extern|false|float|for|friend|goto|if|inline|int|long|mutable|namespace|new|noexcept|not|not_eq|nullptr|operator|or|or_eq|private|protected|public|register|reinterpret_cast|requires|return|short|signed|sizeof|static|static_assert|static_cast|struct|switch|template|this|thread_local|throw|true|try|typedef|typeid|typename|union|unsigned|using|virtual|void|volatile|wchar_t|while|xor|xor_eq)\b/g,
      className: 'keyword',
    },
    builtins: {
      pattern:
        /\b(std|string|vector|map|set|list|queue|stack|pair|unique_ptr|shared_ptr|weak_ptr|function|thread|mutex|condition_variable|atomic|iostream|fstream|sstream|algorithm|iterator|numeric|memory|utility)\b/g,
      className: 'builtin',
    },
    strings: {
      pattern: /(["'])(?:(?=(\\?))\2.)*?\1/g,
      className: 'string',
    },
    comments: {
      pattern: /\/\/.*$/gm,
      className: 'comment',
    },
    multilineComments: {
      pattern: /\/\*[\s\S]*?\*\//g,
      className: 'comment',
    },
    numbers: {
      pattern: /\b\d+\.?\d*[fFlLuU]?\b/g,
      className: 'number',
    },
    literals: {
      pattern: /\b(true|false|nullptr)\b/g,
      className: 'literal',
    },
    preprocessor: {
      pattern: /#\s*\w+/g,
      className: 'preprocessor',
    },
  },
  csharp: {
    keywords: {
      pattern:
        /\b(abstract|as|base|bool|break|byte|case|catch|char|checked|class|const|continue|decimal|default|delegate|do|double|else|enum|event|explicit|extern|false|finally|fixed|float|for|foreach|goto|if|implicit|in|int|interface|internal|is|lock|long|namespace|new|null|object|operator|out|override|params|private|protected|public|readonly|ref|return|sbyte|sealed|short|sizeof|stackalloc|static|string|struct|switch|this|throw|true|try|typeof|uint|ulong|unchecked|unsafe|ushort|using|virtual|void|volatile|while)\b/g,
      className: 'keyword',
    },
    types: {
      pattern:
        /\b(System|String|Object|Console|Math|DateTime|TimeSpan|Guid|List|Dictionary|HashSet|Queue|Stack|Task|Thread|File|Directory|Path|Stream|Exception)\b/g,
      className: 'type',
    },
    strings: {
      pattern: /(["'])(?:(?=(\\?))\2.)*?\1/g,
      className: 'string',
    },
    comments: {
      pattern: /\/\/.*$/gm,
      className: 'comment',
    },
    multilineComments: {
      pattern: /\/\*[\s\S]*?\*\//g,
      className: 'comment',
    },
    numbers: {
      pattern: /\b\d+\.?\d*[fFdDmM]?\b/g,
      className: 'number',
    },
    literals: {
      pattern: /\b(true|false|null)\b/g,
      className: 'literal',
    },
  },
  go: {
    keywords: {
      pattern:
        /\b(break|case|chan|const|continue|default|defer|else|fallthrough|for|func|go|goto|if|import|interface|map|package|range|return|select|struct|switch|type|var)\b/g,
      className: 'keyword',
    },
    types: {
      pattern:
        /\b(bool|byte|complex64|complex128|error|float32|float64|int|int8|int16|int32|int64|rune|string|uint|uint8|uint16|uint32|uint64|uintptr)\b/g,
      className: 'type',
    },
    builtins: {
      pattern:
        /\b(append|cap|close|complex|copy|delete|imag|len|make|new|panic|print|println|real|recover)\b/g,
      className: 'builtin',
    },
    strings: {
      pattern: /(["'`])(?:(?=(\\?))\2.)*?\1/g,
      className: 'string',
    },
    comments: {
      pattern: /\/\/.*$/gm,
      className: 'comment',
    },
    multilineComments: {
      pattern: /\/\*[\s\S]*?\*\//g,
      className: 'comment',
    },
    numbers: {
      pattern: /\b\d+\.?\d*\b/g,
      className: 'number',
    },
    literals: {
      pattern: /\b(true|false|nil|iota)\b/g,
      className: 'literal',
    },
  },
  rust: {
    keywords: {
      pattern:
        /\b(as|async|await|break|const|continue|crate|dyn|else|enum|extern|false|fn|for|if|impl|in|let|loop|match|mod|move|mut|pub|ref|return|self|Self|static|struct|super|trait|true|type|unsafe|use|where|while)\b/g,
      className: 'keyword',
    },
    types: {
      pattern:
        /\b(i8|i16|i32|i64|i128|isize|u8|u16|u32|u64|u128|usize|f32|f64|bool|char|str|String|Vec|Option|Result|Box|Rc|Arc|Cell|RefCell|HashMap|HashSet|BTreeMap|BTreeSet)\b/g,
      className: 'type',
    },
    strings: {
      pattern: /(["'])(?:(?=(\\?))\2.)*?\1/g,
      className: 'string',
    },
    comments: {
      pattern: /\/\/.*$/gm,
      className: 'comment',
    },
    multilineComments: {
      pattern: /\/\*[\s\S]*?\*\//g,
      className: 'comment',
    },
    numbers: {
      pattern: /\b\d+\.?\d*\b/g,
      className: 'number',
    },
    literals: {
      pattern: /\b(true|false|None|Some|Ok|Err)\b/g,
      className: 'literal',
    },
    attributes: {
      pattern: /#\[[\s\S]*?\]/g,
      className: 'attribute',
    },
  },
  swift: {
    keywords: {
      pattern:
        /\b(associatedtype|class|deinit|enum|extension|fileprivate|func|import|init|inout|internal|let|open|operator|private|protocol|public|rethrows|static|struct|subscript|typealias|var|break|case|continue|default|defer|do|else|fallthrough|for|guard|if|in|repeat|return|switch|where|while|as|Any|catch|false|is|nil|super|self|Self|throw|throws|true|try)\b/g,
      className: 'keyword',
    },
    types: {
      pattern:
        /\b(Int|Double|Float|Bool|String|Character|Optional|Array|Dictionary|Set|Result|Error)\b/g,
      className: 'type',
    },
    strings: {
      pattern: /(["'])(?:(?=(\\?))\2.)*?\1/g,
      className: 'string',
    },
    comments: {
      pattern: /\/\/.*$/gm,
      className: 'comment',
    },
    multilineComments: {
      pattern: /\/\*[\s\S]*?\*\//g,
      className: 'comment',
    },
    numbers: {
      pattern: /\b\d+\.?\d*\b/g,
      className: 'number',
    },
    literals: {
      pattern: /\b(true|false|nil)\b/g,
      className: 'literal',
    },
  },
  kotlin: {
    keywords: {
      pattern:
        /\b(abstract|actual|annotation|as|break|by|catch|class|companion|const|constructor|continue|crossinline|data|do|dynamic|else|enum|expect|external|false|final|finally|for|fun|get|if|import|in|infix|init|inline|inner|interface|internal|is|lateinit|noinline|null|object|open|operator|out|override|package|private|protected|public|reified|return|sealed|set|super|suspend|tailrec|this|throw|true|try|typealias|typeof|val|var|vararg|when|where|while)\b/g,
      className: 'keyword',
    },
    types: {
      pattern:
        /\b(Boolean|Byte|Char|Double|Float|Int|Long|Short|String|Any|Unit|Nothing|Array|List|Map|Set|Pair|Triple)\b/g,
      className: 'type',
    },
    strings: {
      pattern: /(["'])(?:(?=(\\?))\2.)*?\1/g,
      className: 'string',
    },
    comments: {
      pattern: /\/\/.*$/gm,
      className: 'comment',
    },
    multilineComments: {
      pattern: /\/\*[\s\S]*?\*\//g,
      className: 'comment',
    },
    numbers: {
      pattern: /\b\d+\.?\d*[fFlL]?\b/g,
      className: 'number',
    },
    literals: {
      pattern: /\b(true|false|null)\b/g,
      className: 'literal',
    },
  },
  ruby: {
    keywords: {
      pattern:
        /\b(BEGIN|END|alias|and|begin|break|case|class|def|defined|do|else|elsif|end|ensure|false|for|if|in|module|next|nil|not|or|redo|rescue|retry|return|self|super|then|true|undef|unless|until|when|while|yield)\b/g,
      className: 'keyword',
    },
    builtins: {
      pattern:
        /\b(Array|Hash|String|Symbol|Integer|Float|Numeric|TrueClass|FalseClass|NilClass|Object|Module|Class|Kernel|BasicObject)\b/g,
      className: 'builtin',
    },
    strings: {
      pattern: /(["'])(?:(?=(\\?))\2.)*?\1/g,
      className: 'string',
    },
    comments: {
      pattern: /#.*$/gm,
      className: 'comment',
    },
    numbers: {
      pattern: /\b\d+\.?\d*\b/g,
      className: 'number',
    },
    literals: {
      pattern: /\b(true|false|nil)\b/g,
      className: 'literal',
    },
    symbols: {
      pattern: /:[a-zA-Z_]\w*/g,
      className: 'symbol',
    },
  },
  php: {
    keywords: {
      pattern:
        /\b(abstract|and|array|as|break|callable|case|catch|class|clone|const|continue|declare|default|die|do|echo|else|elseif|empty|enddeclare|endfor|endforeach|endif|endswitch|endwhile|eval|exit|extends|final|finally|for|foreach|function|global|goto|if|implements|include|include_once|instanceof|insteadof|interface|isset|list|namespace|new|or|print|private|protected|public|require|require_once|return|static|switch|throw|trait|try|unset|use|var|while|xor|yield)\b/g,
      className: 'keyword',
    },
    variables: {
      pattern: /\$[a-zA-Z_]\w*/g,
      className: 'variable',
    },
    strings: {
      pattern: /(["'])(?:(?=(\\?))\2.)*?\1/g,
      className: 'string',
    },
    comments: {
      pattern: /\/\/.*$/gm,
      className: 'comment',
    },
    multilineComments: {
      pattern: /\/\*[\s\S]*?\*\//g,
      className: 'comment',
    },
    hashComments: {
      pattern: /#.*$/gm,
      className: 'comment',
    },
    numbers: {
      pattern: /\b\d+\.?\d*\b/g,
      className: 'number',
    },
    literals: {
      pattern: /\b(true|false|null)\b/g,
      className: 'literal',
    },
  },
  html: {
    comments: {
      pattern: /<!--[\s\S]*?-->/g,
      className: 'comment',
    },
    tags: {
      pattern: /<\/?[a-zA-Z][^>]*>/g,
      className: 'tag',
    },
    attributes: {
      pattern: /[a-zA-Z-]+(?=\s*=)/g,
      className: 'attribute',
    },
    strings: {
      pattern: /(["'])(?:(?=(\\?))\2.)*?\1/g,
      className: 'string',
    },
  },
  css: {
    comments: {
      pattern: /\/\*[\s\S]*?\*\//g,
      className: 'comment',
    },
    selectors: {
      pattern: /([.#]?[a-zA-Z][\w-]*)\s*(?=\{)/g,
      className: 'selector',
    },
    properties: {
      pattern: /([a-zA-Z-]+)\s*(?=:)/g,
      className: 'property',
    },
    strings: {
      pattern: /(["'])(?:(?=(\\?))\2.)*?\1/g,
      className: 'string',
    },
    numbers: {
      pattern:
        /-?\d+\.?\d*(px|em|rem|%|vh|vw|pt|cm|mm|in|pc|ex|ch|vmin|vmax)?/g,
      className: 'number',
    },
    colors: {
      pattern: /#[0-9a-fA-F]{3,8}\b/g,
      className: 'color',
    },
    important: {
      pattern: /!important/g,
      className: 'important',
    },
  },
  scss: {
    comments: {
      pattern: /\/\*[\s\S]*?\*\//g,
      className: 'comment',
    },
    lineComments: {
      pattern: /\/\/.*$/gm,
      className: 'comment',
    },
    variables: {
      pattern: /\$[a-zA-Z_][\w-]*/g,
      className: 'variable',
    },
    directives: {
      pattern:
        /@(import|include|extend|mixin|function|if|else|for|each|while|at-root|media|keyframes|supports)/g,
      className: 'keyword',
    },
    selectors: {
      pattern: /([.#]?[a-zA-Z][\w-]*)\s*(?=\{)/g,
      className: 'selector',
    },
    nesting: {
      pattern: /(&|::?[a-zA-Z-]+)/g,
      className: 'selector',
    },
    properties: {
      pattern: /([a-zA-Z-]+)\s*(?=:)/g,
      className: 'property',
    },
    strings: {
      pattern: /(["'])(?:(?=(\\?))\2.)*?\1/g,
      className: 'string',
    },
    numbers: {
      pattern:
        /-?\d+\.?\d*(px|em|rem|%|vh|vw|pt|cm|mm|in|pc|ex|ch|vmin|vmax)?/g,
      className: 'number',
    },
    colors: {
      pattern: /#[0-9a-fA-F]{3,8}\b/g,
      className: 'color',
    },
    important: {
      pattern: /!important/g,
      className: 'important',
    },
  },
  sql: {
    keywords: {
      pattern:
        /\b(SELECT|FROM|WHERE|JOIN|LEFT|RIGHT|INNER|OUTER|ON|AS|INSERT|INTO|VALUES|UPDATE|SET|DELETE|CREATE|TABLE|DATABASE|DROP|ALTER|ADD|COLUMN|PRIMARY|KEY|FOREIGN|REFERENCES|INDEX|UNIQUE|NOT|NULL|DEFAULT|ORDER|BY|GROUP|HAVING|LIMIT|OFFSET|UNION|ALL|DISTINCT|CASE|WHEN|THEN|ELSE|END|AND|OR|IN|EXISTS|BETWEEN|LIKE|IS|ASC|DESC)\b/gi,
      className: 'keyword',
    },
    strings: {
      pattern: /(["'`])(?:(?=(\\?))\2.)*?\1/g,
      className: 'string',
    },
    comments: {
      pattern: /--.*$/gm,
      className: 'comment',
    },
    multilineComments: {
      pattern: /\/\*[\s\S]*?\*\//g,
      className: 'comment',
    },
    numbers: {
      pattern: /\b\d+\.?\d*\b/g,
      className: 'number',
    },
    literals: {
      pattern: /\b(TRUE|FALSE|NULL)\b/gi,
      className: 'literal',
    },
  },
  json: {
    properties: {
      pattern: /"[^"]*"(?=\s*:)/g,
      className: 'property',
    },
    strings: {
      pattern: /"[^"]*"/g,
      className: 'string',
    },
    numbers: {
      pattern: /\b-?\d+\.?\d*([eE][+-]?\d+)?\b/g,
      className: 'number',
    },
    literals: {
      pattern: /\b(true|false|null)\b/g,
      className: 'literal',
    },
  },
  yaml: {
    properties: {
      pattern: /^[a-zA-Z_][\w]*(?=:)/gm,
      className: 'property',
    },
    strings: {
      pattern: /(["'])(?:(?=(\\?))\2.)*?\1/g,
      className: 'string',
    },
    comments: {
      pattern: /#.*$/gm,
      className: 'comment',
    },
    numbers: {
      pattern: /\b-?\d+\.?\d*\b/g,
      className: 'number',
    },
    literals: {
      pattern: /\b(true|false|null|yes|no|on|off)\b/gi,
      className: 'literal',
    },
  },
  shell: {
    keywords: {
      pattern:
        /\b(if|then|else|elif|fi|for|while|do|done|case|esac|function|return|break|continue|exit|export|source|alias|unset|set|shift|cd|echo|printf|read|test)\b/g,
      className: 'keyword',
    },
    variables: {
      pattern: /\$[a-zA-Z_][\w]*/g,
      className: 'variable',
    },
    variableSubstitution: {
      pattern: /\${[^}]+}/g,
      className: 'variable',
    },
    strings: {
      pattern: /(["'])(?:(?=(\\?))\2.)*?\1/g,
      className: 'string',
    },
    comments: {
      pattern: /#.*$/gm,
      className: 'comment',
    },
    numbers: {
      pattern: /\b\d+\b/g,
      className: 'number',
    },
  },
  bash: {
    keywords: {
      pattern:
        /\b(if|then|else|elif|fi|for|while|do|done|case|esac|function|return|break|continue|exit|export|source|alias|unset|set|shift|cd|echo|printf|read|test|local|declare|readonly|trap|kill|wait|eval|exec|ulimit|umask)\b/g,
      className: 'keyword',
    },
    variables: {
      pattern: /\$[a-zA-Z_][\w]*/g,
      className: 'variable',
    },
    variableSubstitution: {
      pattern: /\${[^}]+}/g,
      className: 'variable',
    },
    strings: {
      pattern: /(["'])(?:(?=(\\?))\2.)*?\1/g,
      className: 'string',
    },
    comments: {
      pattern: /#.*$/gm,
      className: 'comment',
    },
    numbers: {
      pattern: /\b\d+\b/g,
      className: 'number',
    },
  },
  powershell: {
    keywords: {
      pattern:
        /\b(Begin|Break|Catch|Class|Continue|Data|Define|Do|DynamicParam|Else|ElseIf|End|Enum|Exit|Filter|Finally|For|ForEach|From|Function|Hidden|If|In|InlineScript|Parallel|Param|Process|Return|Sequence|Switch|Throw|Trap|Try|Until|Using|Var|While|Workflow)\b/gi,
      className: 'keyword',
    },
    variables: {
      pattern: /\$[a-zA-Z_][\w]*/g,
      className: 'variable',
    },
    strings: {
      pattern: /(["'])(?:(?=(\\?))\2.)*?\1/g,
      className: 'string',
    },
    comments: {
      pattern: /#.*$/gm,
      className: 'comment',
    },
    multilineComments: {
      pattern: /<#[\s\S]*?#>/g,
      className: 'comment',
    },
    numbers: {
      pattern: /\b\d+\.?\d*\b/g,
      className: 'number',
    },
    literals: {
      pattern: /\$true|\$false|\$null/gi,
      className: 'literal',
    },
  },
  r: {
    keywords: {
      pattern:
        /\b(if|else|repeat|while|function|for|in|next|break|TRUE|FALSE|NULL|Inf|NaN|NA|NA_integer_|NA_real_|NA_complex_|NA_character_)\b/g,
      className: 'keyword',
    },
    builtins: {
      pattern:
        /\b(c|list|matrix|array|factor|data\.frame|as\.\w+|is\.\w+|length|dim|nrow|ncol|head|tail|summary|str|class|typeof|names|colnames|rownames|print|cat|paste|paste0|sprintf|substr|substring|strsplit|grep|gsub|sub|match|regexpr|gregexpr|regexec|tolower|toupper|chartr|nchar|trimws)\b/g,
      className: 'builtin',
    },
    strings: {
      pattern: /(["'])(?:(?=(\\?))\2.)*?\1/g,
      className: 'string',
    },
    comments: {
      pattern: /#.*$/gm,
      className: 'comment',
    },
    numbers: {
      pattern: /\b\d+\.?\d*([eE][+-]?\d+)?\b/g,
      className: 'number',
    },
    literals: {
      pattern: /\b(TRUE|FALSE|NULL|Inf|NaN|NA)\b/g,
      className: 'literal',
    },
  },
  matlab: {
    keywords: {
      pattern:
        /\b(break|case|catch|classdef|continue|else|elseif|end|for|function|global|if|otherwise|parfor|persistent|return|spmd|switch|try|while)\b/g,
      className: 'keyword',
    },
    strings: {
      pattern: /(["'])(?:(?=(\\?))\2.)*?\1/g,
      className: 'string',
    },
    comments: {
      pattern: /%.*$/gm,
      className: 'comment',
    },
    numbers: {
      pattern: /\b\d+\.?\d*([eE][+-]?\d+)?\b/g,
      className: 'number',
    },
    literals: {
      pattern: /\b(true|false|inf|Inf|nan|NaN|eps|pi)\b/g,
      className: 'literal',
    },
  },
  lua: {
    keywords: {
      pattern:
        /\b(and|break|do|else|elseif|end|false|for|function|if|in|local|nil|not|or|repeat|return|then|true|until|while)\b/g,
      className: 'keyword',
    },
    strings: {
      pattern: /(["'])(?:(?=(\\?))\2.)*?\1/g,
      className: 'string',
    },
    comments: {
      pattern: /--.*$/gm,
      className: 'comment',
    },
    multilineComments: {
      pattern: /--\[\[[\s\S]*?\]\]/g,
      className: 'comment',
    },
    numbers: {
      pattern: /\b\d+\.?\d*([eE][+-]?\d+)?\b/g,
      className: 'number',
    },
    literals: {
      pattern: /\b(true|false|nil)\b/g,
      className: 'literal',
    },
  },
  perl: {
    keywords: {
      pattern:
        /\b(and|cmp|continue|do|else|elsif|eq|for|foreach|ge|gt|if|last|le|lt|my|ne|next|not|or|our|package|redo|require|return|sub|unless|until|use|while|xor)\b/g,
      className: 'keyword',
    },
    scalarVariables: {
      pattern: /\$[a-zA-Z_]\w*/g,
      className: 'variable',
    },
    arrayVariables: {
      pattern: /@[a-zA-Z_]\w*/g,
      className: 'variable',
    },
    hashVariables: {
      pattern: /%[a-zA-Z_]\w*/g,
      className: 'variable',
    },
    strings: {
      pattern: /(["'])(?:(?=(\\?))\2.)*?\1/g,
      className: 'string',
    },
    comments: {
      pattern: /#.*$/gm,
      className: 'comment',
    },
    numbers: {
      pattern: /\b\d+\.?\d*\b/g,
      className: 'number',
    },
  },
  xml: {
    comments: {
      pattern: /<!--[\s\S]*?-->/g,
      className: 'comment',
    },
    tags: {
      pattern: /<\/?[a-zA-Z][\w:]*[^>]*>/g,
      className: 'tag',
    },
    attributes: {
      pattern: /[a-zA-Z-:]+(?=\s*=)/g,
      className: 'attribute',
    },
    strings: {
      pattern: /(["'])(?:(?=(\\?))\2.)*?\1/g,
      className: 'string',
    },
    cdata: {
      pattern: /<!\[CDATA\[[\s\S]*?\]\]>/g,
      className: 'cdata',
    },
  },
  markdown: {
    headers: {
      pattern: /^#{1,6}\s+.+$/gm,
      className: 'heading',
    },
    bold: {
      pattern: /\*\*[^*]+\*\*/g,
      className: 'bold',
    },
    italic: {
      pattern: /\*[^*]+\*/g,
      className: 'italic',
    },
    inlineCode: {
      pattern: /`[^`]+`/g,
      className: 'code',
    },
    codeBlocks: {
      pattern: /```[\s\S]*?```/g,
      className: 'code-block',
    },
    links: {
      pattern: /\[([^\]]+)\]\([^)]+\)/g,
      className: 'link',
    },
    quotes: {
      pattern: /^>\s+.+$/gm,
      className: 'quote',
    },
    lists: {
      pattern: /^[-*+]\s+.+$/gm,
      className: 'list',
    },
  },
  dockerfile: {
    instructions: {
      pattern:
        /\b(FROM|RUN|CMD|LABEL|EXPOSE|ENV|ADD|COPY|ENTRYPOINT|VOLUME|USER|WORKDIR|ARG|ONBUILD|STOPSIGNAL|HEALTHCHECK|SHELL)\b/gi,
      className: 'keyword',
    },
    strings: {
      pattern: /(["'])(?:(?=(\\?))\2.)*?\1/g,
      className: 'string',
    },
    comments: {
      pattern: /#.*$/gm,
      className: 'comment',
    },
  },
  nginx: {
    directives: {
      pattern:
        /\b(server|location|upstream|proxy_pass|root|index|try_files|rewrite|return|if|set|map|geo|limit_req|limit_conn|deny|allow|listen|server_name|access_log|error_log|include)\b/g,
      className: 'keyword',
    },
    strings: {
      pattern: /(["'])(?:(?=(\\?))\2.)*?\1/g,
      className: 'string',
    },
    comments: {
      pattern: /#.*$/gm,
      className: 'comment',
    },
    variables: {
      pattern: /\$[a-zA-Z_]\w*/g,
      className: 'variable',
    },
  },
  terraform: {
    keywords: {
      pattern:
        /\b(resource|data|variable|output|locals|module|provider|terraform|backend|required_providers|required_version)\b/g,
      className: 'keyword',
    },
    strings: {
      pattern: /(["'])(?:(?=(\\?))\2.)*?\1/g,
      className: 'string',
    },
    comments: {
      pattern: /#.*$/gm,
      className: 'comment',
    },
    multilineComments: {
      pattern: /\/\/.*$/gm,
      className: 'comment',
    },
    blockComments: {
      pattern: /\/\*[\s\S]*?\*\//g,
      className: 'comment',
    },
    literals: {
      pattern: /\b(true|false|null)\b/g,
      className: 'literal',
    },
    numbers: {
      pattern: /\b\d+\.?\d*\b/g,
      className: 'number',
    },
  },
  graphql: {
    keywords: {
      pattern:
        /\b(query|mutation|subscription|fragment|type|interface|enum|scalar|union|input|directive|schema|extend|implements)\b/g,
      className: 'keyword',
    },
    strings: {
      pattern: /(["'])(?:(?=(\\?))\2.)*?\1/g,
      className: 'string',
    },
    comments: {
      pattern: /#.*$/gm,
      className: 'comment',
    },
    types: {
      pattern: /\b(Int|Float|String|Boolean|ID)\b/g,
      className: 'type',
    },
    literals: {
      pattern: /\b(true|false|null)\b/g,
      className: 'literal',
    },
  },
};
