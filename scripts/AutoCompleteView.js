/// <reference path="./lib/ace.d.ts" />
/// <reference path="./lib/jquery.d.ts" />
define(["require", "exports"], function(require, exports) {
    var AutoCompleteView = (function () {
        function AutoCompleteView(autoComplete) {
            this.autoComplete = autoComplete;
            this.selectedClassName = "ace_autocomplete_selected";
            this.current = null;
            this.wrap = $('<div class="ace_autocomplete" style="display: none; position: fixed; z-index: 1000" />');
            this.listElement = $('<ul style="list-style-type: none" />').appendTo(this.wrap);
            this.editor = autoComplete.editor;
            this.wrap.appendTo(this.editor.container);
        }
        AutoCompleteView.prototype.show = function () {
            this.wrap.show();
        };

        AutoCompleteView.prototype.hide = function () {
            this.wrap.hide();
            this.listElement.empty();
        };

        AutoCompleteView.prototype.setPosition = function (coords) {
            var top = coords.pageY + 20;
            var $container = $(this.editor.container);
            var bottom = top + this.wrap.height();
            var editorBottom = $container.offset().top + $container.height();
            this.wrap.css({
                top: (bottom < editorBottom ? top : (top - this.wrap.height() - 20)) + 'px',
                left: coords.pageX + 'px'
            });
        };

        AutoCompleteView.prototype.focus = function (item) {
            if (item.length) {
                this.current && this.current.removeClass(this.selectedClassName);
                this.current = item.addClass(this.selectedClassName);
                this.adjustPosition();
            }
        };

        AutoCompleteView.prototype.focusNext = function () {
            this.focus(this.current.next());
        };

        AutoCompleteView.prototype.focusPrev = function () {
            this.focus(this.current.prev());
        };

        AutoCompleteView.prototype.ensureFocus = function () {
            if (!this.current) {
                this.focus(this.listElement.children(':first-child'));
            }
        };

        AutoCompleteView.prototype.adjustPosition = function () {
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
        };

        AutoCompleteView.prototype.showCompilation = function (infos) {
            if (infos.length > 0) {
                this.listElement.html(infos.map(function (info) {
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
        };
        return AutoCompleteView;
    })();

    
    return AutoCompleteView;
});
//# sourceMappingURL=AutoCompleteView.js.map
