/// <reference path="./lib/ace.d.ts" />
/// <reference path="./lib/jquery.d.ts" />

import AutoComplete = require("./AutoComplete");

class AutoCompleteView {
    private selectedClassName = "ace_autocomplete_selected";
    private wrap = $('<div class="ace_autocomplete_selected" style="display: none; position: fixed; z-index: 1000" />');
    private listElement = $('<ul style="list-style-type: none" />').appendTo(this.wrap);
    public current = $();
    private editor: AceAjax.Editor;

    constructor(private autoComplete: AutoComplete) {
        this.editor = autoComplete.editor;
        this.wrap.appendTo(this.editor.container);
    }

    show(): void {
        this.wrap.show();
    }

    hide(): void {
        this.wrap.hide();
    }

    setPosition(coords: any): void {
        var top = coords.pageY + 20;
        var $container = $(this.editor.container);
        var bottom = top + this.wrap.height();
        var editorBottom = $container.offset().top + $container.height();
        this.wrap.css({
            top: (bottom < editorBottom ? top : (top - this.wrap.height() - 20)) + 'px',
            left: coords.pageX + 'px'
        });
    }

    focus(item: JQuery): void {
        if (item.length) {
            this.current.removeClass(this.selectedClassName);
            item.addClass(this.selectedClassName);
            this.adjustPosition();
        }
    }

    focusNext(): void {
        this.focus(this.current.next());
    }

    focusPrev(): void {
        this.focus(this.current.prev());
    }

    ensureFocus(): void {
        if (!this.current.length) {
            this.focus(this.listElement.children(':first-child'));
        }
    }

    adjustPosition() {
        if (!this.current.length) {
            return;
        }
        var wrapHeight = this.wrap.height();
        var elmOuterHeight = this.current.outerHeight();
        var preMargin = parseInt(this.listElement.css("margin-top").replace('px', ''), 10);
        var pos = this.current.position();
        if (pos.top >= (wrapHeight - elmOuterHeight)) {
            this.listElement.css("margin-top", (preMargin - elmOuterHeight) + 'px');
        }
        if (pos.top < 0) {
            return this.listElement.css("margin-top", (-pos.top + preMargin) + 'px');
        }
    }

    showCompilation(infos) {
        if (infos.length > 0) {
            this.listElement.html(infos.map(info => {
                var name = '<span class="label-name">' + info.name + '</span>';
                var type = info.type ? '<span class="label-type">' + info.type + '</span>' : '';
                var kind = '<span class="label-kind label-kind-' + info.kind + '">' + info.kind.charAt(0) + '</span>';

                return '<li data-name="' + info.name + '">' + kind + name + type + '</li>';
            }).join(''));

            this.show();
            this.ensureFocus();
        } else {
            this.hide();
        }
    }
}

export = AutoCompleteView;