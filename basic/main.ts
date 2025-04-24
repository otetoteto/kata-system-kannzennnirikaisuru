import { TermForBasic, TypeForBasic } from "./../tiny-ts-parser.ts";

type TypeEnv = Record<string, TypeForBasic>;

function typeEq(ty1: TypeForBasic, ty2: TypeForBasic): boolean {
  switch (ty2.tag) {
    case "Boolean":
      return ty1.tag === "Boolean";
    case "Number":
      return ty1.tag === "Number";
    case "Func": {
      // 仮引数の数、型、戻り値の型が一致するか
      // 引数の名前は関係しない
      if (ty1.tag !== "Func") return false;
      if (ty1.params.length !== ty2.params.length) return false;
      for (let i = 0; i < ty1.params.length; i++) {
        if (!typeEq(ty1.params[i].type, ty2.params[i].type)) return false;
      }
      if (typeEq(ty1.retType, ty2.retType)) return false;
      return true;
    }
  }
}

export function typecheck(term: TermForBasic, env: TypeEnv): TypeForBasic {
  switch (term.tag) {
    case "true":
      return { tag: "Boolean" };
    case "false":
      return { tag: "Boolean" };
    case "if": {
      typecheck(term.cond, env);
      const thenType = typecheck(term.thn, env);
      const elsType = typecheck(term.els, env);
      if (!typeEq(thenType, elsType)) {
        throw "then and else have different types";
      }
      return thenType;
    }
    case "number":
      return { tag: "Number" };
    case "add": {
      const leftType = typecheck(term.left, env);
      if (leftType.tag !== "Number") throw "number expected";
      const rightType = typecheck(term.right, env);
      if (rightType.tag !== "Number") throw "number expected";
      return { tag: "Number" };
    }
    case "var": {
      // 未定義変数がある（envに対応する値がない）場合はエラー
      if (env[term.name] === undefined) {
        throw new Error(`undefined variable: ${term.name}`);
      }
      return env[term.name];
    }
    case "func": {
      // env は関数ごとに作成される。また外界の env を変更しないため、新しい env をコピーする
      const newEnv = { ...env };
      for (const { name, type } of term.params) {
        newEnv[name] = type;
      }
      const retType = typecheck(term.body, newEnv);
      return {
        tag: "Func",
        params: term.params,
        retType,
      };
    }
    case "call": {
      const funcType = typecheck(term.func, env);
      if (funcType.tag !== "Func") throw "function expected";
      if (funcType.params.length !== term.args.length) {
        throw "argument length mismatch";
      }
      for (let i = 0; i < term.args.length; i++) {
        const argType = typecheck(term.args[i], env);
        const paramType = funcType.params[i].type;
        if (!typeEq(argType, paramType)) {
          throw new Error(
            `argument type mismatch: expected ${paramType.tag}, but got ${argType.tag}`,
          );
        }
      }
      return funcType.retType;
    }
    default:
      throw new Error("not implemented yet");
  }
}
