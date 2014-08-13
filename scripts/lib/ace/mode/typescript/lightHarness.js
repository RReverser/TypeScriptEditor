/// <reference path="./typescriptServices.d.ts" />
define(["require", "exports"], function(require, exports) {
    

    var ScriptInfo = (function () {
        function ScriptInfo(fileName, content, isOpen) {
            if (typeof isOpen === "undefined") { isOpen = true; }
            this.fileName = fileName;
            this.content = content;
            this.isOpen = isOpen;
            this.version = 1;
            this.editRanges = [];
            this.lineMap = null;
            this.setContent(content);
        }
        ScriptInfo.prototype.setContent = function (content) {
            this.content = content;
            this.lineMap = TypeScript.LineMap1.fromString(content);
        };

        ScriptInfo.prototype.updateContent = function (content) {
            this.editRanges = [];
            this.setContent(content);
            this.version++;
        };

        ScriptInfo.prototype.editContent = function (minChar, limChar, newText) {
            // Apply edits
            var prefix = this.content.substring(0, minChar);
            var middle = newText;
            var suffix = this.content.substring(limChar);
            this.setContent(prefix + middle + suffix);

            // Store edit range + new length of script
            this.editRanges.push({
                length: this.content.length,
                textChangeRange: new TypeScript.TextChangeRange(TypeScript.TextSpan.fromBounds(minChar, limChar), newText.length)
            });

            // Update version #
            this.version++;
        };

        ScriptInfo.prototype.getTextChangeRangeBetweenVersions = function (startVersion, endVersion) {
            if (startVersion === endVersion) {
                // No edits!
                return TypeScript.TextChangeRange.unchanged;
            }

            var initialEditRangeIndex = this.editRanges.length - (this.version - startVersion);
            var lastEditRangeIndex = this.editRanges.length - (this.version - endVersion);

            var entries = this.editRanges.slice(initialEditRangeIndex, lastEditRangeIndex);
            return TypeScript.TextChangeRange.collapseChangesAcrossMultipleVersions(entries.map(function (e) {
                return e.textChangeRange;
            }));
        };
        return ScriptInfo;
    })();
    exports.ScriptInfo = ScriptInfo;

    var ScriptSnapshotShim = (function () {
        function ScriptSnapshotShim(scriptInfo) {
            this.scriptInfo = scriptInfo;
            this.lineMap = null;
            this.textSnapshot = scriptInfo.content;
            this.version = scriptInfo.version;
        }
        ScriptSnapshotShim.prototype.getText = function (start, end) {
            return this.textSnapshot.substring(start, end);
        };

        ScriptSnapshotShim.prototype.getLength = function () {
            return this.textSnapshot.length;
        };

        ScriptSnapshotShim.prototype.getLineStartPositions = function () {
            if (this.lineMap === null) {
                this.lineMap = TypeScript.LineMap1.fromString(this.textSnapshot);
            }

            return JSON.stringify(this.lineMap.lineStarts());
        };

        ScriptSnapshotShim.prototype.getTextChangeRangeSinceVersion = function (scriptVersion) {
            var range = this.scriptInfo.getTextChangeRangeBetweenVersions(scriptVersion, this.version);
            if (range === null) {
                return null;
            }

            return JSON.stringify({ span: { start: range.span().start(), length: range.span().length() }, newLength: range.newLength() });
        };
        return ScriptSnapshotShim;
    })();

    var CancellationToken = (function () {
        function CancellationToken(cancellationToken) {
            this.cancellationToken = cancellationToken;
        }
        CancellationToken.prototype.isCancellationRequested = function () {
            return this.cancellationToken && this.cancellationToken.isCancellationRequested();
        };
        CancellationToken.None = new CancellationToken(null);
        return CancellationToken;
    })();

    var TypeScriptLS = (function () {
        function TypeScriptLS(cancellationToken) {
            if (typeof cancellationToken === "undefined") { cancellationToken = CancellationToken.None; }
            this.cancellationToken = cancellationToken;
            this.ls = null;
            this.fileNameToScript = {};
        }
        TypeScriptLS.prototype.getHostIdentifier = function () {
            return "TypeScriptLS";
        };

        TypeScriptLS.prototype.getScriptInfo = function (fileName) {
            return this.fileNameToScript[fileName];
        };

        TypeScriptLS.prototype.addScript = function (fileName, content) {
            this.fileNameToScript[fileName] = new ScriptInfo(fileName, content);
        };

        TypeScriptLS.prototype.updateScript = function (fileName, content) {
            var script = this.getScriptInfo(fileName);
            if (script) {
                script.updateContent(content);
                return;
            }

            this.addScript(fileName, content);
        };

        TypeScriptLS.prototype.editScript = function (fileName, minChar, limChar, newText) {
            var script = this.getScriptInfo(fileName);
            if (script) {
                script.editContent(minChar, limChar, newText);
                return;
            }

            throw new Error("No script with name '" + fileName + "'");
        };

        //////////////////////////////////////////////////////////////////////
        // ILogger implementation
        //
        TypeScriptLS.prototype.information = function () {
            return false;
        };
        TypeScriptLS.prototype.debug = function () {
            return true;
        };
        TypeScriptLS.prototype.warning = function () {
            return true;
        };
        TypeScriptLS.prototype.error = function () {
            return true;
        };
        TypeScriptLS.prototype.fatal = function () {
            return true;
        };

        TypeScriptLS.prototype.log = function (s) {
            // For debugging...
            //TypeScript.Environment.standardOut.WriteLine("TypeScriptLS:" + s);
        };

        //////////////////////////////////////////////////////////////////////
        // LanguageServiceShimHost implementation
        //
        /// Returns json for Tools.CompilationSettings
        TypeScriptLS.prototype.getCompilationSettings = function () {
            return JSON.stringify({});
        };

        TypeScriptLS.prototype.getCancellationToken = function () {
            return this.cancellationToken;
        };

        TypeScriptLS.prototype.getScriptFileNames = function () {
            var fileNames = [];
            ts.forEachKey(this.fileNameToScript, function (fileName) {
                fileNames.push(fileName);
            });
            return JSON.stringify(fileNames);
        };

        TypeScriptLS.prototype.getScriptSnapshot = function (fileName) {
            return new ScriptSnapshotShim(this.getScriptInfo(fileName));
        };

        TypeScriptLS.prototype.getScriptVersion = function (fileName) {
            return this.getScriptInfo(fileName).version;
        };

        TypeScriptLS.prototype.getScriptIsOpen = function (fileName) {
            return this.getScriptInfo(fileName).isOpen;
        };

        TypeScriptLS.prototype.getLocalizedDiagnosticMessages = function () {
            return JSON.stringify({});
        };

        /** Return a new instance of the language service shim, up-to-date wrt to typecheck.
        *  To access the non-shim (i.e. actual) language service, use the "ls.languageService" property.
        */
        TypeScriptLS.prototype.getLanguageService = function () {
            return this.ls = new TypeScript.Services.TypeScriptServicesFactory().createLanguageServiceShim(this);
        };

        /** Parse file given its source text */
        TypeScriptLS.prototype.parseSourceText = function (fileName, sourceText) {
            return TypeScript.Parser.parse(fileName, TypeScript.SimpleText.fromScriptSnapshot(sourceText), 1 /* ES5 */, TypeScript.isDTSFile(fileName)).sourceUnit();
        };

        /**
        * @param line 1 based index
        * @param col 1 based index
        */
        TypeScriptLS.prototype.lineColToPosition = function (fileName, line, col) {
            var script = this.fileNameToScript[fileName];
            assert.isNotNull(script);
            assert.isTrue(line >= 1);
            assert.isTrue(col >= 1);

            return script.lineMap.getPosition(line - 1, col - 1);
        };

        /**
        * @param line 0 based index
        * @param col 0 based index
        */
        TypeScriptLS.prototype.positionToZeroBasedLineCol = function (fileName, position) {
            var script = this.fileNameToScript[fileName];
            assert.isNotNull(script);

            var result = script.lineMap.getLineAndCharacterFromPosition(position);

            assert.isTrue(result.line() >= 0);
            assert.isTrue(result.character() >= 0);
            return { line: result.line(), character: result.character() };
        };
        return TypeScriptLS;
    })();
    exports.TypeScriptLS = TypeScriptLS;
});
