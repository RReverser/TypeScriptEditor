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

        EditorPosition.prototype.getPositionChar = function (cursor) {
            return this.getDocument().getTextRange(new Range(cursor.row, cursor.column, cursor.row, cursor.column + 1));
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
            return this.getLinesChars(this.getDocument().getLines(0, pos.row - 1)) + pos.column;
        };

        EditorPosition.prototype.getPosition = function (chars) {
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
        };
        return EditorPosition;
    })();

    
    return EditorPosition;
});
