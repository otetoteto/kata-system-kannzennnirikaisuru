import { TermForArith, TypeForArith } from "../tiny-ts-parser.ts";

/**
 * ## 判定基準
 *
 * - 足し算は Number 型同士であること
 * - 条件演算子の条件式は Boolean 型であること
 * - 条件演算子の返す型は一致すること
 */
export function typecheck(term: TermForArith): TypeForArith {
  switch (term.tag) {
    case "true":
      return { tag: "Boolean" };
    case "false":
      return { tag: "Boolean" };
    case "if": {
      const condType = typecheck(term.cond);
      if (condType.tag !== "Boolean") throw "boolean expected";
      const thenType = typecheck(term.thn);
      const elsType = typecheck(term.els);
      if (thenType.tag !== elsType.tag) {
        throw "then and else have different types";
      }
      return thenType;
    }
    case "number":
      return { tag: "Number" };
    case "add": {
      const leftType = typecheck(term.left);
      if (leftType.tag !== "Number") throw "number expected";
      const rightType = typecheck(term.right);
      if (rightType.tag !== "Number") throw "number expected";
      return { tag: "Number" };
    }
  }
}

/**
 * ## 判定基準
 *
 * - 足し算は Number 型同士であること
 * - 条件演算子の条件式は任意の方で良い
 * - 条件演算子の返す型は一致すること
 */
export function typecheck_exercises(term: TermForArith): TypeForArith {
  switch (term.tag) {
    case "true":
      return { tag: "Boolean" };
    case "false":
      return { tag: "Boolean" };
    case "if": {
      typecheck_exercises(term.cond); // cond の方チェックをしない場合は、ここで型エラーがある場合にチェックされない
      const thenType = typecheck_exercises(term.thn);
      const elsType = typecheck_exercises(term.els);
      if (thenType.tag !== elsType.tag) {
        throw "then and else have different types";
      }
      return thenType;
    }
    case "number":
      return { tag: "Number" };
    case "add": {
      const leftType = typecheck_exercises(term.left);
      if (leftType.tag !== "Number") throw "number expected";
      const rightType = typecheck_exercises(term.right);
      if (rightType.tag !== "Number") throw "number expected";
      return { tag: "Number" };
    }
  }
}
