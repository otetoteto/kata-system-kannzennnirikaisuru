import { error, TermForRec, TypeForRec } from "../tiny-ts-parser.ts";

type TypeEnv = Record<string, TypeForRec>;

/**
 * 再帰型の本体Tに現れる型変数Xを、その再帰型（μX.T）で置き換える
 *
 * 例えば、次のような型があるとする。
 * ```
 * type X = { foo: X }; // μX.{ foo: X }
 * ```
 * この型 X を { foo: μX.{ foo: X } } に置き換える
 *
 * @param ty 置き換え対象の型 T
 * @param tyVarName 置き換えたい型変数の名前 X
 * @param repTy 型変数の部分を置き換える型 μX.T
 */
export function expandType(
  ty: TypeForRec,
  tyVarName: string,
  repTy: TypeForRec,
): TypeForRec {
  switch (ty.tag) {
    case "Number":
    case "Boolean":
      return ty;
    case "Func": {
      return {
        tag: "Func",
        params: ty.params.map((param) => ({
          name: param.name,
          type: expandType(param.type, tyVarName, repTy),
        })),
        retType: expandType(ty.retType, tyVarName, repTy),
      };
    }
    case "Object": {
      return {
        tag: "Object",
        props: ty.props.map((prop) => ({
          name: prop.name,
          type: expandType(prop.type, tyVarName, repTy),
        })),
      };
    }
    case "TypeVar": {
      return ty.name === tyVarName ? repTy : ty;
    }
    case "Rec": {
      if (ty.name === tyVarName) return ty;
      return {
        tag: "Rec",
        name: ty.name,
        type: expandType(ty.type, tyVarName, repTy),
      };
    }
    default:
      throw new Error("not implemented yet");
  }
}

function simplifyType(ty: TypeForRec): TypeForRec {
  if (ty.tag === "Rec") {
    return simplifyType(expandType(ty.type, ty.name, ty));
  }
  return ty;
}

function typeEqNaive(
  ty1: TypeForRec,
  ty2: TypeForRec,
  map: Record<string, string>,
): boolean {
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
        if (!typeEqNaive(ty1.params[i].type, ty2.params[i].type, map)) {
          return false;
        }
      }
      if (!typeEqNaive(ty1.retType, ty2.retType, map)) return false;
      return true;
    }
    case "Object": {
      if (ty1.tag !== "Object") return false;
      if (ty1.props.length !== ty2.props.length) return false;
      for (const prop of ty1.props) {
        const found = ty2.props.find((p) => p.name === prop.name);
        if (!found) return false;
        if (!typeEqNaive(prop.type, found.type, map)) return false;
      }
      return true;
    }
    case "TypeVar": {
      if (ty1.tag !== "TypeVar") return false;
      if (map[ty1.name] === undefined) {
        throw new Error(`unknown type variables: ${ty1.name}`);
      }
      return map[ty1.name] === ty2.name;
    }
    case "Rec": {
      if (ty1.tag !== "Rec") return false;
      const newMap = { ...map, [ty1.name]: ty2.name };
      return typeEqNaive(ty1.type, ty2.type, newMap);
    }
    default:
      throw new Error("not implemented yet");
  }
}

function typeEqSub(
  ty1: TypeForRec,
  ty2: TypeForRec,
  seen: [TypeForRec, TypeForRec][],
): boolean {
  for (const [_ty1, _ty2] of seen) {
    if (typeEqNaive(ty1, _ty1, {}) && typeEqNaive(ty2, _ty2, {})) {
      return true;
    }
  }

  if (ty1.tag === "Rec") {
    return typeEqSub(simplifyType(ty1), ty2, [...seen, [ty1, ty2]]);
  }
  if (ty2.tag === "Rec") {
    return typeEqSub(ty1, simplifyType(ty2), [...seen, [ty1, ty2]]);
  }
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
        if (!typeEqSub(ty1.params[i].type, ty2.params[i].type, seen)) {
          return false;
        }
      }
      if (!typeEqSub(ty1.retType, ty2.retType, seen)) return false;
      return true;
    }
    case "Object": {
      if (ty1.tag !== "Object") return false;
      if (ty1.props.length !== ty2.props.length) return false;
      for (const prop of ty1.props) {
        const found = ty2.props.find((p) => p.name === prop.name);
        if (!found) return false;
        if (!typeEqSub(prop.type, found.type, seen)) return false;
      }
      return true;
    }
    case "TypeVar": {
      throw "unreachable";
    }
  }
}

function typeEq(ty1: TypeForRec, ty2: TypeForRec): boolean {
  return typeEqSub(ty1, ty2, []);
}

export function typecheck(term: TermForRec, env: TypeEnv): TypeForRec {
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
      const leftType = simplifyType(typecheck(term.left, env));
      if (leftType.tag !== "Number") error("number expected", term);
      const rightType = simplifyType(typecheck(term.right, env));
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
      const funcType = simplifyType(typecheck(term.func, env));
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
      const objType = simplifyType(typecheck(term.obj, env));
      if (objType.tag !== "Object") {
        error("object type expected", term.obj);
      }
      const prop = objType.props.find((p) => p.name === term.propName);
      if (!prop) {
        error(`unknown property name: ${term.propName}`, term);
      }
      return prop.type;
    }
    case "recFunc": {
      const funcTy: TypeForRec = {
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
