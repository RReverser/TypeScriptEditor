/// <reference path="./lib/ace.d.ts" />
/// <reference path="./lib/ace/mode/typescript/typescriptServices.d.ts" />
define(["require", "exports", './EditorPosition'], function(require, exports, EditorPosition) {
    var CompilationService = (function () {
        function CompilationService(editor, serviceShim) {
            this.editor = editor;
            this.serviceShim = serviceShim;
            this.editorPos = new EditorPosition(editor);
        }
        CompilationService.prototype.getCompilation = function (script, charpos, isMemberCompletion) {
            var _this = this;
            var compInfo = this.serviceShim.languageService.getCompletionsAtPosition(script, charpos, isMemberCompletion);
            if (compInfo) {
                compInfo.entries = compInfo.entries.map(function (compInfo) {
                    return _this.serviceShim.languageService.getCompletionEntryDetails(script, charpos, compInfo.name);
                }, this);
            }
            return compInfo;
        };

        CompilationService.prototype.getCursorCompilation = function (script, cursor) {
            var pos = this.editorPos.getPositionChars(cursor);
            var text = this.editor.session.getLine(cursor.row).slice(0, cursor.column);
            var isMemberCompletion = false;
            var matches = text.match(/\.([a-zA-Z_0-9\$]*$)/);

            if (matches) {
                this.matchText = matches[1];
                isMemberCompletion = true;
                pos -= this.matchText.length;
            } else {
                matches = text.match(/[a-zA-Z_0-9\$]*$/);
                this.matchText = matches[0];
            }

            return this.getCompilation(script, pos, isMemberCompletion);
        };
        return CompilationService;
    })();

    
    return CompilationService;
});
//# sourceMappingURL=CompilationService.js.map
