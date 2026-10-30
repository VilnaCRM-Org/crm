const COMMENT = String.raw`(?:\/\*[\s\S]*?\*\/|\/\/[^\n]*)`;

const modulesLayerImport = new RegExp(
  String.raw`(?:\bfrom\s*|\bimport\s*(?:\(\s*(?:${COMMENT}\s*)*)?)['"](?:@\/modules|@auth)`,
  'u'
);

export default modulesLayerImport;
