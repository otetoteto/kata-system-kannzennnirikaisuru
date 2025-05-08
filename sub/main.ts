import { error, TermForSub, TypeForSub } from "../tiny-ts-parser.ts";

type TypeEnv = Record<string, TypeForSub>;

/**
 * ty1 が ty2 の部分型であるかを判定する
 */
function subtype(ty1: TypeForSub, ty2: TypeForSub): boolean {
  switch (ty2.tag) {
    case "Boolean":
      return ty1.tag === "Boolean";
    case "Number":
      return ty1.tag === "Number";
    case "Func": {
      if (ty1.tag !== "Func") return false;
      if (ty1.params.length !== ty2.params.length) return false;
      // 返り値１の型が返り値２の部分型であることのチェック（共変）
      if (!subtype(ty1.retType, ty2.retType)) return false;
      // 引数２の型が引数１の型の部分型であることのチェック（反変）
      for (let i = 0; i < ty1.params.length; i++) {
        if (!subtype(ty2.params[i].type, ty1.params[i].type)) return false;
      }
      return true;
    }
    case "Object": {
      if (ty1.tag !== "Object") return false;
      for (const prop2 of ty2.props) {
        const prop1 = ty1.props.find((p) => p.name === prop2.name);
        if (prop1 === undefined) return false;
        if (!subtype(prop1.type, prop2.type)) return false;
      }
      return true;
    }
    default:
      throw new Error("unreachable");
  }
}

export function typecheck(term: TermForSub, env: TypeEnv): TypeForSub {
  switch (term.tag) {
    case "true":
      return { tag: "Boolean" };
    case "false":
      return { tag: "Boolean" };
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
        if (!subtype(argType, paramType)) {
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
