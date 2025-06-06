import { parseBasic, parseBasic2 } from "../tiny-ts-parser.ts";
import { typecheck, typecheck2, typecheck_exercises } from "./main.ts";

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

for (const { name } of testCases.negative) {
  Deno.test({
    name: `typecheck/basic/negative/${name}`,
    fn: () => {
      assertThrows(() => {
        typecheck(parseBasic(name), {});
      });
    },
  });
}

Deno.test({
  name: "演習問題: 新しくコピーした環境を作成しない場合の問題点の確認",
  fn: () => {
    const result = typecheck_exercises(
      parseBasic("((x: number) => 1)(x)"),
      {},
    );
    // Number 型として認識されてしまう
    assertObjectMatch(result, {
      tag: "Number",
    });
  },
});

for (const { name, expected } of testCases.positive) {
  Deno.test({
    name: `typecheck/basic2/positive/${name}`,
    fn: () => {
      const result = typecheck2(parseBasic2(name), {});
      assertObjectMatch(result, expected);
    },
  });
}

for (const { name } of testCases.negative) {
  Deno.test({
    name: `typecheck/basic2/negative/${name}`,
    fn: () => {
      assertThrows(() => {
        typecheck2(parseBasic2(name), {});
      });
    },
  });
}
