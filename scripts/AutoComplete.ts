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

    show() {
        this.view.show();
    }

    hide() {
        this.view.hide();
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

        if (this.inputText.length > 0) {
            compilations = compilationInfo.entries.filter(
                elm => elm.name.toLowerCase().indexOf(this.inputText.toLowerCase()) == 0
            );
        }

        var matchFunc = elm => elm.name.indexOf(this.inputText) == 0 ? 1 : 0;
        var matchCompare = (a, b) => matchFunc(b) - matchFunc(a);
        var textCompare = (a, b) => (a.name == b.name) ? 0 : (a.name > b.name) ? 1 : -1;
        var compare = (a, b) => matchCompare(a, b) || textCompare(a, b);

        compilations = compilations.sort(compare);

        this.showCompilation(compilations);

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

    showCompilation(infos) {
        this.view.showCompilation(infos);
    }

    activate() {
        this.show();
        var count = this.compilation(this.editor.getCursorPosition());
        if (!(count > 0)) {
            this.hide();
            return;
        }
        this.editor.keyBinding.addKeyboardHandler(this.handler);
    }

    deactivate() {
        this.editor.keyBinding.removeKeyboardHandler(this.handler);
    }
}

require('ace/lib/oop').implement(AutoComplete.prototype, require('ace/lib/event_emitter').EventEmitter);

export = AutoComplete;