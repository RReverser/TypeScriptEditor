/// <reference path="./lib/require.d.ts" />
/// <reference path="./lib/ace.d.ts" />
/// <amd-dependency path="ace/lib/oop" />
/// <amd-dependency path="ace/lib/event_emitter" />
define(["require", "exports", './AutoCompleteHandler', './AutoCompleteView', "ace/lib/oop", "ace/lib/event_emitter"], function(require, exports, AutoCompleteHandler, AutoCompleteView) {
    var AutoComplete = (function () {
        function AutoComplete(editor, scriptName, compilationService) {
            this.editor = editor;
            this.scriptName = scriptName;
            this.compilationService = compilationService;
            this.active = false;
            this.inputText = '';
            this.view = new AutoCompleteView(this);
            this.handler = new AutoCompleteHandler(this);
        }
        AutoComplete.prototype.setScriptName = function (name) {
            this.scriptName = name;
        };

        AutoComplete.prototype.compilation = function (cursor) {
            var compilationInfo = this.compilationService.getCursorCompilation(this.scriptName, cursor);

            if (!compilationInfo) {
                return 0;
            }

            var text = this.compilationService.matchText;
            var coords = this.editor.renderer.textToScreenCoordinates(cursor.row, cursor.column - text.length);

            this.view.setPosition(coords);
            this.inputText = text;

            var compilations = compilationInfo.entries;

            var matchFunc = function (elm) {
                return elm.name.slice(0, text.length) === text ? 1 : 0;
            };
            var matchCompare = function (a, b) {
                return matchFunc(b) - matchFunc(a);
            };
            var textCompare = function (a, b) {
                return (a.name === b.name) ? 0 : (a.name > b.name) ? 1 : -1;
            };
            var compare = function (a, b) {
                return matchCompare(a, b) || textCompare(a, b);
            };

            if (text.length > 0) {
                compilations = compilationInfo.entries.filter(function (elm) {
                    return elm.name.toLowerCase().slice(0, text.length) === text.toLowerCase();
                });
            }

            compilations = compilations.sort(compare);

            this.view.showCompilation(compilations);

            return compilations.length;
        };

        AutoComplete.prototype.refreshCompilation = function (e) {
            var cursor = this.editor.getCursorPosition();
            if (e.data.action == 'insertText') {
                cursor.column += 1;
            } else if (e.data.action == 'removeText') {
                if (e.data.text == '\n') {
                    this.deactivate();
                    return;
                }
            }

            this.compilation(cursor);
        };

        AutoComplete.prototype.activate = function () {
            this.view.show();
            var count = this.compilation(this.editor.getCursorPosition());
            if (!count) {
                this.view.hide();
                return;
            }
            this.editor.keyBinding.addKeyboardHandler(this.handler);
        };

        AutoComplete.prototype.deactivate = function () {
            this.editor.keyBinding.removeKeyboardHandler(this.handler);
            this.view.hide();
        };
        return AutoComplete;
    })();

    require('ace/lib/oop').implement(AutoComplete.prototype, require('ace/lib/event_emitter').EventEmitter);

    
    return AutoComplete;
});
//# sourceMappingURL=AutoComplete.js.map
