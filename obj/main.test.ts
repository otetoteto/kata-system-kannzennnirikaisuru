import { parseObj } from "../tiny-ts-parser.ts";
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
      name: "({x: 1, y: 2})",
      expected: {
        tag: "Object",
        props: [
          { name: "x", type: { tag: "Number" } },
          { name: "y", type: { tag: "Number" } },
        ],
      },
    },
    {
      name: "const x = {x: true, y: 2}; x.x;",
      expected: {
        tag: "Boolean",
      },
    },
    {
      name:
        "const x = (x: {x: number; y: boolean}) => x.x; x({x: 1, y: true});",
      expected: {
        tag: "Number",
      },
    },
    {
      name:
        "const x = (x: {x: number; y: {x: {x: boolean}}}) => x.y.x; x({x: 1, y: {x: {x: false}}});",
      expected: {
        tag: "Object",
        props: [
          { name: "x", type: { tag: "Boolean" } },
        ],
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
      name: "const x = {x: true, y: 2}; x.z;",
    },
    {
      name:
        "const x = (x: {x: number; y: boolean}) => x.x; x({x: 1, y: true, z: ({x: 1})});",
    },
  ],
};

for (const { name, expected } of testCases.positive) {
  Deno.test({
    name: `typecheck/obj/positive/${name}`,
    fn: () => {
      const result = typecheck(parseObj(name), {});
      assertObjectMatch(result, expected);
    },
  });
}

for (const { name } of testCases.negative) {
  Deno.test({
    name: `typecheck/obj/negative/${name}`,
    fn: () => {
      assertThrows(() => {
        typecheck(parseObj(name), {});
      });
    },
  });
}
