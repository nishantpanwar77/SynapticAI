export class CodeHighlighter {
  private static readonly tokenColors = {
    keyword: '#569CD6', // blue for keywords
    function: '#DCDCAA', // yellow for functions
    number: '#B5CEA8', // light green for numbers
    string: '#CE9178', // orange for strings
    comment: '#6A9955', // green for comments
    operator: '#D4D4D4', // light gray for operators
    punctuation: '#D4D4D4', // light gray for punctuation
    variable: '#9CDCFE', // light blue for variables
    class: '#4EC9B0', // turquoise for classes
    default: '#D4D4D4', // default color
  };

  private static readonly keywords = [
    'function',
    'return',
    'if',
    'else',
    'for',
    'while',
    'do',
    'break',
    'continue',
    'switch',
    'case',
    'default',
    'try',
    'catch',
    'finally',
    'throw',
    'class',
    'extends',
    'implements',
    'new',
    'this',
    'super',
    'import',
    'export',
    'default',
    'null',
    'undefined',
    'true',
    'false',
    'const',
    'let',
    'var',
    'async',
    'await',
    'static',
    'get',
    'set',
    'typeof',
    'instanceof',
    'in',
    'void',
    'delete',
  ];

  private static readonly operators = [
    '+',
    '-',
    '*',
    '/',
    '%',
    '=',
    '==',
    '===',
    '!=',
    '!==',
    '>',
    '<',
    '>=',
    '<=',
    '&&',
    '||',
    '!',
    '&',
    '|',
    '^',
    '++',
    '--',
    '+=',
    '-=',
    '*=',
    '/=',
    '%=',
    '=>',
  ];

  static highlight(code: string): string {
    // Escape HTML characters
    code = this.escapeHtml(code);

    // Track state for multi-line comments and strings
    let inMultilineComment = false;
    let inString = false;
    let stringChar = '';
    let result = '';

    // Split code into lines for better processing
    const lines = code.split('\n');

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      let tokens = this.tokenize(line);
      let coloredLine = '';

      for (const token of tokens) {
        // Handle multi-line comments
        if (token.match(/^\/\*/)) {
          inMultilineComment = true;
        }
        if (inMultilineComment) {
          coloredLine += `<span style="color: ${this.tokenColors.comment}">${token}</span>`;
          if (token.match(/\*\/$/)) {
            inMultilineComment = false;
          }
          continue;
        }

        // Handle strings
        if (!inString && (token.startsWith('"') || token.startsWith("'"))) {
          inString = true;
          stringChar = token[0];
        }
        if (inString) {
          coloredLine += `<span style="color: ${this.tokenColors.string}">${token}</span>`;
          if (
            token.endsWith(stringChar) &&
            !token.endsWith('\\' + stringChar)
          ) {
            inString = false;
          }
          continue;
        }

        // Handle single-line comments
        if (token.startsWith('//')) {
          coloredLine += `<span style="color: ${this.tokenColors.comment}">${token}</span>`;
          break; // Rest of the line is comment
        }

        // Handle numbers
        if (token.match(/^\d+/)) {
          coloredLine += `<span style="color: ${this.tokenColors.number}">${token}</span>`;
          continue;
        }

        // Handle keywords
        if (this.keywords.includes(token)) {
          coloredLine += `<span style="color: ${this.tokenColors.keyword}">${token}</span>`;
          continue;
        }

        // Handle operators
        if (this.operators.includes(token)) {
          coloredLine += `<span style="color: ${this.tokenColors.operator}">${token}</span>`;
          continue;
        }

        // Handle function declarations
        if (token.match(/^[a-zA-Z_$][a-zA-Z0-9_$]*(?=\s*\()/)) {
          coloredLine += `<span style="color: ${this.tokenColors.function}">${token}</span>`;
          continue;
        }

        // Handle punctuation
        if (token.match(/[{}()\[\].,;]/)) {
          coloredLine += `<span style="color: ${this.tokenColors.punctuation}">${token}</span>`;
          continue;
        }

        // Default color for other tokens
        coloredLine += `<span style="color: ${this.tokenColors.default}">${token}</span>`;
      }

      result += coloredLine + '\n';
    }

    return result;
  }

  private static tokenize(line: string): string[] {
    const tokens: string[] = [];
    let currentToken = '';
    let i = 0;

    while (i < line.length) {
      const char = line[i];

      // Handle comments
      if (char === '/' && line[i + 1] === '/') {
        if (currentToken) tokens.push(currentToken);
        tokens.push(line.slice(i));
        break;
      }

      // Handle strings
      if (char === '"' || char === "'") {
        if (currentToken) tokens.push(currentToken);
        currentToken = char;
        i++;
        while (i < line.length && line[i] !== char) {
          currentToken += line[i];
          i++;
        }
        if (i < line.length) currentToken += line[i];
        tokens.push(currentToken);
        currentToken = '';
        i++;
        continue;
      }

      // Handle operators and punctuation
      if (
        this.operators.some((op) => line.startsWith(op, i)) ||
        char.match(/[{}()\[\].,;]/)
      ) {
        if (currentToken) tokens.push(currentToken);
        currentToken = char;
        if (this.operators.some((op) => line.startsWith(op, i))) {
          const op = this.operators.find((op) => line.startsWith(op, i))!;
          currentToken = op;
          i += op.length;
        } else {
          i++;
        }
        tokens.push(currentToken);
        currentToken = '';
        continue;
      }

      // Handle whitespace
      if (char.match(/\s/)) {
        if (currentToken) {
          tokens.push(currentToken);
          currentToken = '';
        }
        tokens.push(char);
        i++;
        continue;
      }

      currentToken += char;
      i++;
    }

    if (currentToken) tokens.push(currentToken);
    return tokens;
  }

  private static escapeHtml(text: string): string {
    const htmlEntities: { [key: string]: string } = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return text.replace(/[&<>"']/g, (char) => htmlEntities[char]);
  }
}
