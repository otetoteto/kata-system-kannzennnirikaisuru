import { parse, parseRecFunc } from "../tiny-ts-parser.ts";
import { typecheck, typecheck_exercises } from "./main.ts";

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
    {
      name: "1; 2; 3; true;",
      expected: {
        tag: "Boolean",
      },
    },
    {
      name:
        "const x = (y: number) => y; const z = (w: number) => (x: number) => w + x; const a = z(x(1))(1); a;",
      expected: {
        tag: "Number",
      },
    },
    {
      name:
        "const x = (y: number) => y; const z = (s: (w: number) => number) => (x: number) => s(x); const a = z(x)(1); a;",
      expected: {
        tag: "Number",
      },
    },
    {
      name:
        "const x: (x: (x: number) => number) => number = (x: (x: number) => number) => x; x;",
      expected: {
        tag: "Func",
        params: [
          {
            name: "x",
            type: {
              tag: "Func",
              params: [{ name: "x", type: { tag: "Number" } }],
              retType: { tag: "Number" },
            },
          },
        ],
        retType: {
          tag: "Func",
          params: [{ name: "x", type: { tag: "Number" } }],
          retType: { tag: "Number" },
        },
      },
    },
    {
      name: "function x(x: number): number { return x; } x;",
      expected: {
        tag: "Func",
        params: [{ name: "x", type: { tag: "Number" } }],
        retType: { tag: "Number" },
      },
    },
    {
      name: "function x(y: number): number { return x(y); } x(1)",
      expected: {
        tag: "Number",
      },
    },
  ],
  negative: [
    { name: "x" },
    {
      name: "(x: number) => (y: boolean) => y ? x : z",
    },
    {
      name: "(x: number) => (y: boolean) => y ? x : false",
    },
    {
      name: "((x: number) => x)(true)",
    },
    {
      name: "((x: number) => x)(1, 2)",
    },
    {
      name: "1()",
    },
    {
      name: "function x(): number { return true; }",
    },
  ],
};

for (const { name, expected } of testCases.positive) {
  Deno.test({
    name: `typecheck/recfunc/positive/${name}`,
    fn: () => {
      const result = typecheck(parseRecFunc(name), {});
      assertObjectMatch(result, expected);
    },
  });
}

for (const { name } of testCases.negative) {
  Deno.test({
    name: `typecheck/recfunc/negative/${name}`,
    fn: () => {
      assertThrows(() => {
        typecheck(parseRecFunc(name), {});
      });
    },
  });
}

Deno.test({
  name: "演習問題",
  fn: () => {
    assertThrows(() => {
      typecheck_exercises(parse("(x: number): boolean => x + 1"), {});
    });

    assertObjectMatch(
      typecheck_exercises(
        parse("const x = (y: number): number => x(y); x(1)"),
        {},
      ),
      { tag: "Number" },
    );
  },
});
