"use strict"

const errors = new Map([
    [-32000, "Event not provided"],
    [-32600, "Invalid Request"],
    [-32601, "Method not found"],
    [-32602, "Invalid params"],
    [-32603, "Internal error"],
    [-32604, "Params not found"],
    [-32605, "Method forbidden"],
    [-32606, "Event forbidden"],
    [-32700, "Parse error"]
])

interface IRPCError {
    code: number;
    message: string;
    data?: string;
}

export interface DataPack <T, R extends string | ArrayBufferLike | Blob | ArrayBufferView> {
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

/**
 * Creates a JSON-RPC 2.0-compliant error.
 * @param {Number} code - error code
 * @param {String} details - error details
 * @return {Object}
 */
function createError(code: number, details?: string)
{
    const error: IRPCError = {
        code: code,
        message: errors.get(code) || "Internal Server Error"
    }

    if (details)
        error["data"] = details

    return error
}

export { createError }
