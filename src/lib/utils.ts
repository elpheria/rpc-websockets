"use strict"

export interface DataPack<
  T,
  R extends string | ArrayBufferLike | Blob | ArrayBufferView
> {
  encode(value: T): R;
  decode(value: R): T;
}

export class DefaultDataPack implements DataPack<Object, string>
{
    encode(value: Object): string
    {
        return JSON.stringify(value)
    }

    decode(value: string): Object
    {
        return JSON.parse(value)
    }
}
