/// <reference path="./typescriptServices.d.ts" />

declare var assert: any;

export class ScriptInfo {
    public version: number = 1;
    public editRanges: { length: number; textChangeRange: TypeScript.TextChangeRange; }[] = [];
    public lineMap: TypeScript.LineMap = null;

    constructor(public fileName: string, public content: string, public isOpen = true) {
        this.setContent(content);
    }

    private setContent(content: string): void {
        this.content = content;
        this.lineMap = TypeScript.LineMap1.fromString(content);
    }

    public updateContent(content: string): void {
        this.editRanges = [];
        this.setContent(content);
        this.version++;
    }

    public editContent(minChar: number, limChar: number, newText: string): void {
        // Apply edits
        var prefix = this.content.substring(0, minChar);
        var middle = newText;
        var suffix = this.content.substring(limChar);
        this.setContent(prefix + middle + suffix);

        // Store edit range + new length of script
        this.editRanges.push({
            length: this.content.length,
            textChangeRange: new TypeScript.TextChangeRange(
                TypeScript.TextSpan.fromBounds(minChar, limChar), newText.length)
        });

        // Update version #
        this.version++;
    }

    public getTextChangeRangeBetweenVersions(startVersion: number, endVersion: number): TypeScript.TextChangeRange {
        if (startVersion === endVersion) {
            // No edits!
            return TypeScript.TextChangeRange.unchanged;
        }

        var initialEditRangeIndex = this.editRanges.length - (this.version - startVersion);
        var lastEditRangeIndex = this.editRanges.length - (this.version - endVersion);

        var entries = this.editRanges.slice(initialEditRangeIndex, lastEditRangeIndex);
        return TypeScript.TextChangeRange.collapseChangesAcrossMultipleVersions(entries.map(e => e.textChangeRange));
    }
}

class ScriptSnapshotShim implements ts.ScriptSnapshotShim {
    private lineMap: TypeScript.LineMap = null;
    private textSnapshot: string;
    private version: number;

    constructor(private scriptInfo: ScriptInfo) {
        this.textSnapshot = scriptInfo.content;
        this.version = scriptInfo.version;
    }

    public getText(start: number, end: number): string {
        return this.textSnapshot.substring(start, end);
    }

    public getLength(): number {
        return this.textSnapshot.length;
    }

    public getLineStartPositions(): string {
        if (this.lineMap === null) {
            this.lineMap = TypeScript.LineMap1.fromString(this.textSnapshot);
        }

        return JSON.stringify(this.lineMap.lineStarts());
    }

    public getTextChangeRangeSinceVersion(scriptVersion: number): string {
        var range = this.scriptInfo.getTextChangeRangeBetweenVersions(scriptVersion, this.version);
        if (range === null) {
            return null;
        }

        return JSON.stringify({ span: { start: range.span().start(), length: range.span().length() }, newLength: range.newLength() });
    }
}

class CancellationToken {
    public static None: CancellationToken = new CancellationToken(null);

    constructor(private cancellationToken: ts.CancellationToken) {
    }

    public isCancellationRequested() {
        return this.cancellationToken && this.cancellationToken.isCancellationRequested();
    }
}

export class TypeScriptLS implements ts.LanguageServiceShimHost {
    private ls: ts.LanguageServiceShim = null;

    private fileNameToScript: ts.Map<ScriptInfo> = {};

    constructor(private cancellationToken: ts.CancellationToken = CancellationToken.None) {
    }

    public getHostIdentifier(): string {
        return "TypeScriptLS";
    }

    private getScriptInfo(fileName: string): ScriptInfo {
        return this.fileNameToScript[fileName];
    }

    public addScript(fileName: string, content: string) {
        this.fileNameToScript[fileName] = new ScriptInfo(fileName, content);
    }

    public updateScript(fileName: string, content: string) {
        var script = this.getScriptInfo(fileName);
        if (script) {
            script.updateContent(content);
            return;
        }

        this.addScript(fileName, content);
    }

    public editScript(fileName: string, minChar: number, limChar: number, newText: string) {
        var script = this.getScriptInfo(fileName);
        if (script) {
            script.editContent(minChar, limChar, newText);
            return;
        }

        throw new Error("No script with name '" + fileName + "'");
    }

    //////////////////////////////////////////////////////////////////////
    // ILogger implementation
    //
    public information(): boolean { return false; }
    public debug(): boolean { return true; }
    public warning(): boolean { return true; }
    public error(): boolean { return true; }
    public fatal(): boolean { return true; }

    public log(s: string): void {
        // For debugging...
        //TypeScript.Environment.standardOut.WriteLine("TypeScriptLS:" + s);
    }

    //////////////////////////////////////////////////////////////////////
    // LanguageServiceShimHost implementation
    //

    /// Returns json for Tools.CompilationSettings
    public getCompilationSettings(): string {
        return JSON.stringify({}); // i.e. default settings
    }

    public getCancellationToken(): ts.CancellationToken {
        return this.cancellationToken;
    }

    public getScriptFileNames(): string {
        var fileNames: string[] = [];
        ts.forEachKey(this.fileNameToScript, (fileName) => { fileNames.push(fileName); });
        return JSON.stringify(fileNames);
    }

    public getScriptSnapshot(fileName: string): ts.ScriptSnapshotShim {
        return new ScriptSnapshotShim(this.getScriptInfo(fileName));
    }

    public getScriptVersion(fileName: string): number {
        return this.getScriptInfo(fileName).version;
    }

    public getScriptIsOpen(fileName: string): boolean {
        return this.getScriptInfo(fileName).isOpen;
    }

    public getLocalizedDiagnosticMessages(): string {
        return JSON.stringify({});
    }

    /** Return a new instance of the language service shim, up-to-date wrt to typecheck.
     *  To access the non-shim (i.e. actual) language service, use the "ls.languageService" property.
     */
    public getLanguageService(): ts.LanguageServiceShim {
        return this.ls = new TypeScript.Services.TypeScriptServicesFactory().createLanguageServiceShim(this);
    }

    /** Parse file given its source text */
    public parseSourceText(fileName: string, sourceText: TypeScript.IScriptSnapshot): TypeScript.SourceUnitSyntax {
        return TypeScript.Parser.parse(fileName, TypeScript.SimpleText.fromScriptSnapshot(sourceText), ts.ScriptTarget.ES5, TypeScript.isDTSFile(fileName)).sourceUnit();
    }

    /**
     * @param line 1 based index
     * @param col 1 based index
     */
    public lineColToPosition(fileName: string, line: number, col: number): number {
        var script: ScriptInfo = this.fileNameToScript[fileName];
        assert.isNotNull(script);
        assert.isTrue(line >= 1);
        assert.isTrue(col >= 1);

        return script.lineMap.getPosition(line - 1, col - 1);
    }

    /**
     * @param line 0 based index
     * @param col 0 based index
     */
    public positionToZeroBasedLineCol(fileName: string, position: number): TypeScript.ILineAndCharacter {
        var script: ScriptInfo = this.fileNameToScript[fileName];
        assert.isNotNull(script);

        var result = script.lineMap.getLineAndCharacterFromPosition(position);

        assert.isTrue(result.line() >= 0);
        assert.isTrue(result.character() >= 0);
        return { line: result.line(), character: result.character() };
    }
}