/// <reference path="./lib/require.d.ts" />
/// <reference path="./lib/ace.d.ts" />
/// <amd-dependency path="ace/range" />
define(["require", "exports", "ace/range"], function(require, exports) {
    var Range = require('ace/range');

    var EditorPosition = (function () {
        function EditorPosition(editor) {
            this.editor = editor;
        }
        EditorPosition.prototype.getPositionChars = function (pos) {
            return this.getChars(pos);
        };

        EditorPosition.prototype.getAcePositionFromChars = function (chars) {
            return this.getPosition(chars);
        };

        EditorPosition.prototype.getCurrentCharPosition = function () {
            return this.getPositionChars(this.editor.getCursorPosition());
        };

        EditorPosition.prototype.getCurrentLeftChar = function () {
            return this.getPositionLeftChar(this.editor.getCursorPosition());
        };

        EditorPosition.prototype.getDocument = function () {
            return this.editor.getSession().getDocument();
        };

        EditorPosition.prototype.getPositionLeftChar = function (cursor) {
            return this.getDocument().getTextRange(new Range(cursor.row, cursor.column, cursor.row, cursor.column - 1));
        };

        EditorPosition.prototype.getLinesChars = function (lines) {
            return lines.reduce(function (count, line) {
                return count + line.length + 1;
            }, 0);
        };

        EditorPosition.prototype.getChars = function (pos) {
            return this.getDocument().positionToIndex(pos);
        };

        EditorPosition.prototype.getPosition = function (chars) {
            return this.getDocument().indexToPosition(chars);
        };
        return EditorPosition;
    })();

    
    return EditorPosition;
});
//# sourceMappingURL=EditorPosition.js.map
