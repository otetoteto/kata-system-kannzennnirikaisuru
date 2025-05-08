import { parseSub } from "../tiny-ts-parser.ts";
import { typecheck } from "./main.ts";

import { assertObjectMatch, assertThrows } from "jsr:@std/assert";

const testCases = {
  positive: [
    {
      name: "const x = (x: { foo: number }) => x.foo; x({foo: 1, bar: 2})",
      expected: {
        tag: "Number",
      },
    },
    {
      name:
        "const x = (x: { foo: number; bar: number }) => x.foo; x({foo: 1, bar: 2})",
      expected: {
        tag: "Number",
      },
    },
    {
      name:
        "const x = (a: () => { foo: number; }) => a(); x(() => ({foo: 1, bar: false}))",
      expected: {
        tag: "Object",
        props: [
          { name: "foo", type: { tag: "Number" } },
        ],
      },
    },
    {
      name:
        "const x = (a: (x: { foo: number; bar: boolean }) => number) => a({ foo: 1, bar: false }); x((x: { foo: number; }) => x.foo)",
      expected: {
        tag: "Number",
      },
    },
  ],
  negative: [
    {
      name:
        "const x = (x: { foo: number; bar: boolean }) => x.foo; x({bar: true})",
    },
    {
      name:
        "const x = (a: () => { foo: number; bar: number }) => a(); x(() => ({foo: 1}))",
    },
    {
      name:
        "const x = (a: (x: { foo: number; }) => number) => a({ foo: 1 }); x((x: { foo: number; bar: number }) => x.foo)",
    },
  ],
};

for (const { name, expected } of testCases.positive) {
  Deno.test({
    name: `typecheck/sub/positive/${name}`,
    fn: () => {
      const result = typecheck(parseSub(name), {});
      assertObjectMatch(result, expected);
    },
  });
}

for (const { name } of testCases.negative) {
  Deno.test({
    name: `typecheck/sub/negative/${name}`,
    fn: () => {
      assertThrows(() => {
        typecheck(parseSub(name), {});
      });
    },
  });
}
