/// <reference path="./lib/require.d.ts" />
/// <reference path="./lib/ace.d.ts" />
/// <amd-dependency path="ace/lib/oop" />
/// <amd-dependency path="ace/lib/event_emitter" />

import AutoCompleteHandler = require('./AutoCompleteHandler');
import AutoCompleteView = require('./AutoCompleteView');
import CompilationService = require('./CompilationService');

class AutoComplete {
    public active: boolean = false;
    public inputText: string = '';
    public handler: AutoCompleteHandler;
    public view: AutoCompleteView;

    constructor (public editor: AceAjax.Editor, private scriptName: string, private compilationService: CompilationService) {
        this.view = new AutoCompleteView(this);
        this.handler = new AutoCompleteHandler(this);
    }

    setScriptName(name) {
        this.scriptName = name;
    }

    compilation(cursor) {
        var compilationInfo = this.compilationService.getCursorCompilation(this.scriptName, cursor);

        if (!compilationInfo) {
            return 0;
        }

        var text = this.compilationService.matchText;
        var coords = this.editor.renderer.textToScreenCoordinates(cursor.row, cursor.column - text.length);

        this.view.setPosition(coords);
        this.inputText = text;

        var compilations = compilationInfo.entries;

        var matchFunc = elm => elm.name.slice(0, text.length) === text ? 1 : 0;
        var matchCompare = (a, b) => matchFunc(b) - matchFunc(a);
        var textCompare = (a, b) => (a.name === b.name) ? 0 : (a.name > b.name) ? 1 : -1;
        var compare = (a, b) => matchCompare(a, b) || textCompare(a, b);

        if (text.length > 0) {
            compilations = compilationInfo.entries.filter(elm => elm.name.toLowerCase().slice(0, text.length) === text.toLowerCase());
        }

        compilations = compilations.sort(compare);

        this.view.showCompilation(compilations);

        return compilations.length;
    }

    refreshCompilation(e) {
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
    }

    activate() {
        this.view.show();
        var count = this.compilation(this.editor.getCursorPosition());
        if (!count) {
            this.view.hide();
            return;
        }
        this.editor.keyBinding.addKeyboardHandler(this.handler);
    }

    deactivate() {
        this.editor.keyBinding.removeKeyboardHandler(this.handler);
        this.view.hide();
    }
}

require('ace/lib/oop').implement(AutoComplete.prototype, require('ace/lib/event_emitter').EventEmitter);

export = AutoComplete;
