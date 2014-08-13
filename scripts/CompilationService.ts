/// <reference path="./lib/ace.d.ts" />
/// <reference path="./lib/ace/mode/typescript/typescriptServices.d.ts" />

import EditorPosition = require('./EditorPosition');

class CompilationService {
    private editorPos: EditorPosition;// The ace control
    public matchText: string;

    constructor(private editor: AceAjax.Editor, private serviceShim: ts.LanguageServiceShim) {
        this.editorPos = new EditorPosition(editor);
    }

    getCompilation(script: string, charpos: number, isMemberCompletion: boolean): ts.CompletionInfo {
        var compInfo = this.serviceShim.languageService.getCompletionsAtPosition(script, charpos, isMemberCompletion);
        if (compInfo) {
            compInfo.entries = compInfo.entries.map(
                compInfo => this.serviceShim.languageService.getCompletionEntryDetails(script, charpos, compInfo.name),
                this
            );
        }
        return compInfo;
    }

    getCursorCompilation(script: string, cursor: AceAjax.Position): ts.CompletionInfo {
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
    }

    getCurrentPositionCompilation(script: string): ts.CompletionInfo {
        return this.getCursorCompilation(script, this.editor.getCursorPosition());
    }
}

export = CompilationService;