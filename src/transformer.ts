import * as ts from 'typescript'
import * as kind from 'ts-is-kind'

function transformer(ctx: ts.TransformationContext): ts.Transformer<ts.SourceFile> {
  const visitor: ts.Visitor = (node: ts.Node): ts.Node => {
    if (kind.isSourceFile(node)) {
      return ts.visitEachChild(node, visitor, ctx)
    }

    if (kind.isImportDeclaration(node)) {
      return updateImportNode(node, ctx)
    }
    return node
  }
  return (sf: ts.SourceFile) => {
    return ts.visitNode(sf, visitor)
  }
}

function updateImportNode(node: ts.Node, ctx: ts.TransformationContext): ts.Node {
  let identifierName: string

  const visitor: ts.Visitor = node => {
    if (kind.isNamedImports(node)) {
      identifierName = node.getChildAt(1).getText()
      return ts.createIdentifier(identifierName)
    }

    if (kind.isStringLiteral(node)) {
      const libName = node.getText().replace(/[\"\']/g, '')
      if (identifierName) {
        const fileName = camel2Dash(identifierName)
        return ts.createLiteral(`${libName}/lib/${fileName}`)
      }
    }

    if (node.getChildCount()) {
      return ts.visitEachChild(node, visitor, ctx)
    }
    return node
  }

  return ts.visitEachChild(node, visitor, ctx)
}

// from: https://github.com/ant-design/babel-plugin-import
function camel2Dash(_str: string) {
  const str = _str[0].toLowerCase() + _str.substr(1)
  return str.replace(/([A-Z])/g, ($1) => `-${$1.toLowerCase()}`)
}

export default transformer
