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

        AutoComplete.prototype.show = function () {
            this.view.show();
        };

        AutoComplete.prototype.hide = function () {
            this.view.hide();
        };

        AutoComplete.prototype.compilation = function (cursor) {
            var _this = this;
            var compilationInfo = this.compilationService.getCursorCompilation(this.scriptName, cursor);

            if (!compilationInfo) {
                return 0;
            }

            var text = this.compilationService.matchText;
            var coords = this.editor.renderer.textToScreenCoordinates(cursor.row, cursor.column - text.length);

            this.view.setPosition(coords);
            this.inputText = text;

            var compilations = compilationInfo.entries;

            if (this.inputText.length > 0) {
                compilations = compilationInfo.entries.filter(function (elm) {
                    return elm.name.toLowerCase().indexOf(_this.inputText.toLowerCase()) == 0;
                });
            }

            var matchFunc = function (elm) {
                return elm.name.indexOf(_this.inputText) == 0 ? 1 : 0;
            };
            var matchCompare = function (a, b) {
                return matchFunc(b) - matchFunc(a);
            };
            var textCompare = function (a, b) {
                return (a.name == b.name) ? 0 : (a.name > b.name) ? 1 : -1;
            };
            var compare = function (a, b) {
                return matchCompare(a, b) || textCompare(a, b);
            };

            compilations = compilations.sort(compare);

            this.showCompilation(compilations);

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

        AutoComplete.prototype.showCompilation = function (infos) {
            this.view.showCompilation(infos);
        };

        AutoComplete.prototype.activate = function () {
            this.show();
            var count = this.compilation(this.editor.getCursorPosition());
            if (!(count > 0)) {
                this.hide();
                return;
            }
            this.editor.keyBinding.addKeyboardHandler(this.handler);
        };

        AutoComplete.prototype.deactivate = function () {
            this.editor.keyBinding.removeKeyboardHandler(this.handler);
        };
        return AutoComplete;
    })();

    require('ace/lib/oop').implement(AutoComplete.prototype, require('ace/lib/event_emitter').EventEmitter);

    
    return AutoComplete;
});
