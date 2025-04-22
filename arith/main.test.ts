import { parseArith } from "../tiny-ts-parser.ts";
import { typecheck, typecheck_exercises } from "./main.ts";

import { assertEquals, assertThrows } from "jsr:@std/assert";

const testCases = {
  positive: [
    { name: "1", expected: { tag: "Number" } },
    { name: "1 + 2", expected: { tag: "Number" } },
    { name: "true", expected: { tag: "Boolean" } },
    { name: "false", expected: { tag: "Boolean" } },
    { name: "true ? 1 : 2", expected: { tag: "Number" } },
    { name: "true ? false : true", expected: { tag: "Boolean" } },
  ],
  negative: [
    { name: "1 + true", expected: "number expected" },
    { name: "false + 2", expected: "number expected" },
    { name: "true + false", expected: "number expected" },
    { name: "1 ? 1 : 2", expected: "boolean expected" },
    {
      name: "true ? 1 : true",
      expected: "then and else have different types",
    },
    {
      name: "true ? false : 2",
      expected: "then and else have different types",
    },
  ],
};

for (const { name, expected } of testCases.positive) {
  Deno.test({
    name: `typecheck/arith/positive/${name}`,
    fn: () => {
      const result = typecheck(parseArith(name));
      assertEquals(result, expected);
    },
  });
}

for (const { name, expected } of testCases.negative) {
  Deno.test({
    name: `typecheck/arith/negative/${name}`,
    fn: () => {
      assertThrows(() => {
        typecheck(parseArith(name));
      }, expected);
    },
  });
}

const testCases_exercises = {
  positive: [
    { name: "1 ? true : false", expected: { tag: "Boolean" } },
    { name: "(1 + 3) ? 2 : 1", expected: { tag: "Number" } },
  ],
  negative: [
    { name: "(1 + true) ? 1 : 2", expected: "number expected" },
    {
      name: "(1 ? 1 : false) ? 1 : 2",
      expected: "then and else have different types",
    },
  ],
};

for (const { name, expected } of testCases_exercises.positive) {
  Deno.test({
    name: `typecheck_exercises/arith/positive/${name}`,
    fn: () => {
      const result = typecheck_exercises(parseArith(name));
      assertEquals(result, expected);
    },
  });
}

for (const { name, expected } of testCases_exercises.negative) {
  Deno.test({
    name: `typecheck_exercises/arith/negative/${name}`,
    fn: () => {
      assertThrows(() => {
        typecheck_exercises(parseArith(name));
      }, expected);
    },
  });
}
