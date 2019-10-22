/**
 * Creates a promise that can be resolved from the outside
 * @param {function} body - promise body
 * @returns {Promise}
 * @constructor
 */
function ExternallyResolvablePromise(body)
{
    let resolvePromise
    let rejectPromise
    const promise = new Promise((resolve, reject) =>
    {
        resolvePromise = resolve
        rejectPromise = reject
        if (body)
        {
            body()
        }
    })
    promise.resolve = resolvePromise
    promise.reject = rejectPromise
    return promise
}

module.exports = ExternallyResolvablePromise
