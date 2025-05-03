import { error, TermForObj, TypeForObj } from "../tiny-ts-parser.ts";

type TypeEnv = Record<string, TypeForObj>;

function typeEq(ty1: TypeForObj, ty2: TypeForObj): boolean {
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
    case "Object": {
      if (ty1.tag !== "Object") return false;
      if (ty1.props.length !== ty2.props.length) return false;
      for (const prop of ty1.props) {
        const found = ty2.props.find((p) => p.name === prop.name);
        if (!found) return false;
        if (!typeEq(prop.type, found.type)) return false;
      }
      return true;
    }
  }
}

export function typecheck(term: TermForObj, env: TypeEnv): TypeForObj {
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
    case "objectNew": {
      return {
        tag: "Object",
        props: term.props.map((prop) => ({
          name: prop.name,
          type: typecheck(prop.term, env),
        })),
      };
    }
    case "objectGet": {
      const objType = typecheck(term.obj, env);
      if (objType.tag !== "Object") {
        error("object type expected", term.obj);
      }
      const prop = objType.props.find((p) => p.name === term.propName);
      if (!prop) {
        error(`unknown property name: ${term.propName}`, term);
      }
      return prop.type;
    }
    default:
      throw new Error("not implemented yet");
  }
}
