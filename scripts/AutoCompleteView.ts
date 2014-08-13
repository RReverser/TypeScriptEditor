/// <reference path="./lib/ace.d.ts" />
/// <reference path="./lib/jquery.d.ts" />

import AutoComplete = require('./AutoComplete');

class AutoCompleteView {
    private selectedClassName = "ace_autocomplete_selected";
    public current: JQuery = null;
    private editor: AceAjax.Editor;
    private wrap = $('<div class="ace_autocomplete" style="display: none; position: fixed; z-index: 1000" />');
    private listElement = $('<ul style="list-style-type: none" />').appendTo(this.wrap);

    constructor(private autoComplete: AutoComplete) {
        this.editor = autoComplete.editor;
        this.wrap.appendTo(this.editor.container);
    }

    show(): void {
        this.wrap.show();
    }

    hide(): void {
        this.wrap.hide();
        this.listElement.empty();
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
            this.current && this.current.removeClass(this.selectedClassName);
            this.current = item.addClass(this.selectedClassName);
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
        if (!this.current) {
            this.focus(this.listElement.children(':first-child'));
        }
    }

    adjustPosition() {
        if (!this.current) {
            return;
        }
        var wrapHeight = this.wrap.height();
        var elmOuterHeight = this.current.outerHeight();
        var preMargin = parseInt(this.listElement.css('margin-top').replace('px', ''), 10);
        var pos = this.current.position();
        if (pos.top >= (wrapHeight - elmOuterHeight)) {
            this.listElement.css('margin-top', (preMargin - elmOuterHeight) + 'px');
        }
        if (pos.top < 0) {
            return this.listElement.css('margin-top', (-pos.top + preMargin) + 'px');
        }
    }

    showCompilation(infos) {
        if (infos.length > 0) {
            this.listElement.html(infos.map(info => {
                var name = '<span class="label-name">' + info.name + '</span>';
                var type = '<span class="label-type">' + info.type + '</span>';
                var kind = '<span class="label-kind label-kind-' + info.kind + '">' + info.kind.charAt(0) + '</span>';

                return '<li data-name="' + info.name + '">' + kind + name + type + '</li>';
            }).join(''));
            this.current = null;

            this.show();
            this.ensureFocus();
        } else {
            this.hide();
        }
    }
}

export = AutoCompleteView;
