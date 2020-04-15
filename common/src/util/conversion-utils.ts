import { classToPlain, ClassTransformOptions, plainToClass } from 'class-transformer';
import { ClassType } from 'class-transformer/ClassTransformer';



export class CommonTransformer {
  static plainToClassSingle<T, V>(cls: ClassType<T>, plain: V, options?: ClassTransformOptions): T {
    return plainToClass(cls, plain, options);
  }
  static plainToClassArray<T, V>(cls: ClassType<T>, plain: V[], options?: ClassTransformOptions): T[] {
    return plainToClass(cls, plain, options);
  }


  // tslint:disable-next-line: ban-types
  static classToPlainSingle<T>(object: T, options?: ClassTransformOptions): Object {
    return classToPlain(object, options);
  }

  // tslint:disable-next-line: ban-types
  static classToPlainArray<T>(object: T[], options?: ClassTransformOptions): Object[] {
    // tslint:disable-next-line: ban-types
    return classToPlain(object, options) as Object[];
  }
}