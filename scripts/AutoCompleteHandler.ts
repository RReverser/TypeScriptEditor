/// <reference path="./lib/require.d.ts" />
/// <reference path="./lib/ace.d.ts" />
/// <amd-dependency path="ace/lib/oop" />
/// <amd-dependency path="ace/keyboard/hash_handler" />

import AutoComplete = require('./AutoComplete');
var HashHandler: Function = require('ace/keyboard/hash_handler').HashHandler;

class AutoCompleteHandler implements AceAjax.HashHandler {
    // AceAjax.HashHandler
    platform: string;
    commands: {[name: string]: AceAjax.EditorCommand};
    commandKeyBinding: {[hashId: number]: {[key: string]: AceAjax.EditorCommand}};
    addCommand: (command: AceAjax.EditorCommand) => void;
    removeCommand: (command: any) => void;
    bindKey: (key: string, command: any) => void;
    addCommands: (commands?: {[name: string]: any}) => void;
    removeCommands: (commands?: {[name: string]: any}) => void;
    bindKeys: (keyList: {[key: string]: any}) => void;
    parseKeys: (keys: string) => {key: string; hashId: number};
    findKeyCommand: (hashId: number, key: string) => any;

    constructor(private autoComplete: AutoComplete) {
        HashHandler.call(this, {
            focusnext: {
                bindKey: 'Down|Ctrl-n',
                exec: () => autoComplete.view.focusNext()
            },
            focusprev: {
                bindKey: 'Up|Ctrl-p',
                exec: () => autoComplete.view.focusPrev()
            },
            cancel: {
                bindKey: 'esc|Ctrl-g',
                exec: () => autoComplete.deactivate()
            },
            insertComplete: {
                bindKey: 'Return|Tab',
                exec: (editor: AceAjax.Editor) => {
                    editor.off('change', autoComplete.refreshCompilation);

                    for (var i = 0; i < autoComplete.inputText.length; i++) {
                        editor.remove('left');
                    }

                    var current = autoComplete.view.current;
                    if (current) {
                        editor.insert(current.data('name'));
                    }

                    autoComplete.deactivate();
                }
            }
        });
    }

    attach() {
        var ac = this.autoComplete;
        ac.editor.on('change', ac.refreshCompilation);
        ac.active = true;
    }

    detach() {
        var ac = this.autoComplete;
        ac.editor.off('change', ac.refreshCompilation);
        ac.active = false;
    }

    handleKeyboard(data: any, hashId: number, key: string, keyCode: number) {
        if (hashId == -1) {
            if (" -=,[]_/()!';:<>".indexOf(key) != -1) { //TODO
                this.autoComplete.deactivate();
            }
            return null;
        }

        var command = this.findKeyCommand(hashId, key);

        if (!command) {
            var defaultCommand = this.autoComplete.editor.commands.findKeyCommand(hashId, key);
            if (defaultCommand) {
                if (defaultCommand.name == 'backspace') {
                    return null;
                }
                this.autoComplete.deactivate();
            }
            return null;
        }

        if (typeof command !== 'string') {
            var args = command.args;
            command = command.command;
        }

        if (typeof command === 'string') {
            command = this.commands[command];
        }

        return {command: command, args: args};
    }
}

require('ace/lib/oop').implement(AutoCompleteHandler.prototype, HashHandler.prototype);

export = AutoCompleteHandler;
