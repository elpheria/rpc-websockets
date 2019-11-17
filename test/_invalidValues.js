const NUMBER = [
    NaN,
    "", "   ", "123", "abs",
    true, false,
    [], ["some"], {}, {prop: "some"},
]

const NUMBER__INTEGER = [
    -3.18, 2.14
]

const NUMBER__POSITIVE = [
    -Infinity, -100, -2.34
]

const STRING = [
    -Infinity, -12, -3.18, 0, 1, 2.14, Infinity,
    true, false,
    [], ["some"], {}, {prop: "some"},
]

const STRING__NON_EMPTY = [
    ""
]

const STRING__FILLED = [
    ...STRING__NON_EMPTY,
    " ",
    "   "
]

const BOOLEAN = [
    -Infinity, -12, -3.18, 0, 1, 2.14, Infinity,
    "", " ", "abc",
    [], ["some"], {}, {prop: "some"}
]

const FUNCTION = [
    NaN,
    -Infinity, -12, -3.18, 0, 1, 2.14, Infinity,
    "", " ", "abc",
    true, false,
    [], ["some"], {}, {prop: "some"}
]

const ALL_INVALID = [
    NaN,
    -Infinity, -12, -3.18, 0, 1, 2.14, Infinity,
    "", "   ", "123", "abs",
    true, false,
    [], ["some"], {}, {prop: "some"},
]

module.exports = {
    NUMBER,
    NUMBER__INTEGER,
    NUMBER__POSITIVE,
    STRING,
    STRING__NON_EMPTY,
    STRING__FILLED,
    BOOLEAN,
    FUNCTION,
    ALL_INVALID
}
