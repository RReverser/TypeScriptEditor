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

    getPositionLeftChar(cursor: AceAjax.Position): string {
        return this.getDocument().getTextRange(new Range(
            cursor.row, cursor.column,
            cursor.row, cursor.column - 1
        ));
    }

    getLinesChars(lines: string[]): number {
        return lines.reduce((count: number, line: string) => count + line.length + 1, 0);
    }

    getChars(pos: AceAjax.Position): number {
        return this.getDocument().positionToIndex(pos);
    }

    getPosition(chars: number): AceAjax.Position {
        return this.getDocument().indexToPosition(chars);
    }
}

export = EditorPosition;
