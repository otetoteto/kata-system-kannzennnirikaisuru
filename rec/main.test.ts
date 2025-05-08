import { expandType } from "./main.ts";

import { parseRec } from "../tiny-ts-parser.ts";
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
    name: `typecheck/rec/positive/${name}`,
    fn: () => {
      const result = typecheck(parseRec(name), {});
      assertObjectMatch(result, expected);
    },
  });
}

for (const { name } of testCases.negative) {
  Deno.test({
    name: `typecheck/rec/negative/${name}`,
    fn: () => {
      assertThrows(() => {
        typecheck(parseRec(name), {});
      });
    },
  });
}

Deno.test("rec", () => {
  const code = `
type NumStream = { num: number; rest: () => NumStream };

function numbers(n: number): NumStream {
	return { num: n, rest: () => numbers(n + 1) };
}

numbers(1).rest();
`;
  const ret = typecheck(parseRec(code), {});
  assertObjectMatch(ret, {
    tag: "Rec",
    name: "NumStream",
    type: {
      tag: "Object",
      props: [
        { name: "num", type: { tag: "Number" } },
        {
          name: "rest",
          type: {
            tag: "Func",
            params: [],
            retType: {
              tag: "TypeVar",
              name: "NumStream",
            },
          },
        },
      ],
    },
  });

  const code2 = `
type A = { x: () => A };
type B = { x: () => B };

function a(x: number): A {
	return a(1);
}

function f(b: B): B {
	return b.x();
}

f(a(1));

type C = { c: { d: C } };
type D = { d: { c: D } };

function c(x: number): C {
	return c(1);
}

function g(d: { c: D }): D {
	return d.c;
}

g(c(1));

1;`;
  const ret2 = typecheck(parseRec(code2), {});
  assertObjectMatch(ret2, {
    tag: "Number",
  });
});

Deno.test("expandType", () => {
  const ret = expandType(
    { tag: "Func", params: [], retType: { tag: "TypeVar", "name": "X" } },
    "X",
    {
      tag: "Rec",
      name: "X",
      type: { tag: "Func", params: [], retType: { tag: "TypeVar", name: "X" } },
    },
  );
  assertObjectMatch(ret, {
    tag: "Func",
    params: [],
    retType: {
      tag: "Rec",
      name: "X",
      type: {
        tag: "Func",
        params: [],
        retType: { tag: "TypeVar", name: "X" },
      },
    },
  });

  assertObjectMatch(
    expandType(ret, "X", {
      tag: "Rec",
      name: "X",
      type: {
        tag: "Func",
        params: [],
        retType: { tag: "TypeVar", name: "X" },
      },
    }),
    {
      tag: "Func",
      params: [],
      retType: {
        tag: "Rec",
        name: "X",
        type: {
          tag: "Func",
          params: [],
          retType: { tag: "TypeVar", name: "X" },
        },
      },
    },
  );
});
