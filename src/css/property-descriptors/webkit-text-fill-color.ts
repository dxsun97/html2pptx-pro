import { IPropertyTypeValueDescriptor, PropertyDescriptorParsingType } from '../IPropertyDescriptor';
export const webkitTextFillColor: IPropertyTypeValueDescriptor = {
    name: `-webkit-text-fill-color`,
    initialValue: 'currentcolor',
    prefix: false,
    type: PropertyDescriptorParsingType.TYPE_VALUE,
    format: 'color'
};
