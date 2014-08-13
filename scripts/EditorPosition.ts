/// <reference path="./lib/require.d.ts" />
/// <reference path="./lib/ace.d.ts" />
/// <amd-dependency path="ace/range" />

var Range: typeof AceAjax.Range = require('ace/range');

class EditorPosition {
    constructor(private editor:AceAjax.Editor) {
    }

    getPositionChars(pos: AceAjax.Position): number {
        return this.getChars(pos);
    }

    getAcePositionFromChars(chars: number): AceAjax.Position {
        return this.getPosition(chars);
    }

    getCurrentCharPosition(): number {
        return this.getPositionChars(this.editor.getCursorPosition());
    }

    getCurrentLeftChar(): string {
        return this.getPositionLeftChar(this.editor.getCursorPosition());
    }

    getDocument(): AceAjax.Document {
        return this.editor.getSession().getDocument();
    }

    getPositionChar(cursor: AceAjax.Position): string {
        return this.getDocument().getTextRange(new Range(
            cursor.row, cursor.column,
            cursor.row, cursor.column + 1
        ));
    }

    getPositionLeftChar(cursor: AceAjax.Position): string {
        return this.getDocument().getTextRange(new Range(
            cursor.row, cursor.column,
            cursor.row, cursor.column - 1
        ));
    }

    getLinesChars(lines: string[]): number {
        return lines.reduce((count:number, line:string) => count + line.length + 1, 0);
    }

    getChars(pos: AceAjax.Position): number {
        return this.getLinesChars(this.getDocument().getLines(0, pos.row - 1)) + pos.column;
    }

    getPosition(chars: number): AceAjax.Position {
        var doc = this.getDocument();
        var lines = doc.getAllLines();
        var count = 0;
        var row = 0;
        for (var i in lines) {
            var line = lines[i];
            if (chars < (count + (line.length + 1))) {
                return {
                    row: row,
                    column: chars - count
                };
            }
            count += line.length + 1;
            row += 1;
        }
        return {
            row: row,
            column: chars - count
        };
    }
}

export = EditorPosition;