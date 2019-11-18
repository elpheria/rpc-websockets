module.exports = () =>
{
    describe(".constructor()", () =>
    {
        it("Expects name to be passed in first argument, and options in second")
        it("Throws an error if no namespace name is passed")
        it("Throws an error if passed name is not a string")
        it("Throws an error if options object is not an object")
        it("Allows to not pass options object")
        it("Throws an error if \"strict_notifications\" option is not boolean value")
        it("\"strict_notifications\" option is boolean \"true\" by default")
        it("Returns created namespace instance")
    })
}
