interface DebugContentCollector {
    pullText(ts: number): string;
}

export class DebugHandler implements DebugContentCollector {
    private texts: string = '';

    pushText(text: string) {
        this.texts += text;
    }

    pushTextLine(text: string) {
        this.pushText(text + '\n');
    }

    pullText() {
        const str = this.texts;
        this.texts = '';
        return str;
    }
}

export class DebugHelper {
    private readonly handler = new Set<DebugContentCollector>();
    private htmlElem: HTMLElement | undefined;

    constructor() {
        const loop = () => {
            this.applyOnElem();
            requestAnimationFrame(loop);
        }
        requestAnimationFrame(loop);
    }

    setDebugElem(elem: HTMLElement) {
        this.htmlElem = elem;
    }

    registerDebugContentCollector(dcc: DebugContentCollector) {
        this.handler.add(dcc);
    }

    applyOnElem() {
        if (!this.htmlElem)
            return;

        let text = '';
        const ts = performance.now();

        for (const dcc of this.handler)
            text += dcc.pullText(ts);

        this.htmlElem.innerText = text;
    }
}

export const DEBUG = new DebugHelper();
