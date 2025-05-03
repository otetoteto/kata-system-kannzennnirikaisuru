import {
  error,
  Term,
  TermForRecFunc,
  Type,
  TypeForRecFunc,
} from "../tiny-ts-parser.ts";

type TypeEnv = Record<string, TypeForRecFunc>;

function typeEq(ty1: TypeForRecFunc, ty2: TypeForRecFunc): boolean {
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
      if (!typeEq(ty1.retType, ty2.retType)) return false;
      return true;
    }
  }
}

export function typecheck(term: TermForRecFunc, env: TypeEnv): TypeForRecFunc {
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
        error("then and else have different types", term);
      }
      return thenType;
    }
    case "number":
      return { tag: "Number" };
    case "add": {
      const leftType = typecheck(term.left, env);
      if (leftType.tag !== "Number") error("number expected", term);
      const rightType = typecheck(term.right, env);
      if (rightType.tag !== "Number") error("number expected", term);
      return { tag: "Number" };
    }
    case "var": {
      // 未定義変数がある（envに対応する値がない）場合はエラー
      if (env[term.name] === undefined) {
        error(`undefined variable: ${term.name}`, term);
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
        error("argument length mismatch", term);
      }
      for (let i = 0; i < term.args.length; i++) {
        const argType = typecheck(term.args[i], env);
        const paramType = funcType.params[i].type;
        if (!typeEq(argType, paramType)) {
          error(
            `argument type mismatch: expected ${paramType.tag}, but got ${argType.tag}`,
            term,
          );
        }
      }
      return funcType.retType;
    }
    case "seq": {
      typecheck(term.body, env);
      return typecheck(term.rest, env);
    }
    // const x = 1; x;
    //       ^   ^  ^
    //    name init rest
    case "const": {
      const ty = typecheck(term.init, env);
      const newEnv = { ...env, [term.name]: ty };
      return typecheck(term.rest, newEnv);
    }
    case "recFunc": {
      const funcTy: TypeForRecFunc = {
        tag: "Func",
        params: term.params,
        retType: term.retType,
      };
      const funcEnv = { ...env, [term.funcName]: funcTy };
      for (const param of term.params) {
        funcEnv[param.name] = param.type;
      }
      const ty = typecheck(term.body, funcEnv);
      if (!typeEq(ty, term.retType)) {
        error("return type mismatch", term);
      }
      const restEnv = { ...env, [term.funcName]: funcTy };
      return typecheck(term.rest, restEnv);
    }
    default:
      throw new Error("not implemented yet");
  }
}

function typeEq_exercises(ty1: Type, ty2: Type): boolean {
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
        if (!typeEq_exercises(ty1.params[i].type, ty2.params[i].type)) {
          return false;
        }
      }
      if (!typeEq_exercises(ty1.retType, ty2.retType)) return false;
      return true;
    }
    default:
      throw new Error("not implemented yet");
  }
}

export function typecheck_exercises(
  term: Term,
  env: Record<string, Type>,
): Type {
  switch (term.tag) {
    case "true":
      return { tag: "Boolean" };
    case "false":
      return { tag: "Boolean" };
    case "if": {
      typecheck_exercises(term.cond, env);
      const thenType = typecheck_exercises(term.thn, env);
      const elsType = typecheck_exercises(term.els, env);
      if (!typeEq_exercises(thenType, elsType)) {
        error("then and else have different types", term);
      }
      return thenType;
    }
    case "number":
      return { tag: "Number" };
    case "add": {
      const leftType = typecheck_exercises(term.left, env);
      if (leftType.tag !== "Number") error("number expected", term);
      const rightType = typecheck_exercises(term.right, env);
      if (rightType.tag !== "Number") error("number expected", term);
      return { tag: "Number" };
    }
    case "var": {
      // 未定義変数がある（envに対応する値がない）場合はエラー
      if (env[term.name] === undefined) {
        error(`undefined variable: ${term.name}`, term);
      }
      return env[term.name];
    }
    case "func": {
      // env は関数ごとに作成される。また外界の env を変更しないため、新しい env をコピーする
      const newEnv = { ...env };
      for (const { name, type } of term.params) {
        newEnv[name] = type;
      }
      const retType = typecheck_exercises(term.body, newEnv);
      if (term.retType && !typeEq_exercises(retType, term.retType)) {
        error("return type mismatch", term);
      }
      return {
        tag: "Func",
        params: term.params,
        retType,
      };
    }
    case "call": {
      const funcType = typecheck_exercises(term.func, env);
      if (funcType.tag !== "Func") throw "function expected";
      if (funcType.params.length !== term.args.length) {
        error("argument length mismatch", term);
      }
      for (let i = 0; i < term.args.length; i++) {
        const argType = typecheck_exercises(term.args[i], env);
        const paramType = funcType.params[i].type;
        if (!typeEq_exercises(argType, paramType)) {
          error(
            `argument type mismatch: expected ${paramType.tag}, but got ${argType.tag}`,
            term,
          );
        }
      }
      return funcType.retType;
    }
    case "seq": {
      typecheck_exercises(term.body, env);
      return typecheck_exercises(term.rest, env);
    }
    // const x = 1; x;
    //       ^   ^  ^
    //    name init rest
    case "const": {
      const initEnv = { ...env };
      if (term.init.tag === "func" && term.init.retType !== undefined) {
        initEnv[term.name] = {
          tag: "Func",
          params: term.init.params,
          retType: term.init.retType,
        };
      }
      const ty = typecheck_exercises(term.init, initEnv);
      if (term.init.tag === "func" && term.init.retType !== undefined) {
        if (
          !typeEq_exercises(ty, {
            tag: "Func",
            params: term.init.params,
            retType: term.init.retType,
          })
        ) {
          error("return type mismatch", term);
        }
      }

      const newEnv = { ...env, [term.name]: ty };
      return typecheck_exercises(term.rest, newEnv);
    }
    case "recFunc": {
      const funcTy: Type = {
        tag: "Func",
        params: term.params,
        retType: term.retType,
      };
      const funcEnv = { ...env, [term.funcName]: funcTy };
      for (const param of term.params) {
        funcEnv[param.name] = param.type;
      }
      const ty = typecheck_exercises(term.body, funcEnv);
      if (!typeEq_exercises(ty, term.retType)) {
        error("return type mismatch", term);
      }
      const restEnv = { ...env, [term.funcName]: funcTy };
      return typecheck_exercises(term.rest, restEnv);
    }
    default:
      throw new Error("not implemented yet");
  }
}
