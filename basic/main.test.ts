import { parseBasic } from "../tiny-ts-parser.ts";
import { typecheck } from "./main.ts";

import { assertObjectMatch, assertThrows } from "jsr:@std/assert";

const testCases = {
  positive: [
    {
      name: "(x: number) => true",
      expected: {
        tag: "Func",
        params: [{ name: "x", type: { tag: "Number" } }],
        retType: { tag: "Boolean" },
      },
    },
    {
      name: "(x: number) => (y: number) => x + y",
      expected: {
        tag: "Func",
        params: [{ name: "x", type: { tag: "Number" } }],
        retType: {
          tag: "Func",
          params: [{ name: "y", type: { tag: "Number" } }],
          retType: { tag: "Number" },
        },
      },
    },
    {
      name: "((x: boolean) => x ? 1 : 2)(true)",
      expected: {
        tag: "Number",
      },
    },
    {
      name: "((x: number) => (y: boolean) => y ? x : 0)(1)",
      expected: {
        tag: "Func",
        params: [{ name: "y", type: { tag: "Boolean" } }],
        retType: { tag: "Number" },
      },
    },
    {
      name: "(x: number, y: number) => x + y",
      expected: {
        tag: "Func",
        params: [
          { name: "x", type: { tag: "Number" } },
          { name: "y", type: { tag: "Number" } },
        ],
        retType: { tag: "Number" },
      },
    },
  ],
  negative: [
    { name: "x", expected: "undefined variable: x" },
    {
      name: "(x: number) => (y: boolean) => y ? x : z",
      expected: "undefined variable: z",
    },
    {
      name: "(x: number) => (y: boolean) => y ? x : false",
      expected: "then and else have different types",
    },
    {
      name: "((x: number) => x)(true)",
      expected: "argument type mismatch: expected Number, but got Boolean",
    },
    {
      name: "((x: number) => x)(1, 2)",
      expected: "argument length mismatch",
    },
    {
      name: "1()",
      expected: "function expected",
    },
  ],
};

for (const { name, expected } of testCases.positive) {
  Deno.test({
    name: `typecheck/basic/positive/${name}`,
    fn: () => {
      const result = typecheck(parseBasic(name), {});
      assertObjectMatch(result, expected);
    },
  });
}

for (const { name, expected } of testCases.negative) {
  Deno.test({
    name: `typecheck/basic/negative/${name}`,
    fn: () => {
      assertThrows(() => {
        typecheck(parseBasic(name), {});
      }, expected);
    },
  });
}
