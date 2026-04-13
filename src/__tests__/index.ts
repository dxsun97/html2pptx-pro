import html2pptx from '../index';

import { PptxRenderer } from '../render/pptx/pptx-renderer';
import { DocumentCloner } from '../dom/document-cloner';
import { COLORS } from '../css/types/color';

jest.mock('../core/logger');
jest.mock('../css/layout/bounds');
jest.mock('../dom/document-cloner');
jest.mock('../dom/node-parser', () => {
    return {
        isBodyElement: () => false,
        isHTMLElement: () => false,
        parseTree: jest.fn().mockImplementation(() => {
            return { styles: {}, restoreTree: jest.fn() };
        })
    };
});

jest.mock('../render/stacking-context');
jest.mock('../render/pptx/pptx-renderer');

describe('html2pptx', () => {
    const element = {
        ownerDocument: {
            defaultView: {
                document: {
                    createElement: () => ({ href: '' })
                },
                location: { href: 'http://localhost/' },
                pageXOffset: 12,
                pageYOffset: 34,
                innerWidth: 800,
                innerHeight: 600
            }
        }
    } as unknown as HTMLElement;

    it('should render with an element', async () => {
        DocumentCloner.destroy = jest.fn().mockReturnValue(true);
        await html2pptx(element);
        expect(PptxRenderer).toHaveBeenLastCalledWith(
            expect.objectContaining({
                cache: expect.any(Object),
                logger: expect.any(Object),
                windowBounds: expect.objectContaining({ left: 12, top: 34 })
            }),
            expect.objectContaining({
                backgroundColor: 0xffffffff,
                scale: 1,
                height: 50,
                width: 200
            })
        );
        expect(DocumentCloner.destroy).toBeCalled();
    });

    it('should have transparent background with backgroundColor: null', async () => {
        await html2pptx(element, { backgroundColor: null });
        expect(PptxRenderer).toHaveBeenLastCalledWith(
            expect.anything(),
            expect.objectContaining({
                backgroundColor: COLORS.TRANSPARENT
            })
        );
    });

    it('should not remove cloned window when removeContainer: false', async () => {
        DocumentCloner.destroy = jest.fn();
        await html2pptx(element, { removeContainer: false });
        expect(PptxRenderer).toHaveBeenLastCalledWith(
            expect.anything(),
            expect.objectContaining({
                backgroundColor: 0xffffffff,
                scale: 1,
                height: 50,
                width: 200
            })
        );
        expect(DocumentCloner.destroy).not.toBeCalled();
    });

    it('should pass presentation metadata', async () => {
        await html2pptx(element, {
            title: 'Test Presentation',
            author: 'Test Author',
            company: 'Test Company'
        });
        expect(PptxRenderer).toHaveBeenLastCalledWith(
            expect.anything(),
            expect.objectContaining({
                title: 'Test Presentation',
                author: 'Test Author',
                company: 'Test Company'
            })
        );
    });
});
