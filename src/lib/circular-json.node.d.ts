declare module 'circular-json' {
    import CircularJSON from 'circular-json';

    function stringify(value: any): string
    function parse(text: string): any
}