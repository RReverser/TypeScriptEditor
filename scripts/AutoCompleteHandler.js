/// <reference path="./lib/require.d.ts" />
/// <reference path="./lib/ace.d.ts" />
/// <amd-dependency path="ace/lib/oop" />
/// <amd-dependency path="ace/keyboard/hash_handler" />
define(["require", "exports", "ace/lib/oop", "ace/keyboard/hash_handler"], function(require, exports) {
    var AutoCompleteHandler = (function () {
        function AutoCompleteHandler(autoComplete) {
            this.autoComplete = autoComplete;
            AutoCompleteHandler.super_.call(this, {
                focusnext: {
                    bindKey: 'Down|Ctrl-n',
                    exec: function () {
                        return autoComplete.view.focusNext();
                    }
                },
                focusprev: {
                    bindKey: 'Up|Ctrl-p',
                    exec: function () {
                        return autoComplete.view.focusPrev();
                    }
                },
                cancel: {
                    bindKey: 'esc|Ctrl-g',
                    exec: function () {
                        return autoComplete.deactivate();
                    }
                },
                insertComplete: {
                    bindKey: 'Return|Tab',
                    exec: function (editor) {
                        editor.off('change', autoComplete.refreshCompilation);

                        for (var i = 0; i < autoComplete.inputText.length; i++) {
                            editor.remove('left');
                        }

                        var current = autoComplete.view.current;
                        if (current.length) {
                            editor.insert(current.data('name'));
                        }

                        autoComplete.deactivate();
                    }
                }
            });
        }
        AutoCompleteHandler.prototype.attach = function () {
            this.autoComplete.editor.on('change', this.autoComplete.refreshCompilation);
            this.autoComplete.active = true;
        };

        AutoCompleteHandler.prototype.detach = function () {
            this.autoComplete.editor.off('change', this.autoComplete.refreshCompilation);
            this.autoComplete.view.hide();
            this.autoComplete.active = false;
        };

        AutoCompleteHandler.prototype.handleKeyboard = function (data, hashId, key, keyCode) {
            if (hashId == -1) {
                if (" -=,[]_/()!';:<>".indexOf(key) != -1) {
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

            if (typeof command != 'string') {
                var args = command.args;
                command = command.command;
            }

            if (typeof command == 'string') {
                command = this.commands[command];
            }

            return { command: command, args: args };
        };
        return AutoCompleteHandler;
    })();

    require('ace/lib/oop').inherits(AutoCompleteHandler, require('ace/keyboard/hash_handler').HashHandler);

    
    return AutoCompleteHandler;
});
