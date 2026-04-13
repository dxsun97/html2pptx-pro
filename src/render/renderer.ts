import { Context } from '../core/context';
import { PptxRenderConfigurations } from './pptx/pptx-renderer';

export class Renderer {
    constructor(
        protected readonly context: Context,
        protected readonly options: PptxRenderConfigurations
    ) {}
}
